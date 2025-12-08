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
        let isInitialized = false

        // Safety timeout to ensure loading doesn't stick forever
        const timeoutId = setTimeout(() => {
            if (mounted && !isInitialized) {
                console.warn('[AuthContext] Auth initialization timed out (8s), forcing loading to false')
                setLoading(false)
                isInitialized = true
            }
        }, 8000) // Increased to 8 seconds to allow repository timeout (3s) to resolve first

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
                        isInitialized = true
                        clearTimeout(timeoutId)
                    }
                } else {
                    console.log('[AuthContext] No existing session')
                    if (mounted) {
                        setUser(null)
                        setLoading(false)
                        isInitialized = true
                        clearTimeout(timeoutId)
                    }
                }
            } catch (err) {
                console.error('[AuthContext] Error initializing auth:', err)
                if (mounted) {
                    setUser(null)
                    setLoading(false)
                    isInitialized = true
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
                    // Only fetch user if we don't have one or if it's a different user
                    // This prevents race conditions where initAuth is already working
                    if (!user || user.email !== session.user.email) {
                        try {
                            console.log('[AuthContext] Session found (event), fetching current user details...')
                            const currentUser = await authRepository.getCurrentUser()
                            console.log('[AuthContext] Current user fetched (event):', currentUser?.email)
                            if (mounted) {
                                setUser(currentUser)
                                setLoading(false)
                                isInitialized = true
                                clearTimeout(timeoutId)
                            }
                        } catch (err) {
                            console.error('[AuthContext] Error getting current user (event):', err)
                            if (mounted && !isInitialized) {
                                setLoading(false)
                                isInitialized = true
                            }
                        }
                    }
                } else {
                    console.log('[AuthContext] No session user (event), clearing state')
                    setUser(null)
                    setLoading(false)
                    isInitialized = true
                    clearTimeout(timeoutId)
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
export function useAuth() {
    const context = use(AuthContext)
    if (context === undefined) {
        console.error('[useAuth] Called outside of AuthProvider. Check that AuthProvider wraps your component tree.')
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your entire app in main.tsx')
    }
    return context
}
