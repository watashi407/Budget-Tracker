import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { LandingPage } from '@/presentation/pages/LandingPage'

/**
 * Landing Page Route (Public)
 * Main entry point for new visitors
 */
export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: '/',
    component: LandingPage,
})

