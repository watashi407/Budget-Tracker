import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { BudgetsPage } from '@/presentation/pages/BudgetsPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/budgets',
    component: () => (
        <ProtectedRoute>
            <BudgetsPage />
        </ProtectedRoute>
    ),
})
