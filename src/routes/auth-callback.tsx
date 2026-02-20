import { createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Route as RootRoute } from './__root'

function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
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

            navigate({ to: '/dashboard' })
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
