import React, { createContext, use, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'

/**
 * TimezoneContext
 * Manages the application's timezone preference for date filtering.
 * Syncs timezone preference to database for cross-device persistence.
 */

interface TimezoneContextType {
    timezone: string
    setTimezone: (timezone: string) => void
    availableTimezones: { value: string; label: string; offset: string }[]
    isLoading: boolean
    /**
     * Parse a date string using the user's timezone
     */
    parseDate: (dateInput: Date | string) => Date
    /**
     * Format a date for display using the user's timezone
     */
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
}

// eslint-disable-next-line react-refresh/only-export-components
export const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

// Common timezones with their offsets
const AVAILABLE_TIMEZONES = [
    { value: 'Pacific/Midway', label: 'Midway Island', offset: 'UTC-11:00' },
    { value: 'Pacific/Honolulu', label: 'Hawaii', offset: 'UTC-10:00' },
    { value: 'America/Anchorage', label: 'Alaska', offset: 'UTC-09:00' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: 'UTC-08:00' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: 'UTC-07:00' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: 'UTC-06:00' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: 'UTC-05:00' },
    { value: 'America/Sao_Paulo', label: 'Brasília', offset: 'UTC-03:00' },
    { value: 'Atlantic/Azores', label: 'Azores', offset: 'UTC-01:00' },
    { value: 'Europe/London', label: 'London, Dublin', offset: 'UTC+00:00' },
    { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', offset: 'UTC+01:00' },
    { value: 'Europe/Helsinki', label: 'Helsinki, Kyiv', offset: 'UTC+02:00' },
    { value: 'Europe/Moscow', label: 'Moscow', offset: 'UTC+03:00' },
    { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+04:00' },
    { value: 'Asia/Karachi', label: 'Karachi', offset: 'UTC+05:00' },
    { value: 'Asia/Dhaka', label: 'Dhaka', offset: 'UTC+06:00' },
    { value: 'Asia/Bangkok', label: 'Bangkok, Jakarta', offset: 'UTC+07:00' },
    { value: 'Asia/Manila', label: 'Manila, Singapore, Hong Kong', offset: 'UTC+08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo, Seoul', offset: 'UTC+09:00' },
    { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10:00' },
    { value: 'Pacific/Auckland', label: 'Auckland', offset: 'UTC+12:00' },
]

/**
 * Detect default timezone from browser
 */
function detectDefaultTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return 'Asia/Manila' // Fallback
    }
}

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    // Initialize with localStorage fallback, then sync with user preference from DB
    const [timezone, setTimezoneState] = useState<string>(() => {
        const saved = localStorage.getItem('watashi_timezone')
        if (saved) return saved
        return detectDefaultTimezone()
    })

    // Sync timezone from user profile when user changes
    useEffect(() => {
        if (user?.timezone) {
            // User has a timezone preference in database
            setTimezoneState(user.timezone)
            localStorage.setItem('watashi_timezone', user.timezone)
        }
        setIsLoading(false)
    }, [user?.timezone])

    /**
     * Set timezone - updates state and localStorage
     * Note: Saving to database is handled by SettingsPage via updateProfile
     */
    const setTimezone = useCallback((newTimezone: string) => {
        setTimezoneState(newTimezone)
        localStorage.setItem('watashi_timezone', newTimezone)
    }, [])

    /**
     * Parse a date using the user's timezone
     * This ensures consistent date parsing regardless of user's local system timezone
     */
    const parseDate = useCallback((dateInput: Date | string): Date => {
        if (dateInput instanceof Date) {
            return dateInput
        }
        // Parse the date string as a local date
        const [year, month, day] = dateInput.split('T')[0].split('-').map(Number)
        return new Date(year, month - 1, day)
    }, [])

    /**
     * Format a date for display using the user's timezone
     */
    const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
        const defaultOptions: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options,
        }
        return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
    }, [timezone])

    const value = {
        timezone,
        setTimezone,
        availableTimezones: AVAILABLE_TIMEZONES,
        isLoading,
        parseDate,
        formatDate,
    }

    return <TimezoneContext value={value}>{children}</TimezoneContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimezone() {
    const context = use(TimezoneContext)
    if (context === undefined) {
        throw new Error('useTimezone must be used within a TimezoneProvider')
    }
    return context
}
