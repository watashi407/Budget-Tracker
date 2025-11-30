/**
 * Domain Entity: User
 * Represents a user in the budget tracker system.
 * This is part of the Domain layer in Clean Architecture.
 */
export interface User {
    id: string
    email: string
    fullName?: string
    avatarUrl?: string
    createdAt: Date
    updatedAt: Date
}
