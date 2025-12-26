import { pgTable, uuid, text, decimal, timestamp, check, boolean } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

/**
 * Drizzle ORM Schema
 * Defines the database schema for type-safe queries and migrations.
 * This mirrors the Supabase database structure for future scaling.
 */

export const budgets = pgTable('budgets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    spent: decimal('spent', { precision: 10, scale: 2 }).default('0'),
    period: text('period').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    color: text('color'),
    icon: text('icon'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, () => ({
    periodCheck: check('period_check', sql`period IN ('daily', 'weekly', 'monthly', 'yearly')`),
}))

export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    budgetId: uuid('budget_id').references(() => budgets.id, { onDelete: 'set null' }),
    type: text('type').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    isLocked: boolean('is_locked').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, () => ({
    typeCheck: check('type_check', sql`type IN ('income', 'expense')`),
}))

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().notNull(), // References auth.users
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),
    currency: text('currency').default('USD'),
    role: text('role').default('user'), // 'admin' or 'user'
    verified: boolean('verified').default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const news = pgTable('news', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: uuid('author_id').references(() => profiles.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
    budgets: many(budgets),
    transactions: many(transactions),
}))

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
    user: one(profiles, {
        fields: [budgets.userId],
        references: [profiles.id],
    }),
    transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(profiles, {
        fields: [transactions.userId],
        references: [profiles.id],
    }),
    budget: one(budgets, {
        fields: [transactions.budgetId],
        references: [budgets.id],
    }),
}))
