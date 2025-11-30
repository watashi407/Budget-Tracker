import { useState, useEffect } from 'react'
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@/domain/entities/Budget'
import { SupabaseBudgetRepository } from '@/data/repositories/SupabaseBudgetRepository'
import { useAuth } from '@/presentation/context/AuthContext'

const budgetRepository = new SupabaseBudgetRepository()

/**
 * Custom hook for budget CRUD operations
 * This is part of the Presentation layer in Clean Architecture.
 */
export function useBudgets() {
    const { user } = useAuth()
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Fetch all budgets for the current user
     */
    async function fetchBudgets() {
        if (!user) {
            setBudgets([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = await budgetRepository.getAll(user.id)
            setBudgets(data)
        } catch (err) {
            setError(err as Error)
            console.error('Error fetching budgets:', err)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Create a new budget
     */
    async function createBudget(input: CreateBudgetInput): Promise<Budget> {
        if (!user) throw new Error('User not authenticated')

        try {
            const newBudget = await budgetRepository.create(user.id, input)
            setBudgets(prev => [newBudget, ...prev])
            return newBudget
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Update an existing budget
     */
    async function updateBudget(budgetId: string, input: UpdateBudgetInput): Promise<Budget> {
        try {
            const updatedBudget = await budgetRepository.update(budgetId, input)
            setBudgets(prev => prev.map(b => b.id === budgetId ? updatedBudget : b))
            return updatedBudget
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Delete a budget
     */
    async function deleteBudget(budgetId: string): Promise<void> {
        try {
            await budgetRepository.delete(budgetId)
            setBudgets(prev => prev.filter(b => b.id !== budgetId))
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Get a single budget by ID
     */
    async function getBudgetById(budgetId: string): Promise<Budget | null> {
        try {
            return await budgetRepository.getById(budgetId)
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    // Fetch budgets when user changes
    useEffect(() => {
        fetchBudgets()
    }, [user?.id])

    return {
        budgets,
        loading,
        error,
        createBudget,
        updateBudget,
        deleteBudget,
        getBudgetById,
        refreshBudgets: fetchBudgets,
    }
}
