import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { BudgetDetailsPage } from '@/presentation/pages/BudgetDetailsPage'
import { ProtectedRoute } from '@/presentation/components/ProtectedRoute'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: 'budgets/$budgetId',
    component: () => (
        <ProtectedRoute>
            <BudgetDetailsPage />
        </ProtectedRoute>
    ),
})
