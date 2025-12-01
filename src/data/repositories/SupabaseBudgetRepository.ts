import { supabase } from '@/lib/supabase'
import type { IBudgetRepository } from '@/domain/repositories/IBudgetRepository'
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@/domain/entities/Budget'

/**
 * SupabaseBudgetRepository
 * Concrete implementation of IBudgetRepository using Supabase.
 * This is part of the Data layer in Clean Architecture.
 */
export class SupabaseBudgetRepository implements IBudgetRepository {
    private readonly tableName = 'budgets'

    /**
     * Get all budgets for a user
     */
    async getAll(userId: string): Promise<Budget[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return (data || []).map(this.mapToDomain)
    }

    /**
     * Get a single budget by ID
     */
    async getById(budgetId: string): Promise<Budget | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', budgetId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null // Not found
            throw error
        }

        return this.mapToDomain(data)
    }

    async create(userId: string, input: CreateBudgetInput): Promise<Budget> {
        console.log('[SupabaseBudgetRepository] Creating budget for user:', userId, 'Input:', input)

        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .insert({
                    user_id: userId,
                    name: input.name,
                    category: input.category,
                    amount: Number(input.amount),
                    spent: 0,
                    period: input.period,
                    start_date: input.startDate.toISOString(),
                    end_date: input.endDate.toISOString(),
                    color: input.color || null,
                    icon: input.icon || 'wallet', // Default icon
                })
                .select()
                .single()

            if (error) {
                console.error('[SupabaseBudgetRepository] Error creating budget:', error)
                throw new Error(`Failed to create budget: ${error.message} (Code: ${error.code})`)
            }

            console.log('[SupabaseBudgetRepository] Budget created successfully:', data)
            return this.mapToDomain(data)
        } catch (err: any) {
            console.error('[SupabaseBudgetRepository] Exception:', err)
            throw err
        }
    }

    /**
     * Update an existing budget
     */
    async update(budgetId: string, input: UpdateBudgetInput): Promise<Budget> {
        const updateData: any = {}

        if (input.name !== undefined) updateData.name = input.name
        if (input.category !== undefined) updateData.category = input.category
        if (input.amount !== undefined) updateData.amount = input.amount
        if (input.period !== undefined) updateData.period = input.period
        if (input.startDate !== undefined) updateData.start_date = input.startDate.toISOString()
        if (input.endDate !== undefined) updateData.end_date = input.endDate.toISOString()
        if (input.color !== undefined) updateData.color = input.color
        if (input.icon !== undefined) updateData.icon = input.icon

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', budgetId)
            .select()
            .single()

        if (error) throw error

        return this.mapToDomain(data)
    }

    /**
     * Delete a budget
     */
    async delete(budgetId: string): Promise<void> {
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', budgetId)

        if (error) throw error
    }

    /**
     * Map database row to domain entity
     */
    private mapToDomain(row: any): Budget {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            category: row.category,
            amount: Number(row.amount),
            spent: Number(row.spent || 0),
            period: row.period,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            color: row.color,
            icon: row.icon,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        }
    }
}
