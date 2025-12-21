import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { AIAssistantPage } from '@/presentation/pages/AIAssistantPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/ai-assistant',
    component: () => (
        <ProtectedRoute>
            <AIAssistantPage />
        </ProtectedRoute>
    ),
})
