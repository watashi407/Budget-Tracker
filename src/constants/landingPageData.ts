import {
    Sparkles,
    PieChart,
    TrendingUp,
    Users,
    Zap,
    Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Landing Page Feature Data
 * Extracted from LandingPage component for maintainability.
 */
export interface LandingFeature {
    icon: LucideIcon
    title: string
    description: string
    color: string
}

export const LANDING_FEATURES: LandingFeature[] = [
    {
        icon: Sparkles,
        title: 'AI-Powered Insights',
        description: 'Get intelligent recommendations and forecasts powered by Gemini AI to optimize your spending.',
        color: 'from-orange-500 to-amber-500'
    },
    {
        icon: PieChart,
        title: 'Smart Budgeting',
        description: 'Create and track budgets with visual analytics that make financial planning effortless.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: TrendingUp,
        title: 'Expense Analytics',
        description: 'Visualize spending patterns with beautiful charts and identify areas for improvement.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        icon: Users,
        title: 'Social Features',
        description: 'Connect with the community, share tips, and get feedback on your financial journey.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: Zap,
        title: 'Real-time Sync',
        description: 'Access your data anywhere with instant synchronization across all your devices.',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Shield,
        title: 'Bank-Grade Security',
        description: 'Your financial data is protected with enterprise-level encryption and security.',
        color: 'from-slate-500 to-zinc-500'
    }
]
