import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { FileUpload } from '@/presentation/components/FileUpload'
import { AttachmentList } from '@/presentation/components/AttachmentList'
import { useAttachments } from '@/presentation/hooks/useAttachments'
import { Paperclip, Upload, AlertCircle, Loader2 } from 'lucide-react'
import type { Transaction } from '@/domain/entities/Transaction'

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

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedFile(null)
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-primary" />
                        <span>Attachments</span>
                        {attachments.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">
                                {attachments.length}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Transaction Info Card */}
                    {transaction && (
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                            <p className="text-sm font-medium text-foreground truncate">
                                {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="space-y-3">
                        <FileUpload
                            onFileSelect={setSelectedFile}
                            onFileRemove={() => setSelectedFile(null)}
                            selectedFile={selectedFile}
                            uploading={uploading}
                        />

                        {selectedFile && (
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full gap-2"
                                size="sm"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload File
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Uploaded Files Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Uploaded Files
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                        </h4>
                        <AttachmentList
                            attachments={attachments}
                            onDelete={handleDelete}
                            loading={loading}
                            deletingIds={deletingIds}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
