import { useState } from 'react'
import type { Attachment } from '@/domain/entities/Attachment'
import { formatFileSize, getFileIcon } from '@/domain/entities/Attachment'
import { storageService } from '@/data/services/SupabaseStorageService'
import { Button } from '@/presentation/components/ui/button'
import {
    FileText,
    Image,
    FileSpreadsheet,
    File,
    Download,
    Trash2,
    Loader2,
    ExternalLink
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
 * Displays a list of attachments with download and delete actions.
 */
export function AttachmentList({
    attachments,
    onDelete,
    loading = false,
    deletingIds = [],
    readOnly = false,
}: AttachmentListProps) {
    const [downloadingIds, setDownloadingIds] = useState<string[]>([])

    const getIcon = (fileType: string) => {
        const iconType = getFileIcon(fileType)
        switch (iconType) {
            case 'image':
                return Image
            case 'file-text':
                return FileText
            case 'file-spreadsheet':
                return FileSpreadsheet
            default:
                return File
        }
    }

    const handleDownload = async (attachment: Attachment) => {
        try {
            setDownloadingIds(prev => [...prev, attachment.id])
            const url = await storageService.getDownloadUrl(attachment.filePath)

            // Open in new tab for viewing
            window.open(url, '_blank')
        } catch (error) {
            console.error('Failed to download file:', error)
        } finally {
            setDownloadingIds(prev => prev.filter(id => id !== attachment.id))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (attachments.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground">
                No attachments
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {attachments.map((attachment) => {
                const Icon = getIcon(attachment.fileType)
                const isDeleting = deletingIds.includes(attachment.id)
                const isDownloading = downloadingIds.includes(attachment.id)

                return (
                    <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {attachment.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.fileSize)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Download / View button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownload(attachment)}
                                disabled={isDownloading || isDeleting}
                                title="View / Download"
                            >
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : attachment.fileType.startsWith('image/') ? (
                                    <ExternalLink className="h-4 w-4" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                            </Button>

                            {/* Delete button */}
                            {!readOnly && onDelete && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(attachment.id)}
                                    disabled={isDeleting}
                                    title="Delete"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
