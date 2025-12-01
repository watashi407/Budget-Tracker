import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/presentation/context/AuthContext'

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated.
 * Uses TanStack Router for navigation.
 * This is part of the Presentation layer in Clean Architecture.
 */
interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    console.log('[ProtectedRoute] Check - User:', user?.email, 'Loading:', loading)

    if (loading) {
        console.log('[ProtectedRoute] Loading...')
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to login')
        return <Navigate to="/login" />
    }

    return <>{children}</>
}
