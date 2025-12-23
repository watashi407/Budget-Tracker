import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Separator } from '@/presentation/components/ui/separator'
import { Badge } from '@/presentation/components/ui/badge'
import { FileUpload } from '@/presentation/components/FileUpload'
import { AttachmentList } from '@/presentation/components/AttachmentList'
import { useAttachments } from '@/presentation/hooks/useAttachments'
import { Paperclip, AlertCircle, Calendar, Tag, CreditCard, ChevronRight } from 'lucide-react'
import type { Transaction } from '@/domain/entities/Transaction'
import { cn } from '@/lib/utils'

interface TransactionAttachmentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

/**
 * TransactionAttachmentsDialog Component
 * Modal dialog for viewing and managing attachments on a transaction.
 */
export function TransactionAttachmentsDialog({
    open,
    onOpenChange,
    transaction,
}: TransactionAttachmentsDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const {
        attachments,
        loading,
        uploading,
        deletingIds,
        error,
        uploadAttachment,
        deleteAttachment,
    } = useAttachments('transaction', transaction?.id)

    const handleUpload = async () => {
        if (!selectedFile) return

        const result = await uploadAttachment(selectedFile)
        if (result) {
            setSelectedFile(null)
        }
    }

    const handleDelete = async (attachmentId: string) => {
        await deleteAttachment(attachmentId)
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedFile(null)
        }
        onOpenChange(isOpen)
    }

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header Section */}
                <div className="px-6 py-4 border-b bg-muted/10">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <span className="p-2 bg-primary/10 rounded-lg">
                                    <Paperclip className="w-5 h-5 text-primary" />
                                </span>
                                <div>
                                    Attachments
                                    {attachments.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 text-xs font-normal">
                                            {attachments.length} file{attachments.length !== 1 && 's'}
                                        </Badge>
                                    )}
                                </div>
                            </DialogTitle>
                        </div>

                        {/* Transaction Summary Card */}
                        <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-xl border border-border/50 text-sm">
                            <div className="flex items-center justify-between font-medium">
                                <span className="truncate max-w-[250px]">{transaction.description}</span>
                                <span className={cn(
                                    transaction.type === 'income' ? "text-success" : "text-foreground"
                                )}>
                                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </span>
                            </div>
                            <Separator className="bg-border/50 my-1" />
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-primary/70" />
                                    <span>{transaction.category}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content Section (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload Area */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                            Upload New
                        </h3>
                        <div className="flex flex-col gap-3">
                            <FileUpload
                                onFileSelect={setSelectedFile}
                                onFileRemove={() => setSelectedFile(null)}
                                selectedFile={selectedFile}
                                uploading={uploading}
                            />
                            {selectedFile && !uploading && (
                                <Button
                                    className="w-full sm:w-auto self-end"
                                    onClick={handleUpload}
                                >
                                    Upload File
                                </Button>
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Attachments List */}
                    <section className="space-y-3 pb-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs">2</span>
                            Attached Files
                        </h3>
                        <AttachmentList
                            attachments={attachments}
                            onDelete={handleDelete}
                            loading={loading}
                            deletingIds={deletingIds}
                        />
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}
