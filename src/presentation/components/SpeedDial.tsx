import { useState, useRef, useEffect } from 'react'
import { X, LayoutGrid } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { cn } from '@/lib/utils'

interface SpeedDialAction {
    icon: React.ElementType
    label: string
    onClick: () => void
    color?: string
}

interface SpeedDialProps {
    actions: SpeedDialAction[]
}

/**
 * SpeedDial Component
 * A Floating Action Button that expands to show multiple actions.
 */
export function SpeedDial({ actions }: SpeedDialProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div
            ref={containerRef}
            id="speed-dial"
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
            style={{ pointerEvents: 'none' }} // Allow clicks to pass through the container
        >
            {/* Actions List */}
            <div className={cn(
                "flex flex-col items-end gap-3 transition-all duration-200",
                isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-4 invisible pointer-events-none"
            )}>
                {actions.map((action, index) => (
                    <div
                        key={action.label}
                        className="flex items-center gap-3 transition-all duration-300"
                        style={{
                            transitionDelay: `${index * 50}ms`,
                            transform: isOpen ? 'translateY(0)' : 'translateY(10px)',
                            pointerEvents: isOpen ? 'auto' : 'none' // Only enable clicks when open
                        }}
                    >
                        {/* Label Badge */}
                        <span className="px-2.5 py-1 text-xs font-medium bg-background border shadow-md rounded-md animate-in slide-in-from-right-2">
                            {action.label}
                        </span>

                        {/* Action Button */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className={cn(
                                "h-10 w-10 rounded-full shadow-lg transition-transform hover:scale-110",
                                action.color
                            )}
                            onClick={() => {
                                action.onClick()
                                setIsOpen(false)
                            }}
                        >
                            <action.icon className="h-5 w-5" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all duration-300 p-0 grid place-items-center",
                    "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 hover:scale-105",
                    isOpen && "rotate-90"
                )}
                style={{ pointerEvents: 'auto' }} // Main FAB button is always clickable
            >
                <div className="relative h-7 w-7 flex items-center justify-center">
                    <LayoutGrid
                        className={cn(
                            "absolute h-full w-full text-white transition-all duration-300",
                            isOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                        )}
                    />
                    <X
                        className={cn(
                            "absolute h-full w-full text-white transition-all duration-300",
                            isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                        )}
                    />
                </div>
            </Button>
        </div>
    )
}
