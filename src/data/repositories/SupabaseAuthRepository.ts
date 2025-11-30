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
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

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
