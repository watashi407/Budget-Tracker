import type { SocialComment, ChatMessage, CreateCommentInput, CreateChatMessageInput } from '@/domain/entities/Social'

/**
 * ISocialRepository
 * Repository interface for Social feature operations
 */
export interface ISocialRepository {
    // Comments
    getComments(filter?: 'all' | 'suggestion' | 'feedback' | 'upcoming'): Promise<SocialComment[]>
    createComment(input: CreateCommentInput): Promise<SocialComment>
    deleteComment(id: string): Promise<void>

    // Likes
    toggleLike(commentId: string, type: 'like' | 'dislike'): Promise<void>
    getUserVotes(commentIds: string[]): Promise<Record<string, 'like' | 'dislike' | null>>

    // Chat
    getChatMessages(limit?: number): Promise<ChatMessage[]>
    sendChatMessage(input: CreateChatMessageInput): Promise<ChatMessage>
    subscribeToChatMessages(callback: (message: ChatMessage) => void): () => void
}
