import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { useAuth } from '@/presentation/context/AuthContext'
import {
    Wallet,
    Sparkles,
    TrendingUp,
    Users,
    PieChart,
    Zap,
    Shield,
    ArrowRight,
    ChevronRight
} from 'lucide-react'

/**
 * LandingPage Component
 * Premium landing page with dark mode aesthetic inspired by modern SaaS designs.
 * Redirects to dashboard if user is already logged in.
 */
export function LandingPage() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate({ to: '/dashboard' })
        }
    }, [user, loading, navigate])
    const features = [
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

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Primary glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
                {/* Secondary glow */}
                <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500/15 rounded-full blur-[100px] opacity-40" />
                {/* Accent glow */}
                <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] opacity-30" />
            </div>

            {/* Navigation Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-foreground">
                                Watashi Pocket
                            </span>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Features
                            </a>
                            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                About
                            </a>
                        </nav>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="glow" size="sm" className="gap-2">
                                    Get Started
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered Budget Management
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 animate-slide-up">
                        Take Control of Your
                        <span className="block mt-2 bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                            Financial Future
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        Smart budgeting made simple. Track expenses, get AI-powered insights,
                        and achieve your financial goals with our intuitive platform.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Link to="/signup">
                            <Button variant="glow" size="lg" className="text-lg px-8 h-14 gap-2">
                                Start Free Today
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button variant="outline" size="lg" className="text-lg px-8 h-14 border-border/50 hover:border-primary/50">
                                Learn More
                            </Button>
                        </a>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-16 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
                        <div className="flex -space-x-3">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center text-xs font-medium text-muted-foreground"
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Trusted by <span className="text-foreground font-semibold">1,000+</span> users managing their finances
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed to help you understand, manage, and grow your finances.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="group relative p-6 rounded-2xl bg-card/60 backdrop-blur-lg border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About/CTA Section */}
            <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Ready to Transform Your Finances?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join thousands of users who have already taken control of their financial future.
                                Start your journey today — completely free.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/signup">
                                    <Button variant="glow" size="lg" className="text-lg px-8 h-14 gap-2">
                                        Create Free Account
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center">
                                <Wallet className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-foreground">
                                Watashi Pocket
                            </span>
                        </div>

                        {/* Links */}
                        <nav className="flex items-center gap-6">
                            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Features
                            </a>
                            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Sign In
                            </Link>
                            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Sign Up
                            </Link>
                        </nav>

                        {/* Copyright */}
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Watashi Pocket. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
