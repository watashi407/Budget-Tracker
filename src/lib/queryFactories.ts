import { SupabaseBudgetRepository } from '@/data/repositories/SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from '@/data/repositories/SupabaseTransactionRepository'

/**
 * Query Factories
 * Centralized query key and option definitions for TanStack Query.
 * Follows clean architecture by abstracting query configuration.
 */

const budgetRepository = new SupabaseBudgetRepository()
const transactionRepository = new SupabaseTransactionRepository()

/**
 * Query Keys - Centralized and type-safe
 * Returns string[] for compatibility with useSupabaseRealtime
 */
export const queryKeys = {
    budgets: {
        all: ['budgets'] as string[],
        byUser: (userId: string): string[] => ['budgets', userId],
        byId: (budgetId: string): string[] => ['budgets', 'detail', budgetId],
    },
    transactions: {
        all: ['transactions'] as string[],
        byUser: (userId: string): string[] => ['transactions', userId],
        byBudget: (budgetId: string): string[] => ['transactions', 'budget', budgetId],
    },
}

/**
 * Query Options Factory - Reusable query configurations
 */
export const queryOptions = {
    budgets: {
        byUser: (userId: string) => ({
            queryKey: queryKeys.budgets.byUser(userId),
            queryFn: () => budgetRepository.getAll(userId),
            staleTime: 1000 * 60 * 5, // 5 minutes
            enabled: !!userId,
        }),
    },
    transactions: {
        byUser: (userId: string) => ({
            queryKey: queryKeys.transactions.byUser(userId),
            queryFn: () => transactionRepository.getAll(userId),
            staleTime: 1000 * 60 * 5, // 5 minutes
            enabled: !!userId,
        }),
        byBudget: (budgetId: string) => ({
            queryKey: queryKeys.transactions.byBudget(budgetId),
            queryFn: () => transactionRepository.getByBudgetId(budgetId),
            staleTime: 1000 * 60 * 5,
            enabled: !!budgetId,
        }),
    },
} as const

/**
 * Prefetch utilities for route loaders
 */
export async function prefetchDashboardData(queryClient: { prefetchQuery: (options: ReturnType<typeof queryOptions.budgets.byUser | typeof queryOptions.transactions.byUser>) => Promise<void> }, userId: string): Promise<void> {
    if (!userId) return

    await Promise.all([
        queryClient.prefetchQuery(queryOptions.budgets.byUser(userId)),
        queryClient.prefetchQuery(queryOptions.transactions.byUser(userId)),
    ])
}

export async function prefetchBudgetDetailData(queryClient: { prefetchQuery: (options: ReturnType<typeof queryOptions.transactions.byBudget>) => Promise<void> }, budgetId: string): Promise<void> {
    if (!budgetId) return

    await queryClient.prefetchQuery(queryOptions.transactions.byBudget(budgetId))
}
