import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '../entities/Budget'

/**
 * Interface: IBudgetRepository
 * Defines budget CRUD operations contract.
 * This is part of the Domain layer in Clean Architecture.
 * Implementations will be in the Data layer.
 */
export interface IBudgetRepository {
    /**
     * Get all budgets for a user
     */
    getAll(userId: string): Promise<Budget[]>

    /**
     * Get a single budget by ID
     */
    getById(budgetId: string): Promise<Budget | null>

    /**
     * Create a new budget
     */
    create(userId: string, input: CreateBudgetInput): Promise<Budget>

    /**
     * Update an existing budget
     */
    update(budgetId: string, input: UpdateBudgetInput): Promise<Budget>

    /**
     * Delete a budget
     */
    delete(budgetId: string): Promise<void>
}
