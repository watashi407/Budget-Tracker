import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { ForgotPasswordPage } from '@/presentation/pages/ForgotPasswordPage'

/**
 * Forgot Password Route
 * Public route for password reset
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/forgot-password',
    component: ForgotPasswordPage,
})
