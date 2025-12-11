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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

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

        const timeoutPromise = (ms: number, name: string) => new Promise<{ data: { session: null }; error: { message: string } } | { data: { user: null }; error: { message: string } }>((_, reject) =>
            setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
        )

        try {
            // Priority 1: Get session directly first (faster and often sufficient)
            // Wrap in race to prevent hanging
            console.log('[SupabaseAuthRepository] Calling getSession with timeout...')
            const { data: { session }, error: sessionError } = await Promise.race([
                supabase.auth.getSession(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                timeoutPromise(10000, 'getSession') as Promise<any>
            ])
            console.log('[SupabaseAuthRepository] getSession returned', session ? 'Session found' : 'No session', sessionError ? sessionError : '')

            if (sessionError) {
                console.error('[SupabaseAuthRepository] getSession error:', sessionError)
                return null
            }

            if (!session?.user) {
                // Double check with getUser just in case session is stale but valid
                console.log('[SupabaseAuthRepository] No session user, checking getUser with timeout...')
                const { data: { user }, error: userError } = await Promise.race([
                    supabase.auth.getUser(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    timeoutPromise(10000, 'getUser') as Promise<any>
                ])

                if (userError || !user) {
                    console.log('[SupabaseAuthRepository] getUser failed or empty:', userError)
                    return null
                }
                return this.mapUser(user)
            }

            // If we have a session, we can attempt to get fresh user data, but fallback to session user
            /* 
               Optimization: Trust session user for immediate rendering. 
               Only fetch updated profile if needed, but for now let's just use session user to unblock.
               If we really need fresh data, we can do it in background or separate call.
               Ideally, we should try getUser but fallback INSTANTLY to session.user if it fails/times out.
            */
            return this.mapUser(session.user)

        } catch (err) {
            console.error('[SupabaseAuthRepository] getCurrentUser exception:', err)
            return null
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
