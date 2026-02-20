import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@/domain/entities/User'
import { SupabaseAuthRepository } from '@/data/repositories/SupabaseAuthRepository'
import { supabase } from '@/lib/supabase'
import { NATIVE_GOOGLE_OAUTH_REDIRECT_URI, WEB_OAUTH_CALLBACK_PATH } from '@/lib/appUrls'
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
const OAUTH_BOOTSTRAP_MAX_ATTEMPTS = 40
const OAUTH_BOOTSTRAP_INTERVAL_MS = 250

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

/**
 * AuthProvider component
 * Wraps the app to provide authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const mountedRef = useRef(true)

    const isOAuthCallbackPath = typeof window !== 'undefined'
        && window.location.pathname === WEB_OAUTH_CALLBACK_PATH

    const enrichUserFromProfile = useCallback(async (userId: string) => {
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('currency, has_completed_onboarding, role')
                .eq('id', userId)
                .maybeSingle()

            if (!mountedRef.current) return

            setUser((prev) => prev
                ? {
                    ...prev,
                    currency: profileData?.currency || prev.currency || 'USD',
                    hasCompletedOnboarding: profileData?.has_completed_onboarding,
                    role: (profileData?.role as 'admin' | 'user') || 'user',
                }
                : null)
        } catch {
            // Ignore profile enrichment errors.
        }
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applySessionUser = useCallback((supabaseUser: any) => {
        if (!mountedRef.current) return
        setUser(mapSessionUser(supabaseUser))
        void enrichUserFromProfile(supabaseUser.id)
    }, [enrichUserFromProfile])

    const waitForSessionAfterCallback = useCallback(async () => {
        for (let i = 0; i < OAUTH_BOOTSTRAP_MAX_ATTEMPTS; i += 1) {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                applySessionUser(session.user)
                return true
            }
            await sleep(OAUTH_BOOTSTRAP_INTERVAL_MS)
        }

        return false
    }, [applySessionUser])

    useEffect(() => {
        mountedRef.current = true

        const failsafeTimeout = setTimeout(() => {
            if (mountedRef.current) {
                setLoading(false)
            }
        }, isOAuthCallbackPath ? 20000 : 8000)

        void App.addListener('appUrlOpen', async (event) => {
            if (!event.url.startsWith(NATIVE_GOOGLE_OAUTH_REDIRECT_URI)) return

            try {
                const url = new URL(event.url)
                const code = url.searchParams.get('code')

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (error) throw error
                    await Browser.close()
                    return
                }

                const hashParams = new URLSearchParams(url.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })
                    if (error) throw error
                    await Browser.close()
                }
            } catch (e) {
                console.error('Failed to handle deep link:', e)
            }
        })

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mountedRef.current) return

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setLoading(false)
                return
            }

            if (session?.user) {
                applySessionUser(session.user)
            }

            if (event === 'INITIAL_SESSION') {
                // On callback path, keep loading true until callback exchange settles.
                if (!isOAuthCallbackPath || !!session?.user) {
                    setLoading(false)
                }
                return
            }

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                setLoading(false)
            }
        })

        const bootstrapAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                applySessionUser(session.user)
                if (mountedRef.current) setLoading(false)
                return
            }

            if (isOAuthCallbackPath) {
                const hasSession = await waitForSessionAfterCallback()
                if (mountedRef.current && hasSession) {
                    setLoading(false)
                    return
                }
            }

            if (mountedRef.current) setLoading(false)
        }

        void bootstrapAuth()

        return () => {
            mountedRef.current = false
            clearTimeout(failsafeTimeout)
            data.subscription.unsubscribe()
            App.removeAllListeners()
        }
    }, [applySessionUser, isOAuthCallbackPath, waitForSessionAfterCallback])

    /**
     * Sign in with email and password
     */
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const signedInUser = await authRepository.signIn(email, password)
            setUser(signedInUser)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            throw error
        }
    }, [])

    /**
     * Sign up with email and password
     */
    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
        const signedUpUser = await authRepository.signUp(email, password, fullName)
        setUser(signedUpUser)
    }, [])

    /**
     * Sign out current user
     */
    const signOut = useCallback(async () => {
        await authRepository.signOut()
        setUser(null)
    }, [])

    /**
     * Send password reset email
     */
    const resetPassword = useCallback(async (email: string) => {
        await authRepository.resetPassword(email)
    }, [])

    /**
     * Update user profile
     */
    const updateProfile = useCallback(async (userId: string, updates: Partial<User>) => {
        const updatedUser = await authRepository.updateProfile(userId, updates)
        setUser(updatedUser)
    }, [])

    /**
     * Update user password
     */
    const updatePassword = useCallback(async (password: string) => {
        await authRepository.updatePassword(password)
    }, [])

    /**
     * Sign in with Google
     */
    const signInWithGoogle = useCallback(async () => {
        await authRepository.signInWithGoogle()
    }, [])

    /**
     * Complete onboarding
     */
    const completeOnboarding = useCallback(async () => {
        if (!user) return
        await authRepository.completeOnboarding(user.id)
        setUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : null))
    }, [user])

    const value = useMemo<AuthContextType>(() => ({
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
    }), [
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updatePassword,
        signInWithGoogle,
        completeOnboarding,
    ])

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
