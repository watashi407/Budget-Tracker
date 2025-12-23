import { supabase } from '@/lib/supabase'
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import type { User } from '@/domain/entities/User'

/**
 * SupabaseAuthRepository
 * Concrete implementation of IAuthRepository using Supabase.
 * This is part of the Data layer in Clean Architecture.
 */
export class SupabaseAuthRepository implements IAuthRepository {
    /**
     * Sign up a new user with email and password
     */
    async signUp(email: string, password: string, fullName?: string): Promise<User> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (error) throw error
        if (!data.user) throw new Error('User creation failed')

        return {
            id: data.user.id,
            email: data.user.email!,
            fullName: data.user.user_metadata.full_name,
            avatarUrl: data.user.user_metadata.avatar_url,
            createdAt: new Date(data.user.created_at),
            updatedAt: new Date(data.user.updated_at || data.user.created_at),
        }
    }

    /**
     * Sign in an existing user
     */
    async signIn(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error
        if (!data.user) throw new Error('Sign in failed')

        return this.mapUser(data.user)
    }

    /**
     * Sign in with Google OAuth
     */
    async signInWithGoogle(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        })

        if (error) throw error
    }

    /**
     * Sign out the current user
     */
    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    /**
     * Get the currently authenticated user
     */
    async getCurrentUser(): Promise<User | null> {
        const timeoutPromise = (ms: number, name: string) => new Promise<{ data: { session: null }; error: { message: string } } | { data: { user: null }; error: { message: string } }>((_, reject) =>
            setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
        )

        try {
            const { data: { session }, error: sessionError } = await Promise.race([
                supabase.auth.getSession(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                timeoutPromise(10000, 'getSession') as Promise<any>
            ])

            if (sessionError) return null

            if (!session?.user) {
                const { data: { user }, error: userError } = await Promise.race([
                    supabase.auth.getUser(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    timeoutPromise(10000, 'getUser') as Promise<any>
                ])

                if (userError || !user) return null
                return this.mapUser(user)
            }

            // Fetch currency from profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('currency')
                .eq('id', session.user.id)
                .single()

            return this.mapUser(session.user, profile?.currency)

        } catch {
            return null
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapUser(user: any, currency?: string): User {
        return {
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata.full_name,
            avatarUrl: user.user_metadata.avatar_url,
            currency: currency || 'USD',
            emailVerified: user.email_confirmed_at !== null && user.email_confirmed_at !== undefined,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at || user.created_at),
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
        // Update auth metadata if fullName or avatarUrl changed
        if (updates.fullName !== undefined || updates.avatarUrl !== undefined) {
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: updates.fullName,
                    avatar_url: updates.avatarUrl,
                },
            })
            if (authError) throw authError
        }

        // Update profiles table (for currency and other profile fields)
        const profileUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }
        if (updates.fullName !== undefined) profileUpdates.full_name = updates.fullName
        if (updates.avatarUrl !== undefined) profileUpdates.avatar_url = updates.avatarUrl
        if (updates.currency !== undefined) profileUpdates.currency = updates.currency

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)

        if (profileError) throw profileError

        // Get updated user data
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        if (getUserError || !user) throw new Error('Failed to get updated user')

        const { data: profile } = await supabase
            .from('profiles')
            .select('currency')
            .eq('id', user.id)
            .single()

        return this.mapUser(user, profile?.currency)
    }

    /**
     * Update user password
     */
    async updatePassword(password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password,
        })
        if (error) throw error
    }
}
