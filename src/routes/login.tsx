import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { LoginPage } from '@/presentation/pages/LoginPage'

/**
 * Login Route
 * Public route for user authentication
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/login',
    component: LoginPage,
})
