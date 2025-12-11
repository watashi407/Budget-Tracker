import React, { createContext, use, useEffect, useState } from 'react'
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
    updateProfile: (userId: string, updates: Partial<User>) => Promise<void>
    updatePassword: (password: string) => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
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
        console.log('[AuthContext] AuthProvider mounted')

        // Failsafe: If loading takes too long, force it to false
        const failsafeTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.error('[AuthContext] Failsafe triggered: Auth loading timed out after 5s. Forcing loading false.')
                setLoading(false)
            }
        }, 5000)

        // Fetch initial session immediately
        async function getSession() {
            console.log('[AuthContext] getSession: starting...')
            try {
                // Priority Check: check session validity first
                const sessionUser = await authRepository.getCurrentUser()
                console.log('[AuthContext] getSession: result received', sessionUser?.email)

                if (mounted) {
                    if (sessionUser) {
                        console.log('[AuthContext] Initial session found:', sessionUser.email)
                        setUser(sessionUser)
                    } else {
                        console.log('[AuthContext] No initial session')
                        setUser(null)
                    }
                    setLoading(false)
                }
            } catch (error) {
                console.error('[AuthContext] Error getting initial session:', error)
                if (mounted) {
                    setUser(null)
                    setLoading(false)
                }
            }
        }

        getSession()

        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            console.log('[AuthContext] Auth state change:', event, session?.user?.email)

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    // Check if we need to update user state (optimization)
                    // If we are already loaded and have the same user, skip
                    if (user && user.email === session.user.email) return

                    try {
                        const currentUser = await authRepository.getCurrentUser()
                        if (mounted) {
                            setUser(currentUser)
                            setLoading(false)
                        }
                    } catch (err) {
                        console.error('[AuthContext] Error fetching user on change:', err)
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null)
                    setLoading(false)
                }
            }
        })

        return () => {
            console.log('[AuthContext] AuthProvider unmounting')
            mounted = false
            clearTimeout(failsafeTimeout)
            data.subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // We don't strictly need to set loading false here if we want to wait for the auth state change,
            // but setting it here provides immediate feedback.
            // Let's log the state change we are about to make.
            console.log('[AuthContext] Manually setting user state after successful signIn')
            setLoading(false)
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

    /**
     * Update user profile
     */
    async function updateProfile(userId: string, updates: Partial<User>) {
        const updatedUser = await authRepository.updateProfile(userId, updates)
        setUser(updatedUser)
        // Optionally update cache/local storage if needed, but state should drive UI
    }

    /**
     * Update user password
     */
    async function updatePassword(password: string) {
        await authRepository.updatePassword(password)
    }

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updatePassword,
    }

    return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * Hook to use auth context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = use(AuthContext)
    if (context === undefined) {
        console.error('[useAuth] Called outside of AuthProvider. Check that AuthProvider wraps your component tree.')
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your entire app in main.tsx')
    }
    return context
}
