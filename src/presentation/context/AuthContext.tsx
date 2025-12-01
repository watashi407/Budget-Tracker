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
            if (mounted) {
                console.warn('[AuthContext] Auth initialization timed out, forcing loading to false')
                setLoading(false)
            }
        }, 3000) // 3 second timeout

        // Check initial session
        async function initAuth() {
            try {
                console.log('[AuthContext] Initializing auth...')

                // First check if there's a session
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    console.log('[AuthContext] Found existing session for:', session.user.email)
                    const currentUser = await authRepository.getCurrentUser()
                    if (mounted) {
                        setUser(currentUser)
                        setLoading(false)
                        clearTimeout(timeoutId)
                    }
                } else {
                    console.log('[AuthContext] No existing session')
                    if (mounted) {
                        setUser(null)
                        setLoading(false)
                        clearTimeout(timeoutId)
                    }
                }
            } catch (err) {
                console.error('[AuthContext] Error initializing auth:', err)
                if (mounted) {
                    setUser(null)
                    setLoading(false)
                    clearTimeout(timeoutId)
                }
            }
        }

        initAuth()

        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state change:', event, session?.user?.email)

            if (mounted) {
                if (session?.user) {
                    try {
                        const currentUser = await authRepository.getCurrentUser()
                        if (mounted) {
                            setUser(currentUser)
                            setLoading(false)
                        }
                    } catch (err) {
                        console.error('[AuthContext] Error getting current user:', err)
                        if (mounted) setLoading(false)
                    }
                } else {
                    setUser(null)
                    setLoading(false)
                }
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
        try {
            console.log('[AuthContext] Signing in user:', email)
            const user = await authRepository.signIn(email, password)
            console.log('[AuthContext] Sign in successful, user:', user.email)
            setUser(user)
            setLoading(false) // Ensure loading is false after setting user
        } catch (error) {
            console.error('[AuthContext] Sign in failed:', error)
            setLoading(false) // Also set loading false on error
            throw error
        }
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
        console.error('[useAuth] Called outside of AuthProvider. Check that AuthProvider wraps your component tree.')
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your entire app in main.tsx')
    }
    return context
}
