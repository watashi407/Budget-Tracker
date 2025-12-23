import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseRealtime } from '@/presentation/hooks/useSupabaseRealtime'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/domain/entities/Transaction'
import { SupabaseTransactionRepository } from '@/data/repositories/SupabaseTransactionRepository'
import { useAuth } from '@/presentation/context/AuthContext'
import { queryKeys } from '@/lib/queryFactories'
import { QUERY_CONFIG } from '@/constants/ui'

const transactionRepository = new SupabaseTransactionRepository()

/**
 * Custom hook for transaction CRUD operations using TanStack Query
 * Includes optimistic updates for instant UI feedback.
 */
export function useTransactions(budgetId?: string) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const queryKey = user
        ? budgetId
            ? queryKeys.transactions.byBudget(budgetId)
            : queryKeys.transactions.byUser(user.id)
        : queryKeys.transactions.all

    useSupabaseRealtime({
        tableName: 'transactions',
        queryKey: queryKey as string[],
    })

    // Fetch Transactions
    const { data: transactions = [], isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!user) return []
            return budgetId
                ? transactionRepository.getByBudgetId(budgetId)
                : transactionRepository.getAll(user.id)
        },
        enabled: !!user,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })

    // Create Transaction
    const createTransactionMutation = useMutation({
        mutationFn: (input: CreateTransactionInput) => {
            if (!user) throw new Error('User not authenticated')
            return transactionRepository.create(user.id, input)
        },
        onMutate: async (newTransactionInput) => {
            await queryClient.cancelQueries({ queryKey })

            const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey)

            if (user) {
                const optimisticTransaction: Transaction = {
                    id: 'temp-' + Date.now(),
                    userId: user.id,
                    ...newTransactionInput,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
                queryClient.setQueryData<Transaction[]>(queryKey, (old) => [optimisticTransaction, ...(old || [])])
            }

            return { previousTransactions }
        },
        onError: (_err, _newTransaction, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(queryKey, context.previousTransactions)
            }
        },
        onSettled: () => {
            if (user) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byUser(user.id) })
                queryClient.invalidateQueries({ queryKey: queryKeys.budgets.byUser(user.id) })
            }
        },
    })

    // Update Transaction
    const updateTransactionMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) => {
            return transactionRepository.update(id, input)
        },
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey })
            const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey)

            queryClient.setQueryData<Transaction[]>(queryKey, (old) =>
                (old || []).map((t) => (t.id === id ? { ...t, ...input } : t))
            )

            return { previousTransactions }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(queryKey, context.previousTransactions)
            }
        },
        onSettled: () => {
            if (user) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byUser(user.id) })
                queryClient.invalidateQueries({ queryKey: queryKeys.budgets.byUser(user.id) })
            }
        },
    })

    // Delete Transaction
    const deleteTransactionMutation = useMutation({
        mutationFn: (id: string) => {
            return transactionRepository.delete(id)
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey })
            const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey)

            queryClient.setQueryData<Transaction[]>(queryKey, (old) =>
                (old || []).filter((t) => t.id !== id)
            )

            return { previousTransactions }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(queryKey, context.previousTransactions)
            }
        },
        onSettled: () => {
            if (user) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byUser(user.id) })
                queryClient.invalidateQueries({ queryKey: queryKeys.budgets.byUser(user.id) })
            }
        },
    })

    return {
        transactions,
        loading,
        error: error as Error | null,
        createTransaction: createTransactionMutation.mutateAsync,
        updateTransaction: (id: string, input: UpdateTransactionInput) => updateTransactionMutation.mutateAsync({ id, input }),
        deleteTransaction: deleteTransactionMutation.mutateAsync,
        refreshTransactions: () => queryClient.invalidateQueries({ queryKey }),
        isCreating: createTransactionMutation.isPending,
        isUpdating: updateTransactionMutation.isPending,
        isDeleting: deleteTransactionMutation.isPending,
    }
}
