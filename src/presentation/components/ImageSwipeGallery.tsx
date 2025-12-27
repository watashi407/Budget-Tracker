import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'

interface ImageSwipeGalleryProps {
    images: { id: string; url: string; fileName: string }[]
    initialIndex?: number
    open: boolean
    onClose: () => void
}

/**
 * ImageSwipeGallery Component
 * A full-screen swipeable image gallery with touch and mouse support.
 */
export function ImageSwipeGallery({
    images,
    initialIndex = 0,
    open,
    onClose,
}: ImageSwipeGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [isZoomed, setIsZoomed] = useState(false)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50

    // Reset index when opening
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex)
            setIsZoomed(false)
        }
    }, [open, initialIndex])

    // Keyboard navigation
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious()
            if (e.key === 'ArrowRight') goToNext()
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, currentIndex])

    const goToNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setIsZoomed(false)
        }
    }, [currentIndex, images.length])

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setIsZoomed(false)
        }
    }, [currentIndex])

    // Touch handlers
    const onTouchStart = (e: React.TouchEvent) => {
        if (isZoomed) return
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        setIsDragging(true)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (isZoomed || touchStart === null) return
        const currentTouch = e.targetTouches[0].clientX
        setTouchEnd(currentTouch)
        setDragOffset(currentTouch - touchStart)
    }

    const onTouchEnd = () => {
        if (isZoomed) return
        setIsDragging(false)
        setDragOffset(0)

        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNext()
        } else if (isRightSwipe) {
            goToPrevious()
        }

        setTouchStart(null)
        setTouchEnd(null)
    }

    // Mouse drag handlers for desktop
    const onMouseDown = (e: React.MouseEvent) => {
        if (isZoomed) return
        e.preventDefault()
        setTouchStart(e.clientX)
        setIsDragging(true)
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (isZoomed || touchStart === null || !isDragging) return
        const currentPos = e.clientX
        setTouchEnd(currentPos)
        setDragOffset(currentPos - touchStart)
    }

    const onMouseUp = () => {
        if (isZoomed) return
        setIsDragging(false)
        setDragOffset(0)

        if (!touchStart || !touchEnd) {
            setTouchStart(null)
            return
        }

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNext()
        } else if (isRightSwipe) {
            goToPrevious()
        }

        setTouchStart(null)
        setTouchEnd(null)
    }

    const onMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false)
            setDragOffset(0)
            setTouchStart(null)
            setTouchEnd(null)
        }
    }

    const toggleZoom = () => {
        setIsZoomed(!isZoomed)
    }

    if (!open || images.length === 0) return null

    const currentImage = images[currentIndex]

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                    <span className="text-white/90 text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </span>
                    <span className="text-white/60 text-sm truncate max-w-[200px]">
                        {currentImage.fileName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={toggleZoom}
                    >
                        {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Navigation Arrows */}
            {currentIndex > 0 && !isZoomed && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all"
                    onClick={goToPrevious}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            )}
            {currentIndex < images.length - 1 && !isZoomed && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all"
                    onClick={goToNext}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            )}

            {/* Image Container */}
            <div
                ref={containerRef}
                className="h-full w-full flex items-center justify-center select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                style={{ cursor: isDragging ? 'grabbing' : isZoomed ? 'zoom-out' : 'grab' }}
            >
                <div
                    className={cn(
                        "relative max-w-full max-h-full transition-transform",
                        isDragging ? "duration-0" : "duration-300 ease-out"
                    )}
                    style={{
                        transform: `translateX(${dragOffset}px) scale(${isZoomed ? 1.5 : 1})`,
                    }}
                    onClick={toggleZoom}
                >
                    <img
                        src={currentImage.url}
                        alt={currentImage.fileName}
                        className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                        draggable={false}
                    />
                </div>
            </div>

            {/* Thumbnail Dots */}
            {images.length > 1 && !isZoomed && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/40 rounded-full backdrop-blur-sm">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-200",
                                idx === currentIndex
                                    ? "bg-white w-4"
                                    : "bg-white/40 hover:bg-white/60"
                            )}
                            onClick={() => {
                                setCurrentIndex(idx)
                                setIsZoomed(false)
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Swipe Hint (shows on first image) */}
            {images.length > 1 && currentIndex === 0 && !isZoomed && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs animate-pulse">
                    Swipe or use arrow keys to navigate
                </div>
            )}
        </div>
    )
}
