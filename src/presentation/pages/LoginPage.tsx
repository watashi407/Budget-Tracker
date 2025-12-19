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
    const { signIn, user } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect to dashboard when user is authenticated
    useEffect(() => {
        console.log('[LoginPage] Auth state check - User:', user ? user.email : 'null', 'Loading:', loading)
        if (user) {
            console.log('[LoginPage] User authenticated, navigating to /')
            navigate({ to: '/' })
        }
    }, [user, loading, navigate])

    /**
     * Handle form submission
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            console.log('[LoginPage] Attempting sign in with:', email)
            await signIn(email, password)
            console.log('[LoginPage] Sign in successful')
            // Navigation handled by useEffect
        } catch (err: unknown) {
            console.error('[LoginPage] Sign in error:', err)
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
                                    Signing in...
                                </>
                            ) : 'Sign in'}
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
