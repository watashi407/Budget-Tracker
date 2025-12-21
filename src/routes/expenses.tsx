import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { ExpensesPage } from '@/presentation/pages/ExpensesPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/expenses',
    component: () => (
        <ProtectedRoute>
            <ExpensesPage />
        </ProtectedRoute>
    ),
})
