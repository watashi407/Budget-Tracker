import type { User } from '../entities/User'

/**
 * Interface: IAuthRepository
 * Defines authentication operations contract.
 * This is part of the Domain layer in Clean Architecture.
 * Implementations will be in the Data layer.
 */
export interface IAuthRepository {
    /**
     * Sign up a new user with email and password
     */
    signUp(email: string, password: string, fullName?: string): Promise<User>

    /**
     * Sign in an existing user
     */
    signIn(email: string, password: string): Promise<User>

    /**
     * Sign out the current user
     */
    signOut(): Promise<void>

    /**
     * Get the currently authenticated user
     */
    getCurrentUser(): Promise<User | null>

    /**
     * Send password reset email
     */
    resetPassword(email: string): Promise<void>

    /**
     * Update user profile
     */
    updateProfile(userId: string, updates: Partial<User>): Promise<User>

    /**
     * Update user password
     */
    updatePassword(password: string): Promise<void>
}
