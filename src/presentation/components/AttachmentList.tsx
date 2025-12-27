import { useState, useEffect, useRef, useCallback } from 'react'
import type { Attachment } from '@/domain/entities/Attachment'
import { formatFileSize, getFileIcon } from '@/domain/entities/Attachment'
import { storageService } from '@/data/services/SupabaseStorageService'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { ImageSwipeGallery } from '@/presentation/components/ImageSwipeGallery'
import {
    FileText,
    Image as ImageIcon,
    FileSpreadsheet,
    File,
    Download,
    Trash2,
    Loader2,
    Eye,
    ChevronLeft,
    ChevronRight,
    Expand
} from 'lucide-react'


interface AttachmentListProps {
    attachments: Attachment[]
    onDelete?: (attachmentId: string) => void
    loading?: boolean
    deletingIds?: string[]
    readOnly?: boolean
}

/**
 * AttachmentList Component
 * Displays attachments with a gallery grid for images and list for documents.
 */
export function AttachmentList({
    attachments,
    onDelete,
    loading = false,
    deletingIds = [],
    readOnly = false,
}: AttachmentListProps) {
    const [downloadingIds, setDownloadingIds] = useState<string[]>([])
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [imageUrls, setImageUrls] = useState<{ id: string; url: string; fileName: string }[]>([])

    // Inline carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const carouselRef = useRef<HTMLDivElement>(null)

    // Split attachments into images and others
    const images = attachments.filter(a => a.fileType.startsWith('image/'))
    const documents = attachments.filter(a => !a.fileType.startsWith('image/'))

    // Minimum swipe distance
    const minSwipeDistance = 50

    // Fetch signed URLs for images
    useEffect(() => {
        const fetchImageUrls = async () => {
            const urls = await Promise.all(
                images.map(async (img) => {
                    try {
                        const url = await storageService.getDownloadUrl(img.filePath)
                        return { id: img.id, url, fileName: img.fileName }
                    } catch {
                        return { id: img.id, url: '', fileName: img.fileName }
                    }
                })
            )
            setImageUrls(urls.filter(u => u.url !== ''))
        }

        if (images.length > 0) {
            fetchImageUrls()
        }
    }, [images.length, attachments])

    // Reset index when images change
    useEffect(() => {
        if (currentImageIndex >= images.length && images.length > 0) {
            setCurrentImageIndex(images.length - 1)
        }
    }, [images.length, currentImageIndex])

    const getIcon = (fileType: string) => {
        const iconType = getFileIcon(fileType)
        switch (iconType) {
            case 'image': return ImageIcon
            case 'file-text': return FileText
            case 'file-spreadsheet': return FileSpreadsheet
            default: return File
        }
    }

    const handleDownload = async (attachment: Attachment) => {
        try {
            setDownloadingIds(prev => [...prev, attachment.id])
            const url = await storageService.getDownloadUrl(attachment.filePath)
            window.open(url, '_blank')
        } catch (error) {
            console.error('Failed to download file:', error)
        } finally {
            setDownloadingIds(prev => prev.filter(id => id !== attachment.id))
        }
    }

    const openGallery = (index: number) => {
        setGalleryIndex(index)
        setGalleryOpen(true)
    }

    // Inline carousel navigation
    const goToNextImage = useCallback(() => {
        if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
        }
    }, [currentImageIndex, images.length])

    const goToPrevImage = useCallback(() => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
        }
    }, [currentImageIndex])

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
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading files...</span>
            </div>
        )
    }

    if (attachments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-muted">
                <File className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No attachments yet</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Gallery Grid for Images */}
                {images.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Images ({images.length})
                        </h4>

                        {/* Inline Swipeable Image Carousel */}
                        <div
                            ref={carouselRef}
                            className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/50"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Main Image Display */}
                            <div
                                className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
                                style={{
                                    transform: isDragging ? `translateX(${dragOffset * 0.3}px)` : 'translateX(0)',
                                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                                }}
                            >
                                {imageUrls[currentImageIndex]?.url ? (
                                    <img
                                        src={imageUrls[currentImageIndex].url}
                                        alt={images[currentImageIndex]?.fileName || 'Image'}
                                        className="w-full h-full object-contain"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                        <span className="text-sm">Loading image...</span>
                                    </div>
                                )}

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        {currentImageIndex > 0 && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 shadow-lg"
                                                onClick={goToPrevImage}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {currentImageIndex < images.length - 1 && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 shadow-lg"
                                                onClick={goToNextImage}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* Image Counter */}
                                {images.length > 1 && (
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between p-3 bg-muted/20 border-t border-border/30">
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {images[currentImageIndex]?.fileName || 'Image'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openGallery(currentImageIndex)}
                                        title="View full screen"
                                    >
                                        <Expand className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDownload(images[currentImageIndex])}
                                        disabled={downloadingIds.includes(images[currentImageIndex]?.id)}
                                        title="Download"
                                    >
                                        {downloadingIds.includes(images[currentImageIndex]?.id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                    {!readOnly && onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => onDelete(images[currentImageIndex]?.id)}
                                            disabled={deletingIds.includes(images[currentImageIndex]?.id)}
                                            title="Delete"
                                        >
                                            {deletingIds.includes(images[currentImageIndex]?.id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnail Dots */}
                            {images.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/10">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-all duration-200 ${idx === currentImageIndex
                                                    ? 'bg-primary w-4'
                                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                                }`}
                                            onClick={() => setCurrentImageIndex(idx)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* List for Documents */}
                {documents.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Documents ({documents.length})
                        </h4>
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <AttachmentCard
                                    key={doc.id}
                                    attachment={doc}
                                    icon={getIcon(doc.fileType)}
                                    onDelete={onDelete}
                                    isDeleting={deletingIds.includes(doc.id)}
                                    isDownloading={downloadingIds.includes(doc.id)}
                                    onDownload={() => handleDownload(doc)}
                                    readOnly={readOnly}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Swipe Gallery for Images */}
            <ImageSwipeGallery
                images={imageUrls}
                initialIndex={galleryIndex}
                open={galleryOpen}
                onClose={() => setGalleryOpen(false)}
            />
        </>
    )
}

interface AttachmentCardProps {
    attachment: Attachment
    icon: React.ElementType
    isGalleryItem?: boolean
    onDelete?: (id: string) => void
    isDeleting?: boolean
    isDownloading?: boolean
    onDownload: () => void
    onGalleryOpen?: () => void
    readOnly?: boolean
    previewUrl?: string
}

function AttachmentCard({
    attachment,
    icon: Icon,
    isGalleryItem,
    onDelete,
    isDeleting,
    isDownloading,
    onDownload,
    onGalleryOpen,
    readOnly,
    previewUrl
}: AttachmentCardProps) {
    if (isGalleryItem) {
        return (
            <Card
                className="group relative overflow-hidden aspect-square flex items-center justify-center bg-muted/20 border-border/50 hover:border-border transition-all cursor-pointer"
                onClick={onGalleryOpen}
            >
                {/* Show actual image preview if available, otherwise fallback to icon */}
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Icon className="h-8 w-8 text-primary/40 group-hover:text-primary/60 transition-colors" />
                )}

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate px-1">
                        {attachment.fileName}
                    </p>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        disabled={isDownloading || isDeleting}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {!readOnly && onDelete && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={(e) => { e.stopPropagation(); onDelete(attachment.id); }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </Card>
        )
    }

    // List Item
    return (
        <div className="group flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {attachment.fileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onDownload}
                    disabled={isDownloading || isDeleting}
                >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>

                {!readOnly && onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(attachment.id)}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                )}
            </div>
        </div>
    )
}
