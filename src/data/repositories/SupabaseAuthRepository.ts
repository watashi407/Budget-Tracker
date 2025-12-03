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
        console.log('[SupabaseAuthRepository] Calling signInWithPassword for:', email)

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('signIn request timed out')), 5000)
            })

            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({
                    email,
                    password,
                }),
                timeoutPromise.then(() => { throw new Error('Timeout') })
            ]) as any

            if (error) {
                console.error('[SupabaseAuthRepository] Supabase auth error:', error)
                throw error
            }
            if (!data.user) {
                console.error('[SupabaseAuthRepository] No user data returned')
                throw new Error('Sign in failed')
            }

            console.log('[SupabaseAuthRepository] Sign in successful, user ID:', data.user.id)
            return this.mapUser(data.user)
        } catch (err) {
            console.error('[SupabaseAuthRepository] signIn exception:', err)
            // If timeout but we have a session (checked via getSession), we might consider it success?
            // But for now, let's just throw to unblock the UI
            throw err
        }
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
    /**
     * Get the currently authenticated user
     */
    async getCurrentUser(): Promise<User | null> {
        console.log('[SupabaseAuthRepository] getCurrentUser called')
        try {
            // Create a promise that rejects after 3 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('getUser request timed out')), 3000)
            })

            // Race the getUser call against the timeout
            const { data: { user }, error } = await Promise.race([
                supabase.auth.getUser(),
                timeoutPromise.then(() => { throw new Error('Timeout') })
            ]) as any

            if (error) {
                console.error('[SupabaseAuthRepository] getUser error:', error)
                // Fallback to session user if getUser fails (e.g. network issue)
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    console.log('[SupabaseAuthRepository] Falling back to session user')
                    return this.mapUser(session.user)
                }
                return null
            }

            if (!user) return null

            return this.mapUser(user)
        } catch (err) {
            console.error('[SupabaseAuthRepository] getCurrentUser exception:', err)
            // One last try with session
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                console.log('[SupabaseAuthRepository] Falling back to session user after exception')
                return this.mapUser(session.user)
            }
            return null
        }
    }

    private mapUser(user: any): User {
        return {
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata.full_name,
            avatarUrl: user.user_metadata.avatar_url,
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
    async updateProfile(_userId: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                full_name: updates.fullName,
                avatar_url: updates.avatarUrl,
            },
        })

        if (error) throw error
        if (!data.user) throw new Error('Profile update failed')

        return {
            id: data.user.id,
            email: data.user.email!,
            fullName: data.user.user_metadata.full_name,
            avatarUrl: data.user.user_metadata.avatar_url,
            createdAt: new Date(data.user.created_at),
            updatedAt: new Date(data.user.updated_at || data.user.created_at),
        }
    }
}
