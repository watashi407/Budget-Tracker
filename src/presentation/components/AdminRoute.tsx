import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/presentation/context/AuthContext'

/**
 * AdminRoute Component
 * Redirects to dashboard if user is not an admin.
 * This is part of the Presentation layer in Clean Architecture.
 */
interface AdminRouteProps {
    children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" />
    }

    return <>{children}</>
}
