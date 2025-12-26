import { createRoute } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { NewsDetailPage } from '@/presentation/pages/NewsDetailPage'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: 'news/$newsId',
    component: NewsDetailPage,
})
