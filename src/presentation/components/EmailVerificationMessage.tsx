import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { useAuth } from '@/presentation/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail, ExternalLink, RefreshCw } from 'lucide-react'

/**
 * EmailVerificationMessage
 * Reusable component for showing email verification required message
 * with resend email and open Gmail buttons.
 */
interface EmailVerificationMessageProps {
    onClose: () => void
    actionName?: string
}

export function EmailVerificationMessage({ onClose, actionName = 'this action' }: EmailVerificationMessageProps) {
    const { user } = useAuth()
    const [resending, setResending] = useState(false)
    const [resent, setResent] = useState(false)

    const handleResendEmail = async () => {
        if (!user?.email) return
        setResending(true)
        try {
            await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            })
            setResent(true)
        } catch {
            // Silently fail
        } finally {
            setResending(false)
        }
    }

    const handleOpenGmail = () => {
        window.open('https://mail.google.com/mail/u/0/#inbox', '_blank')
    }

    return (
        <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Email Verification Required</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Please verify your email address before {actionName}. Check your inbox for the verification link.
                </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
                {resent ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ Verification email sent!
                    </p>
                ) : (
                    <Button
                        variant="default"
                        onClick={handleResendEmail}
                        disabled={resending}
                        className="mx-auto"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={handleOpenGmail}
                    className="mx-auto"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Gmail
                </Button>
                <Button variant="ghost" onClick={onClose} className="mx-auto text-muted-foreground">
                    Close
                </Button>
            </div>
        </div>
    )
}
