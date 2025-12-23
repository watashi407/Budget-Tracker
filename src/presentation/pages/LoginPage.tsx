import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Wallet, Loader2 } from 'lucide-react'

/**
 * LoginPage Component
 * Handles user authentication with email and password.
 * Part of the Presentation layer in Clean Architecture.
 */
export function LoginPage() {
    const { signIn, signInWithGoogle, user } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect to dashboard when user is authenticated
    useEffect(() => {
        if (user) {
            navigate({ to: '/dashboard' })
        }
    }, [user, loading, navigate])

    /**
     * Handle Google Sign In
     */
    async function handleGoogleSignIn() {
        try {
            setLoading(true)
            await signInWithGoogle()
        } catch {
            setLoading(false)
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signIn(email, password)
            // Navigation handled by useEffect
        } catch (err: unknown) {
            let message = err instanceof Error ? err.message : 'Failed to sign in'
            if (message.toLowerCase().includes('pwned') || message.toLowerCase().includes('security')) {
                message = 'Security alert: This password has been exposed. Please reset your password.'
            }
            setError(message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,hsl(var(--secondary)/0.08),transparent_50%)]" />

            <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative z-10">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/20">
                            <Wallet className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Welcome Back
                        </CardTitle>
                        <CardDescription>
                            Enter your credentials to access Watashi Pocket
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            variant="glow"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    signing in...
                                </>
                            ) : 'Sign in'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 relative"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign in with Google
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
