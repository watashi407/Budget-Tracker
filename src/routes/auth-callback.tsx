import { createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Route as RootRoute } from './__root'

function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
        const waitForSession = async () => {
            for (let i = 0; i < 10; i += 1) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) return true
                await new Promise((resolve) => setTimeout(resolve, 150))
            }
            return false
        }

        const finishOAuth = async () => {
            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    navigate({ to: '/login' })
                    return
                }
            }

            const hasSession = await waitForSession()
            navigate({ to: hasSession ? '/dashboard' : '/login' })
        }

        void finishOAuth()
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
