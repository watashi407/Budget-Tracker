import { createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Route as RootRoute } from './__root'

function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        let unsubscribe: (() => void) | null = null

        const waitForSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) return true

            return await new Promise<boolean>((resolve) => {
                const timeout = setTimeout(() => {
                    unsubscribe?.()
                    resolve(false)
                }, 6000)

                const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
                    if (nextSession?.user) {
                        clearTimeout(timeout)
                        unsubscribe?.()
                        resolve(true)
                    }
                })

                unsubscribe = () => data.subscription.unsubscribe()
            })
        }

        const finishOAuth = async () => {
            const url = new URL(window.location.href)
            const hasProviderError = !!(
                url.searchParams.get('error') ||
                url.searchParams.get('error_description')
            )

            if (hasProviderError) {
                if (!cancelled) navigate({ to: '/login' })
                return
            }

            // Supabase client already has detectSessionInUrl enabled, so avoid
            // manual exchange here and wait for session propagation.
            const hasSession = await waitForSession()
            if (!cancelled) {
                navigate({ to: hasSession ? '/dashboard' : '/login' })
            }
        }

        void finishOAuth()

        return () => {
            cancelled = true
            unsubscribe?.()
        }
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Signing you in...</div>
        </div>
    )
}

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/auth/callback',
    component: AuthCallbackPage,
})
