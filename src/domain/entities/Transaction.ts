/**
 * Domain Entity: Transaction
 * Represents a financial transaction (income or expense).
 * This is part of the Domain layer in Clean Architecture.
 */
export interface Transaction {
    id: string
    userId: string
    budgetId?: string
    type: 'income' | 'expense'
    amount: number
    category: string
    description: string
    date: Date
    createdAt: Date
    updatedAt: Date
}

/**
 * Transaction creation input (without auto-generated fields)
 */
export interface CreateTransactionInput {
    budgetId?: string
    type: 'income' | 'expense'
    amount: number
    category: string
    description: string
    date: Date
}

/**
 * Transaction update input (partial fields)
 */
export interface UpdateTransactionInput {
    budgetId?: string
    type?: 'income' | 'expense'
    amount?: number
    category?: string
    description?: string
    date?: Date
}
