import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { DashboardPage } from '@/presentation/pages/DashboardPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

/**
 * Dashboard Route (Protected)
 * Main dashboard view for authenticated users
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/',
    component: () => (
        <ProtectedRoute>
            <DashboardPage />
        </ProtectedRoute>
    ),
})
