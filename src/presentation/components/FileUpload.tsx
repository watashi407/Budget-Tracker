import { useState, useRef, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { validateFile, ALLOWED_FILE_TYPES, formatFileSize, MAX_FILE_SIZE } from '@/domain/entities/Attachment'
import { Upload, X, FileIcon, Loader2, AlertCircle } from 'lucide-react'

interface FileUploadProps {
    onFileSelect: (file: File) => void
    onFileRemove?: () => void
    selectedFile?: File | null
    uploading?: boolean
    error?: string
    disabled?: boolean
}

/**
 * FileUpload Component
 * Drag and drop file upload with validation.
 */
export function FileUpload({
    onFileSelect,
    onFileRemove,
    selectedFile,
    uploading = false,
    error,
    disabled = false,
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

    const handleRemove = useCallback(() => {
        setLocalError(null)
        onFileRemove?.()
    }, [onFileRemove])

    const displayError = error || localError

    // If a file is selected, show file preview
    if (selectedFile) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleRemove}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {displayError && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {displayError}
                    </div>
                )}
            </div>
        )
    }

    // Drop zone
    return (
        <div className="space-y-2">
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    disabled={disabled || uploading}
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">
                    Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Images, PDF, Word, Excel, CSV (max {formatFileSize(MAX_FILE_SIZE)})
                </p>
            </div>
            {displayError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {displayError}
                </div>
            )}
        </div>
    )
}
