import { useState, useEffect } from 'react'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/domain/entities/Transaction'
import { SupabaseTransactionRepository } from '@/data/repositories/SupabaseTransactionRepository'
import { useAuth } from '@/presentation/context/AuthContext'

const transactionRepository = new SupabaseTransactionRepository()

/**
 * Custom hook for transaction CRUD operations
 * This is part of the Presentation layer in Clean Architecture.
 */
export function useTransactions(budgetId?: string) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Fetch transactions for the current user or specific budget
     */
    async function fetchTransactions() {
        if (!user) {
            setTransactions([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = budgetId
                ? await transactionRepository.getByBudgetId(budgetId)
                : await transactionRepository.getAll(user.id)
            setTransactions(data)
        } catch (err) {
            setError(err as Error)
            console.error('Error fetching transactions:', err)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Create a new transaction
     */
    async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
        if (!user) throw new Error('User not authenticated')

        try {
            const newTransaction = await transactionRepository.create(user.id, input)
            setTransactions(prev => [newTransaction, ...prev])
            return newTransaction
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Update an existing transaction
     */
    async function updateTransaction(transactionId: string, input: UpdateTransactionInput): Promise<Transaction> {
        try {
            const updatedTransaction = await transactionRepository.update(transactionId, input)
            setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t))
            return updatedTransaction
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Delete a transaction
     */
    async function deleteTransaction(transactionId: string): Promise<void> {
        try {
            await transactionRepository.delete(transactionId)
            setTransactions(prev => prev.filter(t => t.id !== transactionId))
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    /**
     * Get a single transaction by ID
     */
    async function getTransactionById(transactionId: string): Promise<Transaction | null> {
        try {
            return await transactionRepository.getById(transactionId)
        } catch (err) {
            setError(err as Error)
            throw err
        }
    }

    // Fetch transactions when user or budgetId changes
    useEffect(() => {
        fetchTransactions()
    }, [user?.id, budgetId])

    return {
        transactions,
        loading,
        error,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
        refreshTransactions: fetchTransactions,
    }
}
