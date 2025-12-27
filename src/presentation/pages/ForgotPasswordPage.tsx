import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react'

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

/**
 * ForgotPasswordPage Component
 * Handles password reset email sending.
 * Uses react-hook-form for form state management.
 */
export function ForgotPasswordPage() {
    const { resetPassword } = useAuth()
    const [serverError, setServerError] = useState('')
    const [success, setSuccess] = useState(false)

    const form = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    })

    const { isSubmitting } = form.formState

    async function onSubmit(data: ForgotPasswordForm) {
        setServerError('')
        setSuccess(false)

        try {
            await resetPassword(data.email)
            setSuccess(true)
            form.reset()
        } catch (err: unknown) {
            setServerError(err instanceof Error ? err.message : 'Failed to send reset email')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,hsl(var(--secondary)/0.08),transparent_50%)]" />

            <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative z-10">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/20">
                            <Wallet className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Reset Password
                        </CardTitle>
                        <CardDescription>
                            Enter your email to receive a reset link
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {serverError && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                                {serverError}
                            </div>
                        )}
                        {success && (
                            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                Password reset email sent! Check your inbox.
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                {...form.register('email')}
                                disabled={isSubmitting}
                                className="h-11"
                            />
                            {form.formState.errors.email && (
                                <p className="text-destructive text-xs">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            variant="glow"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : 'Send reset link'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Remember your password?{' '}
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
