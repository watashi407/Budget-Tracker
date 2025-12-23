/**
 * Form Validation Constants
 * Centralized validation rules and messages
 */

// Validation Rules
export const VALIDATION = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50,
    },
    DESCRIPTION: {
        MIN_LENGTH: 0,
        MAX_LENGTH: 200,
    },
    AMOUNT: {
        MIN: 0.01,
        MAX: 999999999,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
    },
    COMMENT: {
        MIN_LENGTH: 1,
        MAX_LENGTH: 1000,
    },
} as const

// Validation Error Messages
export const VALIDATION_MESSAGES = {
    REQUIRED: 'This field is required',
    MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
    MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_AMOUNT: 'Please enter a valid amount',
    MIN_AMOUNT: (min: number) => `Amount must be at least ${min}`,
    MAX_AMOUNT: (max: number) => `Amount cannot exceed ${max}`,
    PASSWORD_TOO_SHORT: (min: number) => `Password must be at least ${min} characters`,
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    CATEGORY_REQUIRED: 'Please select a category',
    BUDGET_REQUIRED: 'Please select a budget',
    TYPE_REQUIRED: 'Please select a transaction type',
} as const

// Field Validation Helpers
export const validateRequired = (value: string | undefined | null): string | undefined => {
    if (!value || value.trim() === '') {
        return VALIDATION_MESSAGES.REQUIRED
    }
    return undefined
}

export const validateMinLength = (value: string, min: number): string | undefined => {
    if (value.length < min) {
        return VALIDATION_MESSAGES.MIN_LENGTH(min)
    }
    return undefined
}

export const validateMaxLength = (value: string, max: number): string | undefined => {
    if (value.length > max) {
        return VALIDATION_MESSAGES.MAX_LENGTH(max)
    }
    return undefined
}

export const validateAmount = (value: string | number): string | undefined => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num) || num < VALIDATION.AMOUNT.MIN) {
        return VALIDATION_MESSAGES.MIN_AMOUNT(VALIDATION.AMOUNT.MIN)
    }
    if (num > VALIDATION.AMOUNT.MAX) {
        return VALIDATION_MESSAGES.MAX_AMOUNT(VALIDATION.AMOUNT.MAX)
    }
    return undefined
}

export const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return VALIDATION_MESSAGES.INVALID_EMAIL
    }
    return undefined
}
