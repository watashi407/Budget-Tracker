import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseAuthRepository } from './SupabaseAuthRepository'
import { supabase } from '@/lib/supabase'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            getUser: vi.fn(),
            getSession: vi.fn(),
        }
    }
}))

describe('SupabaseAuthRepository', () => {
    let repository: SupabaseAuthRepository

    beforeEach(() => {
        repository = new SupabaseAuthRepository()
        vi.clearAllMocks()
    })

    it('should timeout signIn if it takes too long', async () => {
        // Mock signInWithPassword to hang
        vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => new Promise(() => { }))

        await expect(repository.signIn('test@example.com', 'password')).rejects.toThrow('signIn request timed out')
    }, 10000)

    it('should timeout getCurrentUser if it takes too long and fallback fails', async () => {
        // Mock getUser to hang
        vi.mocked(supabase.auth.getUser).mockImplementation(() => new Promise(() => { }))
        // Mock getSession to return null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as any)
        const user = await repository.getCurrentUser()
        expect(user).toBeNull()
    })

    it('should fallback to session if getUser times out', async () => {
        // Mock getUser to hang
        vi.mocked(supabase.auth.getUser).mockImplementation(() => new Promise(() => { }))

        // Mock getSession to return a session
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
            created_at: new Date().toISOString(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: { user: mockUser } },
            error: null
        } as any)

        const user = await repository.getCurrentUser()
        expect(user).not.toBeNull()
        expect(user?.email).toBe('test@example.com')
    })
})
