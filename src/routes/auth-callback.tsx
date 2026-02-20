import { createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Route as RootRoute } from './__root'

function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false

        const waitForSession = async () => {
            for (let i = 0; i < 24; i += 1) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) return true
                await new Promise((resolve) => setTimeout(resolve, 250))
            }

            return false
        }

        const finishOAuth = async () => {
            const url = new URL(window.location.href)
            const hasProviderError = !!(
                url.searchParams.get('error') ||
                url.searchParams.get('error_description')
            )

            if (hasProviderError) {
                if (!cancelled) navigate({ to: '/login', replace: true })
                return
            }

            // First, allow supabase-js auto URL detection to settle if it already handled the callback.
            if (await waitForSession()) {
                if (!cancelled) navigate({ to: '/dashboard', replace: true })
                return
            }

            const code = url.searchParams.get('code')
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    if (!cancelled) navigate({ to: '/login', replace: true })
                    return
                }
            }

            // Fallback for environments/providers that still return implicit tokens in hash.
            const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                })
                if (error) {
                    if (!cancelled) navigate({ to: '/login', replace: true })
                    return
                }
            }

            const hasSession = await waitForSession()
            if (!cancelled) {
                if (hasSession) {
                    window.location.replace('/dashboard')
                    return
                }
                window.location.replace('/login')
            }
        }

        void finishOAuth()

        return () => {
            cancelled = true
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
