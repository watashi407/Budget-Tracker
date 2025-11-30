import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { SignupPage } from '@/presentation/pages/SignupPage'

/**
 * Signup Route
 * Public route for new user registration
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/signup',
    component: SignupPage,
})
