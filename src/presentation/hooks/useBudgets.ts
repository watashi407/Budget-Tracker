import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseRealtime } from '@/presentation/hooks/useSupabaseRealtime'
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@/domain/entities/Budget'
import { SupabaseBudgetRepository } from '@/data/repositories/SupabaseBudgetRepository'
import { useAuth } from '@/presentation/context/AuthContext'

const budgetRepository = new SupabaseBudgetRepository()

export const BUDGETS_QUERY_KEY = 'budgets'

/**
 * Custom hook for budget CRUD operations using TanStack Query
 * Includes optimistic updates for instant UI feedback.
 */
export function useBudgets() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const queryKey = [BUDGETS_QUERY_KEY, user?.id]

    useSupabaseRealtime({
        tableName: 'budgets',
        queryKey,
    })

    // Fetch Budgets
    const { data: budgets = [], isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!user) return []
            return budgetRepository.getAll(user.id)
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Create Budget
    const createBudgetMutation = useMutation({
        mutationFn: (input: CreateBudgetInput) => {
            if (!user) throw new Error('User not authenticated')
            return budgetRepository.create(user.id, input)
        },
        onMutate: async (newBudgetInput) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey })

            // Snapshot the previous value
            const previousBudgets = queryClient.getQueryData<Budget[]>(queryKey)

            // Optimistically update to the new value
            if (user) {
                const optimisticBudget: Budget = {
                    id: 'temp-' + Date.now(),
                    userId: user.id,
                    ...newBudgetInput,
                    spent: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
                queryClient.setQueryData<Budget[]>(queryKey, (old) => [optimisticBudget, ...(old || [])])
            }

            // Return a context object with the snapshotted value
            return { previousBudgets }
        },
        onError: (_err, _newBudget, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousBudgets) {
                queryClient.setQueryData(queryKey, context.previousBudgets)
            }
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey })
        },
    })

    // Update Budget
    const updateBudgetMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) => {
            return budgetRepository.update(id, input)
        },
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey })
            const previousBudgets = queryClient.getQueryData<Budget[]>(queryKey)

            queryClient.setQueryData<Budget[]>(queryKey, (old) =>
                (old || []).map((b) => (b.id === id ? { ...b, ...input } : b))
            )

            return { previousBudgets }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousBudgets) {
                queryClient.setQueryData(queryKey, context.previousBudgets)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        },
    })

    // Delete Budget
    const deleteBudgetMutation = useMutation({
        mutationFn: (id: string) => {
            return budgetRepository.delete(id)
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey })
            const previousBudgets = queryClient.getQueryData<Budget[]>(queryKey)

            queryClient.setQueryData<Budget[]>(queryKey, (old) =>
                (old || []).filter((b) => b.id !== id)
            )

            return { previousBudgets }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousBudgets) {
                queryClient.setQueryData(queryKey, context.previousBudgets)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        },
    })

    return {
        budgets,
        loading,
        error: error as Error | null,
        createBudget: createBudgetMutation.mutateAsync,
        updateBudget: (id: string, input: UpdateBudgetInput) => updateBudgetMutation.mutateAsync({ id, input }),
        deleteBudget: deleteBudgetMutation.mutateAsync,
        refreshBudgets: () => queryClient.invalidateQueries({ queryKey }),
        // Expose mutation states if needed
        isCreating: createBudgetMutation.isPending,
        isUpdating: updateBudgetMutation.isPending,
        isDeleting: deleteBudgetMutation.isPending,
    }
}

export function useBudget(id: string) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const queryKey = [BUDGETS_QUERY_KEY, user?.id, id]

    useSupabaseRealtime({
        tableName: 'budgets',
        queryKey,
    })

    return useQuery({
        queryKey,
        queryFn: async () => {
            if (!user) return null
            // Try to find in cache first
            const budgets = queryClient.getQueryData<Budget[]>([BUDGETS_QUERY_KEY, user.id])
            const cached = budgets?.find(b => b.id === id)
            if (cached) return cached

            return budgetRepository.getById(id)
        },
        enabled: !!user && !!id,
        initialData: () => {
            if (!user) return undefined
            const budgets = queryClient.getQueryData<Budget[]>([BUDGETS_QUERY_KEY, user.id])
            return budgets?.find(b => b.id === id)
        }
    })
}
