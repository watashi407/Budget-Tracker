import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { budgets, transactions, profiles } from './schema'

/**
 * Drizzle ORM Type Exports
 * Provides type-safe database types for future Drizzle integration.
 */

// Budget types
export type Budget = InferSelectModel<typeof budgets>
export type NewBudget = InferInsertModel<typeof budgets>

// Transaction types
export type Transaction = InferSelectModel<typeof transactions>
export type NewTransaction = InferInsertModel<typeof transactions>

// Profile types
export type Profile = InferSelectModel<typeof profiles>
export type NewProfile = InferInsertModel<typeof profiles>
