/**
 * Predefined budget categories with English and Filipino labels
 */
export const BUDGET_CATEGORIES = [
    { value: 'housing', label: 'Housing (Bahay)' },
    { value: 'utilities', label: 'Utilities (Kuryente, Tubig, Internet, Phone)' },
    { value: 'food', label: 'Food / Groceries (Pagkain)' },
    { value: 'eating-out', label: 'Eating Out (Kain sa labas)' },
    { value: 'transportation', label: 'Transportation (Pamasahe, Gas, Sasakyan)' },
    { value: 'healthcare', label: 'Healthcare (Kalusugan, Gamot)' },
    { value: 'insurance', label: 'Insurance (Seguro)' },
    { value: 'savings', label: 'Savings (Ipon)' },
    { value: 'debt', label: 'Debt Payments (Utang, Hulugan)' },
    { value: 'personal-care', label: 'Personal Care (Sarili, Hygiene, Gupit)' },
    { value: 'clothing', label: 'Clothing (Damit, Sapatos)' },
    { value: 'entertainment', label: 'Entertainment (Libangan, Subscriptions)' },
    { value: 'hobbies', label: 'Hobbies (Hilig, Sports, Creative)' },
    { value: 'education', label: 'Education (Aral, Courses, Books)' },
    { value: 'work', label: 'Work Expenses (Gastos sa Trabaho)' },
    { value: 'software', label: 'Internet & Software (Apps, Tools)' },
    { value: 'family', label: 'Family Support (Tulong sa Pamilya)' },
    { value: 'gifts', label: 'Gifts & Celebrations (Regalo, Okasyon)' },
    { value: 'donations', label: 'Donations (Charity, Church)' },
    { value: 'business', label: 'Business Expenses (Negosyo)' },
    { value: 'taxes', label: 'Taxes (Buwis)' },
    { value: 'miscellaneous', label: 'Miscellaneous (Iba pa / Biglaang gastos)' },
] as const

export const OTHERS_CATEGORY = 'others'

export type BudgetCategoryValue = typeof BUDGET_CATEGORIES[number]['value'] | typeof OTHERS_CATEGORY
