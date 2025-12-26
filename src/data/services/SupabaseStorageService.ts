import { supabase } from '@/lib/supabase'
import type { Attachment, CreateAttachmentInput } from '@/domain/entities/Attachment'
import { validateFile } from '@/domain/entities/Attachment'

/**
 * SupabaseStorageService
 * Handles file uploads and attachments using Supabase Storage.
 * This is part of the Data layer in Clean Architecture.
 */
export class SupabaseStorageService {
    private readonly bucketName = 'attachments'
    private readonly tableName = 'attachments'

    /**
     * Upload a file and create an attachment record
     */
    async uploadAttachment(input: CreateAttachmentInput): Promise<Attachment> {
        console.log('SupabaseStorageService.uploadAttachment called with:', {
            fileName: input.file.name,
            type: input.file.type,
            size: input.file.size
        });

        // Validate file
        const validation = validateFile(input.file)
        if (!validation.valid) {
            console.error('File validation failed:', validation.error);
            throw new Error(validation.error)
        }

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
            console.error('User not authenticated');
            throw new Error('Not authenticated')
        }
        console.log('User authenticated:', userData.user.id);

        // Generate unique file path: userId/entityType/entityId/timestamp_filename
        const timestamp = Date.now()
        const sanitizedFileName = input.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${userData.user.id}/${input.entityType}/${input.entityId}/${timestamp}_${sanitizedFileName}`
        console.log('Generated file path:', filePath);

        // Upload file to storage
        console.log('Uploading to Supabase storage bucket:', this.bucketName, 'path:', filePath);
        const { error: uploadError } = await supabase.storage
            .from(this.bucketName)
            .upload(filePath, input.file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`)
        }
        console.log('Storage upload successful');

        // Create attachment record in database
        console.log('Creating attachment record in database table:', this.tableName);
        const { data, error } = await supabase
            .from(this.tableName)
            .insert({
                user_id: userData.user.id,
                entity_type: input.entityType,
                entity_id: input.entityId,
                file_name: input.file.name,
                file_path: filePath,
                file_type: input.file.type,
                file_size: input.file.size,
            })
            .select()
            .single()

        if (error) {
            console.error('Database insert error:', error);
            // Cleanup uploaded file on database error
            await supabase.storage.from(this.bucketName).remove([filePath])
            throw new Error(`Failed to create attachment record: ${error.message}`)
        }

        console.log('Attachment record created:', data);
        return this.mapToAttachment(data)
    }

    /**
     * Get all attachments for an entity
     */
    async getAttachments(entityType: 'budget' | 'transaction', entityId: string): Promise<Attachment[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch attachments: ${error.message}`)
        }

        return (data || []).map(this.mapToAttachment.bind(this))
    }

    /**
     * Delete an attachment
     */
    async deleteAttachment(attachmentId: string): Promise<void> {
        // First get the attachment to get the file path
        const { data: attachment, error: fetchError } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', attachmentId)
            .single()

        if (fetchError) {
            throw new Error(`Attachment not found: ${fetchError.message}`)
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from(this.bucketName)
            .remove([attachment.file_path])

        if (storageError) {
            console.error('Failed to delete file from storage:', storageError)
            // Continue with database deletion anyway
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', attachmentId)

        if (deleteError) {
            throw new Error(`Failed to delete attachment: ${deleteError.message}`)
        }
    }

    /**
     * Get a signed URL for downloading a file
     */
    async getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        const { data, error } = await supabase.storage
            .from(this.bucketName)
            .createSignedUrl(filePath, expiresIn)

        if (error) {
            throw new Error(`Failed to get download URL: ${error.message}`)
        }

        return data.signedUrl
    }

    /**
     * Map database row to Attachment entity
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToAttachment(row: any): Attachment {
        return {
            id: row.id,
            fileName: row.file_name,
            fileType: row.file_type,
            fileSize: row.file_size,
            filePath: row.file_path,
            url: '', // URL is generated on-demand via getDownloadUrl
            createdAt: new Date(row.created_at),
        }
    }
}

// Singleton instance
export const storageService = new SupabaseStorageService()
