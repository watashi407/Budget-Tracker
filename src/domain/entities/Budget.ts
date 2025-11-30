/**
 * Domain Entity: Budget
 * Represents a budget category with spending limits.
 * This is part of the Domain layer in Clean Architecture.
 */
export interface Budget {
    id: string
    userId: string
    name: string
    category: string
    amount: number
    spent: number
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: Date
    endDate: Date
    color?: string
    icon?: string
    createdAt: Date
    updatedAt: Date
}

/**
 * Budget creation input (without auto-generated fields)
 */
export interface CreateBudgetInput {
    name: string
    category: string
    amount: number
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: Date
    endDate: Date
    color?: string
    icon?: string
}

/**
 * Budget update input (partial fields)
 */
export interface UpdateBudgetInput {
    name?: string
    category?: string
    amount?: number
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate?: Date
    endDate?: Date
    color?: string
    icon?: string
}
