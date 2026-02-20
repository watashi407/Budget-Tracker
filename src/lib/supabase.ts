import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    if (!supabaseUrl) console.error('VITE_SUPABASE_URL is missing')
    if (!supabaseAnonKey) console.error('VITE_SUPABASE_ANON_KEY is missing')
    throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client instance for interacting with the database and auth.
 * Configured with explicit session persistence to prevent unexpected logouts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Use localStorage for persistent sessions across browser refreshes
        persistSession: true,
        // Storage key for the session
        storageKey: 'watashi-pocket-auth',
        // Auto-refresh the token before it expires
        autoRefreshToken: true,
        // Keep enabled to support providers/environments that return tokens in URL hash.
        detectSessionInUrl: true,
        // Flow type - PKCE is recommended for SPAs
        flowType: 'pkce',
    },
})

