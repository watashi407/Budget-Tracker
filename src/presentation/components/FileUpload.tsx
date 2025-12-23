import { useState, useRef, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { validateFile, ALLOWED_FILE_TYPES, formatFileSize, MAX_FILE_SIZE } from '@/domain/entities/Attachment'
import { Upload, X, File as FileIcon, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
    onFileSelect: (file: File) => void
    onFileRemove?: () => void
    selectedFile?: File | null
    uploading?: boolean
    error?: string
    disabled?: boolean
    className?: string
}

/**
 * FileUpload Component
 * Modern drag and drop file upload with validation and visual feedback.
 */
export function FileUpload({
    onFileSelect,
    onFileRemove,
    selectedFile,
    uploading = false,
    error,
    disabled = false,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled && !uploading) {
            setIsDragging(true)
        }
    }, [disabled, uploading])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        setLocalError(null)

        if (disabled || uploading) return

        const file = e.dataTransfer.files[0]
        if (file) {
            const validation = validateFile(file)
            if (validation.valid) {
                onFileSelect(file)
            } else {
                setLocalError(validation.error || 'Invalid file')
            }
        }
    }, [disabled, uploading, onFileSelect])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalError(null)
        const file = e.target.files?.[0]
        if (file) {
            const validation = validateFile(file)
            if (validation.valid) {
                onFileSelect(file)
            } else {
                setLocalError(validation.error || 'Invalid file')
            }
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [onFileSelect])

    const handleClick = useCallback(() => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click()
        }
    }, [disabled, uploading])

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setLocalError(null)
        onFileRemove?.()
    }, [onFileRemove])

    const displayError = error || localError

    return (
        <div className={cn("space-y-3", className)}>
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
                    "flex flex-col items-center justify-center p-8 text-center",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                    (disabled || uploading) && "pointer-events-none opacity-60",
                    selectedFile && "border-primary/50 bg-primary/5 border-solid"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    disabled={disabled || uploading}
                />

                {selectedFile ? (
                    // Selected State
                    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="h-12 w-12 rounded-lg bg-background shadow-sm ring-1 ring-border flex items-center justify-center mb-3">
                            {selectedFile.type.startsWith('image/') ? (
                                <ImageIcon className="h-6 w-6 text-primary" />
                            ) : (
                                <FileIcon className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-foreground max-w-[200px] truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(selectedFile.size)}
                        </p>

                        {!uploading && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemove}
                                className="mt-3 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <X className="h-4 w-4 mr-1.5" />
                                Remove
                            </Button>
                        )}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-4 transition-transform duration-200",
                            "group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            Images, Documents or Spreadsheets
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Max size {formatFileSize(MAX_FILE_SIZE)}
                        </p>
                    </div>
                )}

                {/* Loading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-background shadow-lg rounded-full ring-1 ring-border">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs font-medium">Uploading...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {displayError && (
                <div className="flex items-center gap-2 text-destructive text-xs px-1 animate-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{displayError}</span>
                </div>
            )}
        </div>
    )
}
