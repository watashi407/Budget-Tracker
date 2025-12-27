import { useEffect, useState, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { ImageSwipeGallery } from '@/presentation/components/ImageSwipeGallery'
import { Sparkles, Calendar, ArrowRight, Clock, Expand, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// Track failed image URLs globally to avoid retrying
const failedImages = new Set<string>()

export function NewsSection() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; fileName: string }[]>([])
    const [galleryIndex, setGalleryIndex] = useState(0)

    // Track current image index per news item for inline navigation
    const [imageIndices, setImageIndices] = useState<Record<string, number>>({})

    useEffect(() => {
        loadNews()
    }, [])

    async function loadNews() {
        try {
            const data = await NewsService.getLatestNews(6)
            setNews(data)
            // Initialize image indices for each news item
            const indices: Record<string, number> = {}
            data.forEach(item => {
                indices[item.id] = 0
            })
            setImageIndices(indices)
        } catch (error) {
            console.error('Failed to load news:', error)
        } finally {
            setLoading(false)
        }
    }

    // Navigate to next image for a specific news item
    const goToNextImage = useCallback((itemId: string, maxImages: number, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setImageIndices(prev => ({
            ...prev,
            [itemId]: prev[itemId] < maxImages - 1 ? prev[itemId] + 1 : prev[itemId]
        }))
    }, [])

    // Navigate to previous image for a specific news item
    const goToPrevImage = useCallback((itemId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setImageIndices(prev => ({
            ...prev,
            [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : prev[itemId]
        }))
    }, [])



    // Open gallery for a news item
    const openGallery = (item: NewsItem, imageIndex: number = 0, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (item.images && item.images.length > 0) {
            setGalleryImages(item.images.map((url, idx) => ({
                id: `news-${item.id}-img-${idx}`,
                url,
                fileName: `${item.title} - Image ${idx + 1}`
            })))
            setGalleryIndex(imageIndex)
            setGalleryOpen(true)
        }
    }

    if (loading) return null
    if (news.length === 0) return null

    // First item is featured, rest are regular
    const [featured, ...rest] = news

    return (
        <section id="news" className="py-20 bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        News & Updates
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                        What's New
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Stay up to date with the latest features, improvements, and announcements.
                    </p>
                </div>

                {featured && (
                    <div className="mb-12 max-w-4xl mx-auto">
                        <Link to="/news/$newsId" params={{ newsId: featured.id }}>
                            <article className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer">
                                <div className="grid md:grid-cols-2 gap-0">
                                    {featured.images && featured.images.length > 0 ? (
                                        <div className="relative h-64 md:h-full overflow-hidden group/image">
                                            {(() => {
                                                const currentIndex = imageIndices[featured.id] || 0;
                                                const currentUrl = featured.images[currentIndex];
                                                const showImage = !failedImages.has(currentUrl);

                                                if (!showImage) {
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                                            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <>
                                                        <img
                                                            src={currentUrl}
                                                            alt={featured.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            onError={(e) => {
                                                                failedImages.add(currentUrl);
                                                                // Force re-render to show fallback
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                                        {/* Navigation Arrows */}
                                                        {featured.images.length > 1 && (
                                                            <>
                                                                {currentIndex > 0 && (
                                                                    <button
                                                                        onClick={(e) => goToPrevImage(featured.id, e)}
                                                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                                    >
                                                                        <ChevronLeft className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                                {currentIndex < featured.images.length - 1 && (
                                                                    <button
                                                                        onClick={(e) => goToNextImage(featured.id, featured.images.length, e)}
                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                                    >
                                                                        <ChevronRight className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Expand button */}
                                                        <button
                                                            onClick={(e) => openGallery(featured, currentIndex, e)}
                                                            className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                            title="View images"
                                                        >
                                                            <Expand className="w-4 h-4" />
                                                        </button>

                                                        {/* Counter */}
                                                        {featured.images.length > 1 && (
                                                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full pointer-events-none">
                                                                {currentIndex + 1} / {featured.images.length}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="relative h-64 md:h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                                            <Sparkles className="w-16 h-16 text-primary/30" />
                                        </div>
                                    )}
                                    <div className="p-8 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                                Featured
                                            </span>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDistanceToNow(new Date(featured.created_at), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                                            {featured.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                                            {featured.content}
                                        </p>
                                        <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                                            <span>Read more</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    </div>
                )}

                {/* Other Posts Grid */}
                {rest.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        {rest.map((item) => (
                            <Link key={item.id} to="/news/$newsId" params={{ newsId: item.id }}>
                                <article className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer h-full">
                                    {item.images && item.images.length > 0 ? (
                                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50 group/image">
                                            {(() => {
                                                const currentIndex = imageIndices[item.id] || 0;
                                                const currentUrl = item.images[currentIndex];
                                                const showImage = !failedImages.has(currentUrl);

                                                if (!showImage) {
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <>
                                                        <img
                                                            src={currentUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            onError={(e) => {
                                                                failedImages.add(currentUrl);
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                                                        {/* Navigation Arrows */}
                                                        {item.images.length > 1 && (
                                                            <>
                                                                {currentIndex > 0 && (
                                                                    <button
                                                                        onClick={(e) => goToPrevImage(item.id, e)}
                                                                        className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                                    >
                                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                {currentIndex < item.images.length - 1 && (
                                                                    <button
                                                                        onClick={(e) => goToNextImage(item.id, item.images.length, e)}
                                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                                    >
                                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Expand button */}
                                                        <button
                                                            onClick={(e) => openGallery(item, currentIndex, e)}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm z-10"
                                                            title="View images"
                                                        >
                                                            <Expand className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Counter */}
                                                        {item.images.length > 1 && (
                                                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full pointer-events-none">
                                                                {currentIndex + 1} / {item.images.length}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <time dateTime={item.created_at}>
                                                {format(new Date(item.created_at), 'MMMM d, yyyy')}
                                            </time>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>Read more</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Swipe Gallery */}
            <ImageSwipeGallery
                images={galleryImages}
                initialIndex={galleryIndex}
                open={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />
        </section>
    )
}
