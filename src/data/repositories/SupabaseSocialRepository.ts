import { supabase } from '@/lib/supabase'
import type { ISocialRepository } from '@/domain/repositories/ISocialRepository'
import type { SocialComment, ChatMessage, CreateCommentInput, CreateChatMessageInput } from '@/domain/entities/Social'

// Type for online user presence
export interface OnlineUser {
    id: string
    name: string
    email: string
}

/**
 * SupabaseSocialRepository
 * Implementation of ISocialRepository using Supabase
 */
export class SupabaseSocialRepository implements ISocialRepository {

    /**
     * Get comments with optional filtering
     */
    async getComments(filter: 'all' | 'suggestion' | 'feedback' | 'upcoming' = 'all'): Promise<SocialComment[]> {
        let query = supabase
            .from('social_comments')
            .select('*')
            .is('parent_id', null) // Only top-level comments
            .order('created_at', { ascending: false })

        if (filter === 'suggestion') {
            query = query.eq('type', 'suggestion')
        } else if (filter === 'feedback') {
            query = query.eq('type', 'feedback')
        } else if (filter === 'upcoming') {
            query = query.eq('is_upcoming_feature', true)
        }

        const { data, error } = await query

        if (error) throw error

        // Get replies for each comment
        const comments = await Promise.all((data || []).map(async (comment) => {
            const replies = await this.getReplies(comment.id)
            return this.mapComment({ ...comment, replies })
        }))

        return comments
    }

    /**
     * Get replies for a comment
     */
    private async getReplies(parentId: string): Promise<SocialComment[]> {
        const { data, error } = await supabase
            .from('social_comments')
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true })

        if (error) throw error

        return (data || []).map(comment => this.mapComment(comment))
    }

    /**
     * Create a new comment with author info
     */
    async createComment(input: CreateCommentInput): Promise<SocialComment> {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error('Not authenticated')

        const authorName = userData.user.user_metadata?.full_name ||
            userData.user.email?.split('@')[0] ||
            'User'
        const authorEmail = userData.user.email || ''

        const { data, error } = await supabase
            .from('social_comments')
            .insert({
                user_id: userData.user.id,
                content: input.content,
                type: input.type,
                parent_id: input.parentId || null,
                author_name: authorName,
                author_email: authorEmail,
            })
            .select()
            .single()

        if (error) throw error

        return this.mapComment(data)
    }

    /**
     * Delete a comment
     */
    async deleteComment(id: string): Promise<void> {
        const { error } = await supabase
            .from('social_comments')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    /**
     * Toggle like/dislike on a comment
     */
    async toggleLike(commentId: string, type: 'like' | 'dislike'): Promise<void> {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error('Not authenticated')

        // Check if user already voted
        const { data: existingVote } = await supabase
            .from('social_likes')
            .select('*')
            .eq('comment_id', commentId)
            .eq('user_id', userData.user.id)
            .single()

        if (existingVote) {
            // If same type, remove vote
            if (existingVote.type === type) {
                await supabase
                    .from('social_likes')
                    .delete()
                    .eq('id', existingVote.id)
            } else {
                // Change vote type
                await supabase
                    .from('social_likes')
                    .delete()
                    .eq('id', existingVote.id)

                await supabase
                    .from('social_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: userData.user.id,
                        type,
                    })
            }
        } else {
            // Create new vote
            await supabase
                .from('social_likes')
                .insert({
                    comment_id: commentId,
                    user_id: userData.user.id,
                    type,
                })
        }
    }

    /**
     * Get user's votes for multiple comments
     */
    async getUserVotes(commentIds: string[]): Promise<Record<string, 'like' | 'dislike' | null>> {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return {}

        const { data, error } = await supabase
            .from('social_likes')
            .select('comment_id, type')
            .eq('user_id', userData.user.id)
            .in('comment_id', commentIds)

        if (error) throw error

        const votes: Record<string, 'like' | 'dislike' | null> = {}
        commentIds.forEach(id => votes[id] = null)
        data?.forEach(vote => votes[vote.comment_id] = vote.type)

        return votes
    }

    /**
     * Get chat messages
     */
    async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(limit)

        if (error) throw error

        return (data || []).map(msg => this.mapChatMessage(msg))
    }

    /**
     * Send a chat message with author info
     */
    async sendChatMessage(input: CreateChatMessageInput): Promise<ChatMessage> {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error('Not authenticated')

        const authorName = userData.user.user_metadata?.full_name ||
            userData.user.email?.split('@')[0] ||
            'User'
        const authorEmail = userData.user.email || ''

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: userData.user.id,
                content: input.content,
                author_name: authorName,
                author_email: authorEmail,
            })
            .select()
            .single()

        if (error) throw error

        return this.mapChatMessage(data)
    }

    /**
     * Subscribe to real-time chat messages
     */
    subscribeToChatMessages(callback: (message: ChatMessage) => void): () => void {
        const channel = supabase
            .channel('chat_messages_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    callback(this.mapChatMessage(payload.new))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    /**
     * Map database row to SocialComment entity
     */
    private mapComment(row: Record<string, unknown>): SocialComment {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            content: row.content as string,
            type: row.type as 'suggestion' | 'feedback',
            parentId: row.parent_id as string | null,
            likesCount: row.likes_count as number,
            dislikesCount: row.dislikes_count as number,
            isUpcomingFeature: row.is_upcoming_feature as boolean,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
            replies: row.replies as SocialComment[] | undefined,
            authorName: row.author_name as string | undefined,
        }
    }

    /**
     * Map database row to ChatMessage entity
     */
    private mapChatMessage(row: Record<string, unknown>): ChatMessage {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            content: row.content as string,
            createdAt: new Date(row.created_at as string),
            authorName: row.author_name as string | undefined,
        }
    }

    /**
     * Subscribe to presence channel for online users
     */
    subscribeToPresence(
        onSync: (users: OnlineUser[]) => void
    ): () => void {
        const channel = supabase.channel('social_presence', {
            config: { presence: { key: 'user' } }
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<{ name: string; email: string }>()
                const users: OnlineUser[] = []
                Object.keys(state).forEach(key => {
                    const presences = state[key]
                    presences.forEach(p => {
                        users.push({
                            id: key,
                            name: p.name || 'User',
                            email: p.email || '',
                        })
                    })
                })
                onSync(users)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: userData } = await supabase.auth.getUser()
                    if (userData.user) {
                        const name = userData.user.user_metadata?.full_name ||
                            userData.user.email?.split('@')[0] || 'User'
                        await channel.track({
                            name,
                            email: userData.user.email || '',
                        })
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }
}
