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
    signInWithGoogle: () => Promise<void>
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

        // Failsafe: If loading takes too long, force it to false
        const failsafeTimeout = setTimeout(() => {
            if (mounted && loading) {
                setLoading(false)
            }
        }, 8000)

        // Helper to map Supabase user to our User type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapSessionUser = (supabaseUser: any): User => ({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            fullName: supabaseUser.user_metadata?.full_name,
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            createdAt: new Date(supabaseUser.created_at),
            updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
        })

        // Listen for auth state changes - this is the SINGLE SOURCE OF TRUTH
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            switch (event) {
                case 'INITIAL_SESSION':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                    } else {
                        setUser(null)
                    }
                    setLoading(false)
                    break

                case 'SIGNED_IN':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                        setLoading(false)
                    }
                    break

                case 'TOKEN_REFRESHED':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                    }
                    break

                case 'SIGNED_OUT':
                    setUser(null)
                    setLoading(false)
                    break

                case 'USER_UPDATED':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                    }
                    break
            }
        })

        return () => {
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
            const user = await authRepository.signIn(email, password)
            setUser(user)
            setLoading(false)
        } catch (error) {
            setLoading(false)
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
    }

    /**
     * Update user password
     */
    async function updatePassword(password: string) {
        await authRepository.updatePassword(password)
    }

    /**
     * Sign in with Google
     */
    async function signInWithGoogle() {
        await authRepository.signInWithGoogle()
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
        signInWithGoogle,
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
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your entire app in main.tsx')
    }
    return context
}
