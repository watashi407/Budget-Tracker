import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UseSupabaseRealtimeProps {
    tableName: string
    queryKey: unknown[]
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
}

/**
 * Custom hook to subscribe to Supabase Realtime PG changes
 * and automatically invalidate React Query cache.
 */
export function useSupabaseRealtime({
    tableName,
    queryKey,
    event = '*',
    schema = 'public',
}: UseSupabaseRealtimeProps) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`public:${tableName}`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema,
                    table: tableName,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
                () => {
                    console.log(`Realtime change detected in ${tableName}, invalidating query`, queryKey)
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tableName, queryKey, event, schema, queryClient])
}
