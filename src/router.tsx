import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/login'
import { Route as signupRoute } from './routes/signup'
import { Route as forgotPasswordRoute } from './routes/forgot-password'

/**
 * Route Tree Configuration
 * Defines the complete routing structure for the application using TanStack Router.
 */
const routeTree = rootRoute.addChildren([
    indexRoute,
    loginRoute,
    signupRoute,
    forgotPasswordRoute,
])

/**
 * Router instance
 * Created with the complete route tree
 */
export const router = createRouter({ routeTree })

/**
 * Type declaration for TypeScript support
 */
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
