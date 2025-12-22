/**
 * Social Comment Entity
 * Domain entity for comments in the Social page
 */
export interface SocialComment {
    id: string
    userId: string
    content: string
    type: 'suggestion' | 'feedback'
    parentId: string | null
    likesCount: number
    dislikesCount: number
    isUpcomingFeature: boolean
    createdAt: Date
    updatedAt: Date
    // Joined data
    authorName?: string
    authorAvatar?: string
    replies?: SocialComment[]
    userVote?: 'like' | 'dislike' | null
}

export interface CreateCommentInput {
    content: string
    type: 'suggestion' | 'feedback'
    parentId?: string
}

export interface SocialLike {
    id: string
    commentId: string
    userId: string
    type: 'like' | 'dislike'
    createdAt: Date
}

export interface ChatMessage {
    id: string
    userId: string
    content: string
    createdAt: Date
    // Joined data
    authorName?: string
    authorAvatar?: string
}

export interface CreateChatMessageInput {
    content: string
}
