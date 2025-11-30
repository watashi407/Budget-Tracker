import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { budgets, transactions } from './schema';

export type Budget = InferSelectModel<typeof budgets>;
export type NewBudget = InferInsertModel<typeof budgets>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;
