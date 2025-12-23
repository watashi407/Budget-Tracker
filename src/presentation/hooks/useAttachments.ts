import { useState, useEffect, useCallback } from 'react'
import type { Attachment, CreateAttachmentInput } from '@/domain/entities/Attachment'
import { storageService } from '@/data/services/SupabaseStorageService'

interface UseAttachmentsReturn {
    attachments: Attachment[]
    loading: boolean
    uploading: boolean
    deletingIds: string[]
    error: string | null
    uploadAttachment: (file: File) => Promise<Attachment | null>
    deleteAttachment: (attachmentId: string) => Promise<boolean>
    refetch: () => Promise<void>
}

/**
 * useAttachments Hook
 * Manages attachments for a specific entity (budget or transaction).
 * Provides upload, delete, and automatic refetching on changes.
 */
export function useAttachments(
    entityType: 'budget' | 'transaction',
    entityId: string | null | undefined
): UseAttachmentsReturn {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deletingIds, setDeletingIds] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    // Fetch attachments
    const fetchAttachments = useCallback(async () => {
        if (!entityId) {
            setAttachments([])
            return
        }

        setLoading(true)
        setError(null)

        try {
            const data = await storageService.getAttachments(entityType, entityId)
            setAttachments(data)
        } catch (err) {
            console.error('Failed to fetch attachments:', err)
            setError(err instanceof Error ? err.message : 'Failed to load attachments')
        } finally {
            setLoading(false)
        }
    }, [entityType, entityId])

    // Fetch on mount and when entity changes
    useEffect(() => {
        fetchAttachments()
    }, [fetchAttachments])

    // Upload attachment
    const uploadAttachment = useCallback(async (file: File): Promise<Attachment | null> => {
        if (!entityId) {
            setError('Cannot upload: entity ID is missing')
            return null
        }

        setUploading(true)
        setError(null)

        try {
            const input: CreateAttachmentInput = {
                file,
                entityType,
                entityId,
            }
            const newAttachment = await storageService.uploadAttachment(input)

            // Immediately add to state for instant feedback
            setAttachments(prev => [newAttachment, ...prev])

            return newAttachment
        } catch (err) {
            console.error('Failed to upload attachment:', err)
            setError(err instanceof Error ? err.message : 'Failed to upload file')
            return null
        } finally {
            setUploading(false)
        }
    }, [entityType, entityId])

    // Delete attachment
    const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
        setDeletingIds(prev => [...prev, attachmentId])
        setError(null)

        try {
            await storageService.deleteAttachment(attachmentId)

            // Immediately remove from state for instant feedback
            setAttachments(prev => prev.filter(a => a.id !== attachmentId))

            return true
        } catch (err) {
            console.error('Failed to delete attachment:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete file')
            return false
        } finally {
            setDeletingIds(prev => prev.filter(id => id !== attachmentId))
        }
    }, [])

    return {
        attachments,
        loading,
        uploading,
        deletingIds,
        error,
        uploadAttachment,
        deleteAttachment,
        refetch: fetchAttachments,
    }
}
