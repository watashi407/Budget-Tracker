import React, { createContext, useEffect, useState } from 'react'
import type { User } from '@/domain/entities/User'
import { SupabaseAuthRepository } from '@/data/repositories/SupabaseAuthRepository'
import { supabase } from '@/lib/supabase'
import { NATIVE_GOOGLE_OAUTH_REDIRECT_URI } from '@/lib/appUrls'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

/**
 * AuthContext
 * Provides authentication state and methods throughout the app.
 * This is part of the Presentation layer in Clean Architecture.
 */

interface AuthContextType {
    user: User | null
    loading: boolean
    isAdmin: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, fullName?: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    updateProfile: (userId: string, updates: Partial<User>) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    completeOnboarding: () => Promise<void>
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
        // emailVerified starts as undefined - will be set by profiles.verified
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapSessionUser = (supabaseUser: any): User => ({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            fullName: supabaseUser.user_metadata?.full_name,
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            emailVerified: supabaseUser.email_confirmed_at !== null && supabaseUser.email_confirmed_at !== undefined,
            createdAt: new Date(supabaseUser.created_at),
            updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
        })

        // Async function to update user with currency and role from profiles table (non-blocking)
        const updateWithServerData = async (userId: string) => {
            try {
                // Get currency, onboarding, and role from profiles table
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('currency, has_completed_onboarding, role')
                    .eq('id', userId)
                    .maybeSingle()

                if (mounted) {
                    setUser(prev => prev ? {
                        ...prev,
                        currency: profileData?.currency || prev.currency || 'USD',
                        hasCompletedOnboarding: profileData?.has_completed_onboarding,
                        role: (profileData?.role as 'admin' | 'user') || 'user',
                    } : null)
                }
            } catch {
                // Ignore errors
            }
        }

        // Helper to handle deep links for mobile auth
        // Helper to handle deep links for mobile auth
        const handleDeepLink = async () => {
            await App.addListener('appUrlOpen', async (event) => {
                if (event.url.startsWith(NATIVE_GOOGLE_OAUTH_REDIRECT_URI)) {
                    try {
                        const url = new URL(event.url)

                        // Handle PKCE flow (code in search params)
                        const code = url.searchParams.get('code')
                        if (code) {
                            const { error } = await supabase.auth.exchangeCodeForSession(code)
                            if (error) throw error

                            // Close browser after successful exchange
                            await Browser.close()
                            return
                        }

                        // Handle Implicit flow (access_token in hash)
                        const hashParams = new URLSearchParams(url.hash.substring(1))
                        const accessToken = hashParams.get('access_token')
                        const refreshToken = hashParams.get('refresh_token')

                        if (accessToken && refreshToken) {
                            const { error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken,
                            })
                            if (error) throw error

                            // Close browser after successful session set
                            await Browser.close()
                        }
                    } catch (e) {
                        console.error('Failed to handle deep link:', e)
                    }
                }
            })
        }

        handleDeepLink()

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return

            switch (event) {
                case 'INITIAL_SESSION':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                        updateWithServerData(session.user.id) // Non-blocking
                    } else {
                        setUser(null)
                    }
                    setLoading(false)
                    break

                case 'SIGNED_IN':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                        updateWithServerData(session.user.id) // Non-blocking
                        setLoading(false)
                    }
                    break

                case 'TOKEN_REFRESHED':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                        updateWithServerData(session.user.id) // Non-blocking
                    }
                    break

                case 'SIGNED_OUT':
                    setUser(null)
                    setLoading(false)
                    break

                case 'USER_UPDATED':
                    if (session?.user) {
                        setUser(mapSessionUser(session.user))
                        updateWithServerData(session.user.id) // Non-blocking
                    }
                    break
            }
        })

        return () => {
            mounted = false
            clearTimeout(failsafeTimeout)
            data.subscription.unsubscribe()
            App.removeAllListeners()
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

    /**
     * Complete onboarding
     */
    async function completeOnboarding() {
        if (!user) return
        await authRepository.completeOnboarding(user.id)
        setUser(prev => prev ? { ...prev, hasCompletedOnboarding: true } : null)
    }

    const value: AuthContextType = {
        user,
        loading,
        isAdmin: user?.role === 'admin',
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updatePassword,
        signInWithGoogle,
        completeOnboarding,
    }

    return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * Hook to use auth context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your entire app in main.tsx')
    }
    return context
}
