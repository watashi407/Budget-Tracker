/**
 * Domain Entity: Attachment
 * Represents a file attachment for budgets or transactions.
 * This is part of the Domain layer in Clean Architecture.
 */
export interface Attachment {
    id: string
    fileName: string
    fileType: string
    fileSize: number
    filePath: string
    url: string
    createdAt: Date
}

/**
 * Input for creating an attachment (file upload)
 */
export interface CreateAttachmentInput {
    file: File
    entityType: 'budget' | 'transaction'
    entityId: string
}

/**
 * Supported file types for attachments
 */
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
]

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return { valid: false, error: 'File type not supported. Allowed: images, PDF, Word, Excel, CSV, TXT' }
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large. Maximum size is 5MB' }
    }
    return { valid: true }
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType === 'application/pdf') return 'file-text'
    if (fileType.includes('word')) return 'file-text'
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType === 'text/csv') return 'file-spreadsheet'
    return 'file'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
