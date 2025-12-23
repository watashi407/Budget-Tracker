/**
 * UI Constants
 * Centralized configuration for UI-related static values
 */

// Pagination Configuration
export const PAGINATION = {
    DEFAULT_ITEMS_PER_PAGE: 6,
    ITEMS_PER_PAGE_OPTIONS: [3, 6, 9, 12, 24] as number[],
}

// Toast/Notification Configuration
export const TOAST = {
    LIMIT: 1,
    REMOVE_DELAY: 1000000,
} as const

// TanStack Query Cache Configuration
export const QUERY_CONFIG = {
    STALE_TIME: 1000 * 60 * 5, // 5 minutes
    RETRY_COUNT: 3,
} as const

// Theme Configuration
export const THEMES = ['light', 'dark', 'system'] as const
export type Theme = (typeof THEMES)[number]

// LocalStorage Keys
export const STORAGE_KEYS = {
    THEME: 'theme',
    CURRENCY: 'watashi_currency',
} as const

// Animation Durations (ms)
export const ANIMATION = {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
} as const

// Date Filter Options
export const DATE_FILTERS = ['ALL', 'MTD', 'YTD'] as const
export type DateFilter = (typeof DATE_FILTERS)[number]

// Chat/Social Configuration
export const SOCIAL = {
    MAX_CHAT_MESSAGES: 100,
    UPCOMING_FEATURE_THRESHOLD: 10, // Likes needed to mark as upcoming
} as const

// File Upload Configuration
export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_TYPES: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
} as const
