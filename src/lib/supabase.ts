import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client instance for interacting with the database and auth.
 * Uses the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
