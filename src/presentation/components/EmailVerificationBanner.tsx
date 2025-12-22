import { useAuth } from '@/presentation/context/AuthContext'
import { AlertTriangle, Mail, X } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * EmailVerificationBanner
 * Shows a dismissible banner when user's email is not verified.
 * Displays at the top of all pages via MainLayout.
 */
export function EmailVerificationBanner() {
    const { user } = useAuth()
    const [dismissed, setDismissed] = useState(false)
    const [resending, setResending] = useState(false)
    const [resent, setResent] = useState(false)

    // Don't show if:
    // - no user
    // - emailVerified is true
    // - emailVerified is undefined (still loading from server)
    // - dismissed
    if (!user || user.emailVerified !== false || dismissed) {
        return null
    }

    const handleResendEmail = async () => {
        setResending(true)
        try {
            await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            })
            setResent(true)
        } catch (error) {
            // Silently fail - user can try again
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                        Please verify your email address to access all features.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {resent ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Verification email sent!
                        </span>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {resending ? 'Sending...' : 'Resend Email'}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDismissed(true)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 h-8 w-8"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
