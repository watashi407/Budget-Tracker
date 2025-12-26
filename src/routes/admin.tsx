import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { AdminRoute } from '@/presentation/components/AdminRoute'
import { AdminDashboard } from '@/presentation/pages/AdminDashboard'

/**
 * Admin Route
 * Protected route that only allows admin users
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/admin',
    component: () => (
        <AdminRoute>
            <AdminDashboard />
        </AdminRoute>
    ),
})
