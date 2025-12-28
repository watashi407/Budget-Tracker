import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { FormField } from '@/presentation/components/FormField'
import { Card } from '@/presentation/components/ui/card'
import { Loader2 } from 'lucide-react'

// Validation schema
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

/**
 * LoginPage Component
 * Handles user authentication with email and password.
 * Uses react-hook-form for form state management and zod for validation.
 */
export function LoginPage() {
    const { signIn, signInWithGoogle, user } = useAuth()
    const navigate = useNavigate()
    const [serverError, setServerError] = useState('')

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const { isSubmitting } = form.formState

    // Redirect to dashboard when user is authenticated
    useEffect(() => {
        if (user) {
            navigate({ to: '/dashboard' })
        }
    }, [user, navigate])

    async function handleGoogleSignIn() {
        try {
            await signInWithGoogle()
        } catch {
            // Error handled by auth context
        }
    }

    async function onSubmit(data: LoginForm) {
        setServerError('')

        try {
            await signIn(data.email, data.password)
            // Navigation handled by useEffect
        } catch (err: unknown) {
            let message = err instanceof Error ? err.message : 'Failed to sign in'
            if (message.toLowerCase().includes('pwned') || message.toLowerCase().includes('security')) {
                message = 'Security alert: This password has been exposed. Please reset your password.'
            }
            setServerError(message)
        }
    }

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 relative overflow-hidden bg-background">
            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex flex-col justify-center items-center relative bg-zinc-900 p-12 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.2),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--secondary)/0.1),transparent_50%)]" />
                <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.4))]" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-lg">
                    <div className="mb-12">
                        <img src="/logo.svg" alt="Watashi Pocket" className="h-16 w-16 mb-6 rounded-2xl shadow-lg shadow-primary/25 object-cover" />
                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Welcome back to <br />
                            <span className="text-primary">Watashi Pocket</span>
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Your personal finance companion. Track, analyze, and optimize your spending with the power of AI.
                        </p>
                    </div>

                    {/* Graphic simulation */}
                    <div className="relative">
                        <div className="absolute -left-12 top-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl skew-y-3 transform rotate-2 hover:rotate-1 hover:skew-y-2 transition-all duration-500 cursor-default">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-green-500 text-lg font-bold">↑</span>
                                </div>
                                <div>
                                    <div className="text-sm text-zinc-400">Monthly Savings</div>
                                    <div className="text-xl font-bold text-white">+$2,450.00</div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-400" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-6 sm:p-12 relative">
                {/* Mobile Background */}
                <div className="lg:hidden absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_50%)] -z-10" />

                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-8">
                        <img src="/logo.svg" alt="Watashi Pocket" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/25 object-cover" />
                        <h2 className="text-2xl font-bold">Watashi Pocket</h2>
                    </div>

                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
                        <p className="text-muted-foreground">
                            Enter your email below to access your account
                        </p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {serverError && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                {serverError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <FormField
                                label="Email"
                                type="email"
                                placeholder="name@example.com"
                                error={form.formState.errors.email?.message}
                                required
                                disabled={isSubmitting}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                                {...form.register('email')}
                            />

                            <FormField
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                error={form.formState.errors.password?.message}
                                required
                                disabled={isSubmitting}
                                className="h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                                labelExtra={
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                }
                                {...form.register('password')}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20"
                            variant="glow"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
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
                            disabled={isSubmitting}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>

                        <div className="text-center text-sm text-muted-foreground pt-4">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4">
                                Create an account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
