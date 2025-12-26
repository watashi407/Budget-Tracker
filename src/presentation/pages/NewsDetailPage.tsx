import { useState, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { Button } from '@/presentation/components/ui/button'
import { ArrowLeft, Calendar, Loader2, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'

export function NewsDetailPage() {
    const { newsId } = useParams({ from: '/news/$newsId' })
    const [news, setNews] = useState<NewsItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<number>(0)

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
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                            <img
                                src={news.images[selectedImage]}
                                alt={`${news.title} - Image ${selectedImage + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Thumbnails */}
                        {news.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {news.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImage
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'border-transparent hover:border-border'
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
        </div>
    )
}
