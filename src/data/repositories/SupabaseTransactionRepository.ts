import { supabase } from '@/lib/supabase'
import type { ITransactionRepository } from '@/domain/repositories/ITransactionRepository'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/domain/entities/Transaction'

/**
 * SupabaseTransactionRepository
 * Concrete implementation of ITransactionRepository using Supabase.
 * This is part of the Data layer in Clean Architecture.
 */
export class SupabaseTransactionRepository implements ITransactionRepository {
    private readonly tableName = 'transactions'

    /**
     * Get all transactions for a user
     */
    async getAll(userId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })

        if (error) throw error

        return (data || []).map(this.mapToDomain)
    }

    /**
     * Get transactions by budget ID
     */
    async getByBudgetId(budgetId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('budget_id', budgetId)
            .order('date', { ascending: false })

        if (error) throw error

        return (data || []).map(this.mapToDomain)
    }

    /**
     * Get a single transaction by ID
     */
    async getById(transactionId: string): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', transactionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null // Not found
            throw error
        }

        return this.mapToDomain(data)
    }

    /**
     * Create a new transaction
     */
    async create(userId: string, input: CreateTransactionInput): Promise<Transaction> {
        console.log('[SupabaseTransactionRepository] Creating transaction for user:', userId)

        const { data, error } = await supabase
            .from(this.tableName)
            .insert({
                user_id: userId,
                budget_id: input.budgetId,
                type: input.type,
                amount: input.amount,
                category: input.category,
                description: input.description,
                date: input.date.toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('[SupabaseTransactionRepository] Error creating transaction:', error)
            throw error
        }

        // Update budget spent amount if budget_id is provided
        if (input.budgetId && input.type === 'expense') {
            await this.updateBudgetSpent(input.budgetId, input.amount, 'add')
        }

        return this.mapToDomain(data)
    }

    /**
     * Update an existing transaction
     */
    async update(transactionId: string, input: UpdateTransactionInput): Promise<Transaction> {
        // Get the old transaction to adjust budget spent
        const oldTransaction = await this.getById(transactionId)

        const updateData: any = {}

        if (input.budgetId !== undefined) updateData.budget_id = input.budgetId
        if (input.type !== undefined) updateData.type = input.type
        if (input.amount !== undefined) updateData.amount = input.amount
        if (input.category !== undefined) updateData.category = input.category
        if (input.description !== undefined) updateData.description = input.description
        if (input.date !== undefined) updateData.date = input.date.toISOString()

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', transactionId)
            .select()
            .single()

        if (error) throw error

        // Adjust budget spent amounts
        if (oldTransaction?.budgetId && oldTransaction.type === 'expense') {
            await this.updateBudgetSpent(oldTransaction.budgetId, oldTransaction.amount, 'subtract')
        }
        if (data.budget_id && data.type === 'expense') {
            await this.updateBudgetSpent(data.budget_id, data.amount, 'add')
        }

        return this.mapToDomain(data)
    }

    /**
     * Delete a transaction
     */
    async delete(transactionId: string): Promise<void> {
        // Get the transaction to adjust budget spent
        const transaction = await this.getById(transactionId)

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', transactionId)

        if (error) throw error

        // Adjust budget spent amount
        if (transaction?.budgetId && transaction.type === 'expense') {
            await this.updateBudgetSpent(transaction.budgetId, transaction.amount, 'subtract')
        }
    }

    /**
     * Update budget spent amount
     */
    private async updateBudgetSpent(budgetId: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
        const { data: budget } = await supabase
            .from('budgets')
            .select('spent')
            .eq('id', budgetId)
            .single()

        if (budget) {
            const newSpent = operation === 'add'
                ? budget.spent + amount
                : budget.spent - amount

            await supabase
                .from('budgets')
                .update({ spent: Math.max(0, newSpent) })
                .eq('id', budgetId)
        }
    }

    /**
     * Map database row to domain entity
     */
    private mapToDomain(row: any): Transaction {
        return {
            id: row.id,
            userId: row.user_id,
            budgetId: row.budget_id,
            type: row.type,
            amount: Number(row.amount),
            category: row.category,
            description: row.description,
            date: new Date(row.date),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        }
    }
}
