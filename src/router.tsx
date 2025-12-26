import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as dashboardRoute } from './routes/dashboard'
import { Route as loginRoute } from './routes/login'
import { Route as signupRoute } from './routes/signup'
import { Route as forgotPasswordRoute } from './routes/forgot-password'
import { Route as budgetDetailsRoute } from './routes/budgets.$budgetId'
import { Route as settingsRoute } from './routes/settings'
import { Route as budgetsRoute } from './routes/budgets'
import { Route as expensesRoute } from './routes/expenses'
import { Route as aiAssistantRoute } from './routes/ai-assistant'
import { Route as socialRoute } from './routes/social'
import { Route as adminRoute } from './routes/admin'

/**
 * Route Tree Configuration
 * Defines the complete routing structure for the application using TanStack Router.
 */
const routeTree = rootRoute.addChildren([
    indexRoute,
    dashboardRoute,
    loginRoute,
    signupRoute,
    forgotPasswordRoute,
    budgetDetailsRoute,
    settingsRoute,
    budgetsRoute,
    expensesRoute,
    aiAssistantRoute,
    socialRoute,
    adminRoute,
])

/**
 * Router instance
 * Created with the complete route tree
 */
export const router = createRouter({
    routeTree,
    defaultViewTransition: true,
})

/**
 * Type declaration for TypeScript support
 */
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
