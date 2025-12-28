import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { useAuth } from '@/presentation/context/AuthContext'
import { SupabaseSocialRepository } from '@/data/repositories/SupabaseSocialRepository'
import type { SocialComment } from '@/domain/entities/Social'
import { LandingGraphic } from '@/presentation/components/LandingGraphic'
import { LandingFooter } from '@/presentation/components/LandingFooter'
import { NewsSection } from '@/presentation/components/NewsSection'
import { FeatureCard } from '@/presentation/components/FeatureCard'
import { LANDING_FEATURES } from '@/constants/landingPageData'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/presentation/components/ui/dialog'
import {
    Sparkles,
    ArrowRight,
    ChevronRight,
    MessageSquare,
    ThumbsUp,
    Lightbulb,
    Rocket,
    BadgeCheck,
    Download
} from 'lucide-react'

const socialRepository = new SupabaseSocialRepository()

/**
 * LandingPage Component
 * Premium landing page with dark mode aesthetic inspired by modern SaaS designs.
 * Redirects to dashboard if user is already logged in.
 */
export function LandingPage() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [comments, setComments] = useState<SocialComment[]>([])
    const [commentsLoading, setCommentsLoading] = useState(true)

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate({ to: '/dashboard' })
        }
    }, [user, loading, navigate])

    // Fetch public comments
    const fetchComments = useCallback(async () => {
        try {
            const data = await socialRepository.getComments('all')
            setComments(data.slice(0, 6)) // Limit to 6 recent comments
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setCommentsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    // Handle interaction attempt
    const handleInteractionAttempt = () => {
        setShowLoginModal(true)
    }

    // Get comment stats
    const upcomingFeatures = comments.filter(c => c.isUpcomingFeature)
    const suggestions = comments.filter(c => c.type === 'suggestion' && !c.isUpcomingFeature)
    const feedback = comments.filter(c => c.type === 'feedback')

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
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
                            <img src="/app-icon.png" alt="Watashi Pocket" className="h-10 w-10 rounded-xl object-contain" />
                            <span className="hidden sm:block text-xl font-bold text-foreground">
                                Watashi Pocket
                            </span>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#news" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                News
                            </a>
                            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Features
                            </a>
                            <a href="#community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Community
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
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Column: Text & CTA */}
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in mx-auto lg:mx-0">
                                <Sparkles className="h-4 w-4" />
                                AI-Powered Budget Management
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 animate-slide-up leading-tight">
                                Take Control of Your
                                <span className="block mt-2 bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent pb-3">
                                    Financial Future
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '100ms' }}>
                                Smart budgeting made simple. Track expenses, get AI-powered insights,
                                and achieve your financial goals with our intuitive platform.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col items-center lg:items-start gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <Link to="/signup">
                                        <Button variant="glow" size="lg" className="text-lg px-8 h-14 gap-2 shadow-lg shadow-primary/25">
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

                                <a href="/app-release.apk" download>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="relative group text-base px-8 h-12 border-primary/30 text-muted-foreground hover:text-foreground bg-background/30 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 overflow-hidden gap-2.5 w-full sm:w-auto"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                        <Download className="h-4 w-4 group-hover:scale-110 group-hover:translate-y-0.5 transition-transform" />
                                        <span>Download Mobile APK</span>
                                    </Button>
                                </a>
                            </div>

                            {/* Social Proof */}
                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 animate-fade-in group" style={{ animationDelay: '400ms' }}>
                                <div className="flex -space-x-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center text-xs font-medium text-muted-foreground transform transition-transform group-hover:translate-x-1"
                                            style={{ transitionDelay: `${i * 50}ms` }}
                                        >
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-muted-foreground text-left">
                                    <div className="flex items-center gap-1">
                                        <span className="text-foreground font-semibold">1,000+</span>
                                        <span>users</span>
                                    </div>
                                    <span className="text-xs">managing their finances</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Graphic */}
                        <div className="relative animate-fade-in mx-auto w-full max-w-[500px] lg:max-w-none" style={{ animationDelay: '300ms' }}>
                            <LandingGraphic />
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <NewsSection />

            {/* Features Section */}

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
                        {LANDING_FEATURES.map((feature, index) => (
                            <FeatureCard key={feature.title} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section id="community" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Community Voice
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            See what our users are saying, suggesting, and the features we're building next.
                        </p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
                        <div className="text-center p-4 rounded-xl bg-card/60 border border-border/50">
                            <Lightbulb className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{suggestions.length}</p>
                            <p className="text-xs text-muted-foreground">Suggestions</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-card/60 border border-border/50">
                            <MessageSquare className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{feedback.length}</p>
                            <p className="text-xs text-muted-foreground">Feedback</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-card/60 border border-border/50">
                            <Rocket className="h-6 w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{upcomingFeatures.length}</p>
                            <p className="text-xs text-muted-foreground">Upcoming</p>
                        </div>
                    </div>

                    {/* Comments Grid */}
                    {commentsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-muted-foreground mt-4">Loading community feedback...</p>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No community posts yet. Be the first to share!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="p-5 rounded-xl bg-card/60 backdrop-blur-lg border border-border/50 hover:border-primary/30 transition-all"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-primary">
                                                {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {comment.authorName || 'Anonymous'}
                                                </span>
                                                {comment.authorVerified && (
                                                    <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {/* Type Badge */}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${comment.isUpcomingFeature
                                            ? 'bg-green-500/10 text-green-500'
                                            : comment.type === 'suggestion'
                                                ? 'bg-yellow-500/10 text-yellow-500'
                                                : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {comment.isUpcomingFeature ? 'Upcoming' : comment.type}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                        {comment.content}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleInteractionAttempt}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            <span>{comment.likesCount}</span>
                                        </button>
                                        <button
                                            onClick={handleInteractionAttempt}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>{comment.replies?.length || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA to join */}
                    <div className="text-center">
                        <Link to="/signup">
                            <Button variant="glow" size="lg" className="gap-2">
                                Join the Community
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-3">
                            Sign up to share your ideas and vote on features
                        </p>
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
            <LandingFooter />

            {/* Login Modal for unauthenticated users */}
            <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Join the Conversation</DialogTitle>
                        <DialogDescription>
                            Sign in or create an account to like, comment, and share your ideas with the community.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Link to="/signup" className="w-full sm:w-auto">
                            <Button variant="glow" className="w-full gap-2">
                                Create Account
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full">
                                Sign In
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
