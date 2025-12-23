import { useState } from 'react'
import type { Attachment } from '@/domain/entities/Attachment'
import { formatFileSize, getFileIcon } from '@/domain/entities/Attachment'
import { storageService } from '@/data/services/SupabaseStorageService'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import {
    FileText,
    Image as ImageIcon,
    FileSpreadsheet,
    File,
    Download,
    Trash2,
    Loader2,
    ExternalLink,
    Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

    // Split attachments into images and others
    const images = attachments.filter(a => a.fileType.startsWith('image/'))
    const documents = attachments.filter(a => !a.fileType.startsWith('image/'))

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
        <div className="space-y-6">
            {/* Gallery Grid for Images */}
            {images.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Images ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img) => (
                            <AttachmentCard
                                key={img.id}
                                attachment={img}
                                icon={ImageIcon}
                                isGalleryItem
                                onDelete={onDelete}
                                isDeleting={deletingIds.includes(img.id)}
                                isDownloading={downloadingIds.includes(img.id)}
                                onDownload={() => handleDownload(img)}
                                readOnly={readOnly}
                            />
                        ))}
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
    readOnly?: boolean
}

function AttachmentCard({
    attachment,
    icon: Icon,
    isGalleryItem,
    onDelete,
    isDeleting,
    isDownloading,
    onDownload,
    readOnly
}: AttachmentCardProps) {
    if (isGalleryItem) {
        return (
            <Card className="group relative overflow-hidden aspect-square flex items-center justify-center bg-muted/20 border-border/50 hover:border-border transition-all">
                {/* Fallback Icon (Real image preview requires caching/signedURL, using icon for now for performance) */}
                <Icon className="h-8 w-8 text-primary/40 group-hover:text-primary/60 transition-colors" />

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
