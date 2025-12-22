import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { SocialPage } from '@/presentation/pages/SocialPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/social',
    component: () => (
        <ProtectedRoute>
            <SocialPage />
        </ProtectedRoute>
    ),
})
