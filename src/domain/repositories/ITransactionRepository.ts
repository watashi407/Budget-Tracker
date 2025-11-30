import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../entities/Transaction'

/**
 * Interface: ITransactionRepository
 * Defines transaction CRUD operations contract.
 * This is part of the Domain layer in Clean Architecture.
 * Implementations will be in the Data layer.
 */
export interface ITransactionRepository {
    /**
     * Get all transactions for a user
     */
    getAll(userId: string): Promise<Transaction[]>

    /**
     * Get transactions by budget ID
     */
    getByBudgetId(budgetId: string): Promise<Transaction[]>

    /**
     * Get a single transaction by ID
     */
    getById(transactionId: string): Promise<Transaction | null>

    /**
     * Create a new transaction
     */
    create(userId: string, input: CreateTransactionInput): Promise<Transaction>

    /**
     * Update an existing transaction
     */
    update(transactionId: string, input: UpdateTransactionInput): Promise<Transaction>

    /**
     * Delete a transaction
     */
    delete(transactionId: string): Promise<void>
}
