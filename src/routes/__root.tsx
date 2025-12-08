import { createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { MainLayout } from '@/presentation/components/MainLayout'

/**
 * Root Route
 * The root layout for all routes in the application.
 */
export const Route = createRootRoute({
    component: () => (
        <>
            <MainLayout />
            {import.meta.env.DEV && <TanStackRouterDevtools />}
        </>
    ),
})
