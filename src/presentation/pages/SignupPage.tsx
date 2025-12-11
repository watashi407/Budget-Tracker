import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Wallet, Loader2 } from 'lucide-react'

/**
 * SignupPage Component
 * Handles new user registration with email, password, and full name.
 * Part of the Presentation layer in Clean Architecture.
 */
export function SignupPage() {
    const navigate = useNavigate()
    const { signUp } = useAuth()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
            navigate({ to: '/' })
        } catch (err) {
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,hsl(var(--secondary)/0.1),transparent_50%)]" />

            <Card className="w-full max-w-md glass border-white/10 relative z-10">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
                            <Wallet className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                            Join Watashi Pocket to track your life
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                            />
                        </div>
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
                                className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 shadow-lg shadow-primary/20 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : 'Create account'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
