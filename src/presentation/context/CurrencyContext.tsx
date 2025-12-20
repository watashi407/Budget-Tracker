import React, { createContext, use, useEffect, useState } from 'react'

/**
 * CurrencyContext
 * Manages the application's currency preference and provides formatting utilities.
 */

interface CurrencyContextType {
    currency: string
    setCurrency: (currency: string) => void
    formatCurrency: (amount: number) => string
    availableCurrencies: { code: string; label: string; symbol: string }[]
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

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    // Initialize with saved currency or detect from locale
    const [currency, setCurrency] = useState<string>(() => {
        const saved = localStorage.getItem('watashi_currency')
        if (saved) return saved

        // Basic detection logic
        const locale = navigator.language
        if (locale.includes('PH')) return 'PHP'
        if (locale.includes('JP')) return 'JPY'
        if (locale.includes('GB')) return 'GBP'
        if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR')) return 'EUR'

        return 'USD'
    })

    // Persist changes
    useEffect(() => {
        localStorage.setItem('watashi_currency', currency)
    }, [currency])

    /**
     * Format amount using the current currency locale
     */
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'JPY' ? 0 : 2,
            maximumFractionDigits: currency === 'JPY' ? 0 : 2,
        }).format(amount)
    }

    const value = {
        currency,
        setCurrency,
        formatCurrency,
        availableCurrencies: AVAILABLE_CURRENCIES,
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
