import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { Button } from '@/presentation/components/ui/button'
import { ImageSwipeGallery } from '@/presentation/components/ImageSwipeGallery'
import { ArrowLeft, Calendar, Loader2, ImageIcon, Expand, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export function NewsDetailPage() {
    const { newsId } = useParams({ from: '/news/$newsId' })
    const [news, setNews] = useState<NewsItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<number>(0)
    const [galleryOpen, setGalleryOpen] = useState(false)

    // Inline swipe state
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const minSwipeDistance = 50

    useEffect(() => {
        loadNews()
    }, [newsId])

    async function loadNews() {
        setLoading(true)
        setError(null)
        try {
            const data = await NewsService.getNewsById(newsId)
            if (!data) {
                setError('News not found')
            } else {
                setNews(data)
            }
        } catch (err) {
            console.error('Failed to load news:', err)
            setError('Failed to load news')
        } finally {
            setLoading(false)
        }
    }

    // Open gallery at specific image
    const openGallery = (index: number) => {
        setSelectedImage(index)
        setGalleryOpen(true)
    }

    // Navigation functions
    const goToNextImage = useCallback((e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (news?.images && selectedImage < news.images.length - 1) {
            setSelectedImage(prev => prev + 1)
        }
    }, [news, selectedImage])

    const goToPrevImage = useCallback((e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (selectedImage > 0) {
            setSelectedImage(prev => prev - 1)
        }
    }, [selectedImage])

    // Touch handlers for inline swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        setIsDragging(true)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart === null) return
        const currentTouch = e.targetTouches[0].clientX
        setTouchEnd(currentTouch)
        setDragOffset(currentTouch - touchStart)
    }

    const onTouchEnd = () => {
        setIsDragging(false)
        setDragOffset(0)

        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNextImage()
        } else if (isRightSwipe) {
            goToPrevImage()
        }

        setTouchStart(null)
        setTouchEnd(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !news) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{error || 'News not found'}</p>
                <Link to="/">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <article className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={news.created_at}>
                        {format(new Date(news.created_at), 'MMMM d, yyyy')}
                    </time>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-8">
                    {news.title}
                </h1>

                {/* Images Gallery */}
                {news.images && news.images.length > 0 && (
                    <div className="mb-10 space-y-4">
                        {/* Main Image */}
                        <div
                            className="relative aspect-video rounded-2xl overflow-hidden bg-muted cursor-pointer group select-none"
                            onClick={() => openGallery(selectedImage)}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <div
                                className="w-full h-full relative"
                                style={{
                                    transform: isDragging ? `translateX(${dragOffset * 0.5}px)` : 'translateX(0)',
                                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                                }}
                            >
                                <img
                                    src={news.images[selectedImage]}
                                    alt={`${news.title} - Image ${selectedImage + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    draggable={false}
                                />
                            </div>

                            {/* Expand overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                            {/* Navigation Arrows */}
                            {news.images.length > 1 && (
                                <>
                                    {selectedImage > 0 && (
                                        <button
                                            onClick={goToPrevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20"
                                            title="Previous image"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    {selectedImage < news.images.length - 1 && (
                                        <button
                                            onClick={goToNextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-20"
                                            title="Next image"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Expand Button */}
                            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm text-white">
                                    <Expand className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Image counter */}
                            {news.images.length > 1 && (
                                <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm z-20">
                                    {selectedImage + 1} / {news.images.length}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {news.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                                {news.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImage
                                            ? 'border-primary ring-2 ring-primary/20 scale-105'
                                            : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* No images placeholder */}
                {(!news.images || news.images.length === 0) && (
                    <div className="mb-10 aspect-video rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/80">
                        {news.content}
                    </p>
                </div>

                {/* Back Button */}
                <div className="mt-12 pt-8 border-t border-border">
                    <Link to="/">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </article>

            {/* Swipe Gallery */}
            {news.images && news.images.length > 0 && (
                <ImageSwipeGallery
                    images={news.images.map((url, idx) => ({
                        id: `news-img-${idx}`,
                        url,
                        fileName: `${news.title} - Image ${idx + 1}`
                    }))}
                    initialIndex={selectedImage}
                    open={galleryOpen}
                    onClose={() => setGalleryOpen(false)}
                />
            )}
        </div>
    )
}
