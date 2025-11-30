import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/domain/entities/User'
import { SupabaseAuthRepository } from '@/data/repositories/SupabaseAuthRepository'
import { supabase } from '@/lib/supabase'

/**
 * AuthContext
 * Provides authentication state and methods throughout the app.
 * This is part of the Presentation layer in Clean Architecture.
 */

interface AuthContextType {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, fullName?: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authRepository = new SupabaseAuthRepository()

/**
 * AuthProvider component
 * Wraps the app to provide authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        // Safety timeout to ensure loading doesn't stick forever
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[AuthContext] Auth check timed out, forcing loading false')
                setLoading(false)
            }
        }, 5000)

        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state change:', event, session?.user?.email)

            if (mounted) {
                if (session?.user) {
                    try {
                        const currentUser = await authRepository.getCurrentUser()
                        if (mounted) setUser(currentUser)
                    } catch (err) {
                        console.error('[AuthContext] Error getting current user:', err)
                    }
                } else {
                    setUser(null)
                }
                setLoading(false)
            }
        })

        return () => {
            mounted = false
            clearTimeout(timeoutId)
            data.subscription.unsubscribe()
        }
    }, [])



    /**
     * Sign in with email and password
     */
    async function signIn(email: string, password: string) {
        const user = await authRepository.signIn(email, password)
        setUser(user)
    }

    /**
     * Sign up with email and password
     */
    async function signUp(email: string, password: string, fullName?: string) {
        const user = await authRepository.signUp(email, password, fullName)
        setUser(user)
    }

    /**
     * Sign out current user
     */
    async function signOut() {
        await authRepository.signOut()
        setUser(null)
    }

    /**
     * Send password reset email
     */
    async function resetPassword(email: string) {
        await authRepository.resetPassword(email)
    }

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
