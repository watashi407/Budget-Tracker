import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import SettingsPage from '@/presentation/pages/SettingsPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/settings',
    component: () => (
        <ProtectedRoute>
            <SettingsPage />
        </ProtectedRoute>
    ),
})
