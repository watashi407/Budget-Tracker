import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { FormField } from '@/presentation/components/FormField'
import { Wallet, Loader2 } from 'lucide-react'

/**
 * SignupPage Component
 * Handles new user registration with email, password, and full name.
 * Part of the Presentation layer in Clean Architecture.
 */
export function SignupPage() {
    const navigate = useNavigate()
    const { signUp, signInWithGoogle } = useAuth()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    /**
     * Handle Google Sign In
     */
    async function handleGoogleSignIn() {
        try {
            setLoading(true)
            await signInWithGoogle()
        } catch (error) {
            console.error('[SignupPage] Google sign in error:', error)
            setLoading(false)
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            await signUp(email, password, fullName)
            navigate({ to: '/dashboard' })
        } catch (err: unknown) {
            console.error('[SignupPage] Signup error:', err)
            let message = err instanceof Error ? err.message : 'Failed to create account'
            if (message.toLowerCase().includes('pwned') || message.toLowerCase().includes('security') || message.toLowerCase().includes('weak')) {
                message = 'This password has been exposed in a data breach or is too weak. Please choose a stronger, unique password.'
            }
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 relative overflow-hidden bg-background">
            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex flex-col justify-center items-center relative bg-zinc-900 p-12 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.2),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(var(--secondary)/0.1),transparent_50%)]" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-lg">
                    <div className="mb-12">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25 mb-6">
                            <Wallet className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Join the <br />
                            <span className="text-primary">Financial Revolution</span>
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Create an account to start tracking budgets, expenses, and receiving personalized AI insights.
                        </p>
                    </div>

                    {/* Graphic simulation */}
                    <div className="relative pl-8">
                        <div className="absolute -right-12 top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 cursor-default">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-medium">Smart Budget</h3>
                                    <span className="text-xs text-white/50">June 2024</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-bold text-white">72%</span>
                                    <span className="text-xs text-zinc-400 mb-1">used</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[72%] bg-gradient-to-r from-primary to-orange-500" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span>On track this month</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                {/* Mobile Background */}
                <div className="lg:hidden absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_50%)] -z-10" />

                <div className="w-full max-w-md space-y-8 py-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Watashi Pocket</h2>
                    </div>

                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-muted-foreground">
                            Enter your details below to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <FormField
                                label="Full Name"
                                name="fullName"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                            />
                            <FormField
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                            />
                            <FormField
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                            />
                            <FormField
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20"
                            variant="glow"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : 'Create Account'}
                        </Button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 relative border-input/50 hover:bg-accent/50 hover:text-accent-foreground"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>

                        <div className="text-center text-sm text-muted-foreground pt-4">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
