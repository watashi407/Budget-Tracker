import React, { createContext, use, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'

/**
 * CurrencyContext
 * Manages the application's currency preference and provides formatting utilities.
 * Syncs currency preference to database for cross-device persistence.
 */

interface CurrencyContextType {
    currency: string
    setCurrency: (currency: string) => void
    formatCurrency: (amount: number) => string
    availableCurrencies: { code: string; label: string; symbol: string }[]
    isLoading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const AVAILABLE_CURRENCIES = [
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
    { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
    { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'KRW', label: 'South Korean Won', symbol: '₩' },
    { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'THB', label: 'Thai Baht', symbol: '฿' },
    { code: 'VND', label: 'Vietnamese Dong', symbol: '₫' },
]

/**
 * Detect default currency from browser locale
 */
function detectDefaultCurrency(): string {
    const locale = navigator.language
    if (locale.includes('PH')) return 'PHP'
    if (locale.includes('JP')) return 'JPY'
    if (locale.includes('GB')) return 'GBP'
    if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR')) return 'EUR'
    return 'USD'
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    // Initialize with localStorage fallback, then sync with user preference from DB
    const [currency, setCurrencyState] = useState<string>(() => {
        const saved = localStorage.getItem('watashi_currency')
        if (saved) return saved
        return detectDefaultCurrency()
    })

    // Sync currency from user profile when user changes
    useEffect(() => {
        if (user?.currency) {
            // User has a currency preference in database
            setCurrencyState(user.currency)
            localStorage.setItem('watashi_currency', user.currency)
        }
        setIsLoading(false)
    }, [user?.currency])

    /**
     * Set currency - updates state and localStorage
     * Note: Saving to database is handled by SettingsPage via updateProfile
     */
    const setCurrency = useCallback((newCurrency: string) => {
        setCurrencyState(newCurrency)
        localStorage.setItem('watashi_currency', newCurrency)
    }, [])

    /**
     * Format amount using the current currency locale
     */
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'JPY' ? 0 : 2,
            maximumFractionDigits: currency === 'JPY' ? 0 : 2,
        }).format(amount)
    }, [currency])

    const value = {
        currency,
        setCurrency,
        formatCurrency,
        availableCurrencies: AVAILABLE_CURRENCIES,
        isLoading,
    }

    return <CurrencyContext value={value}>{children}</CurrencyContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
    const context = use(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
