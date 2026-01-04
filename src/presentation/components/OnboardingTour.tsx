import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { X, ChevronRight, Check, Eye, Play } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/**
 * OnboardingTour
 * A walkthrough guide for new users with minimize capability.
 */
export function OnboardingTour() {
    const { user, completeOnboarding } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)

    // Wait for user data to load and check if onboarding is needed
    useEffect(() => {
        if (user && user.hasCompletedOnboarding === false) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => setIsVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [user])

    // Steps configuration
    const steps = [
        {
            title: "Welcome to Watashi Pocket! 👋",
            description: "We're glad you're here! Let's take a quick tour to help you get the most out of your new financial companion.",
            action: async () => {
                await navigate({ to: '/dashboard' })
            },
            position: 'center'
        },
        {
            title: "Your Dashboard",
            description: "This is your command center. See your monthly savings, recent activity, and quick stats at a glance.",
            targetId: 'dashboard-header',
            position: 'center'
        },
        {
            title: "Add a Budget",
            description: "Start by creating a budget. Click 'New Budget' to set spending limits for categories like Food or Transport.",
            targetId: 'btn-new-budget',
            position: 'bottom'
        },
        {
            title: "Track Transactions",
            description: "Logged an expense? Click 'Add Transaction' here (or use the Speed Dial in the corner) to record it.",
            targetId: 'btn-add-transaction',
            position: 'bottom'
        },
        {
            title: "AI Assistant",
            description: "Need financial advice? Our AI Assistant can analyze your spending and give you personalized tips.",
            targetId: 'nav-ai',
            position: 'right',
            action: async () => {
                await navigate({ to: '/ai-assistant' })
            }
        },
        {
            title: "Social Hub",
            description: "Connect with others! Share tips, join discussions, and see how others are managing their finances.",
            targetId: 'nav-social',
            position: 'right',
            action: async () => {
                await navigate({ to: '/social' })
            }
        },
        {
            title: "Currency Settings",
            description: "Need to change your currency? You can do that right here in Settings.",
            targetId: 'nav-settings',
            position: 'right',
            action: async () => {
                await navigate({ to: '/settings' })
            }
        },
        {
            title: "You're All Set! 🚀",
            description: "That's the basics! You can now start tracking your finances. Enjoy using Watashi Pocket!",
            position: 'center',
            action: async () => {
                await navigate({ to: '/dashboard' })
            }
        }
    ]

    const handleNext = async () => {
        if (step < steps.length - 1) {
            const nextStep = steps[step + 1]
            if (nextStep.action) {
                await nextStep.action()
            }
            setStep(step + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = async () => {
        setIsVisible(false)
        await completeOnboarding()
    }

    const handleMinimize = () => {
        setIsMinimized(true)
    }

    const handleRestore = () => {
        setIsMinimized(false)
    }

    if (!isVisible || !user) return null

    const currentStep = steps[step]

    // Render minimized floating button
    if (isMinimized) {
        return createPortal(
            <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300 md:bottom-6">
                <Button
                    onClick={handleRestore}
                    className="group shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 h-auto"
                >
                    <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                    <span className="font-medium">Continue Tour</span>
                    <span className="ml-2 text-xs opacity-70">({step + 1}/{steps.length})</span>
                </Button>
            </div>,
            document.body
        )
    }

    // Render full overlay and modal
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center isolate pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300" />

            {/* Content Card */}
            <Card className={cn(
                "relative z-10 w-full max-w-sm md:max-w-md mx-4 overflow-hidden border-primary/20 shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-300 slide-in-from-bottom-5",
                "bg-zinc-900/95 text-zinc-100"
            )}>
                {/* Progress Bar */}
                <div className="h-1 w-full bg-zinc-800">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                Step {step + 1} of {steps.length}
                            </span>
                            <h3 className="text-xl font-bold text-white leading-tight">
                                {currentStep.title}
                            </h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2 -mt-2 text-zinc-500 hover:text-white"
                            onClick={handleComplete}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        {currentStep.description}
                    </p>

                    <div className="flex justify-between items-center gap-2">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleComplete}
                                className="text-zinc-500 hover:text-white text-sm px-2"
                            >
                                Skip
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleMinimize}
                                className="text-zinc-400 hover:text-white border-zinc-700 hover:border-zinc-600 text-sm"
                            >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Peek at UI</span>
                                <span className="sm:hidden">Peek</span>
                            </Button>
                        </div>
                        <Button
                            onClick={handleNext}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
                        >
                            {step === steps.length - 1 ? (
                                <>
                                    Get Started <Check className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>,
        document.body
    )
}

