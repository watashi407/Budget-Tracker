import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SocialComment, ChatMessage, CreateCommentInput, CreateChatMessageInput } from '@/domain/entities/Social'
import { SupabaseSocialRepository, type OnlineUser } from '@/data/repositories/SupabaseSocialRepository'

const socialRepository = new SupabaseSocialRepository()

type FilterType = 'all' | 'suggestion' | 'feedback' | 'upcoming'

/**
 * useSocial Hook
 * Manages Social page state: comments, likes, and chat
 */
export function useSocial() {
    const [comments, setComments] = useState<SocialComment[]>([])
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [filter, setFilter] = useState<FilterType>('all')
    const [loading, setLoading] = useState(true)
    const [chatLoading, setChatLoading] = useState(true)
    const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike' | null>>({})

    // Fetch comments based on filter
    const fetchComments = useCallback(async () => {
        setLoading(true)
        try {
            const data = await socialRepository.getComments(filter)
            setComments(data)

            // Fetch user votes
            const commentIds = data.flatMap(c => [c.id, ...(c.replies?.map(r => r.id) || [])])
            if (commentIds.length > 0) {
                const votes = await socialRepository.getUserVotes(commentIds)
                setUserVotes(votes)
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setLoading(false)
        }
    }, [filter])

    // Fetch chat messages
    const fetchChatMessages = useCallback(async () => {
        setChatLoading(true)
        try {
            const data = await socialRepository.getChatMessages(100)
            setChatMessages(data)
        } catch (error) {
            console.error('Failed to fetch chat messages:', error)
        } finally {
            setChatLoading(false)
        }
    }, [])

    // Subscribe to real-time chat and presence
    useEffect(() => {
        fetchChatMessages()

        const unsubscribeChat = socialRepository.subscribeToChatMessages((message) => {
            setChatMessages(prev => [...prev, message])
        })

        const unsubscribePresence = socialRepository.subscribeToPresence((users) => {
            setOnlineUsers(users)
        })

        return () => {
            unsubscribeChat()
            unsubscribePresence()
        }
    }, [fetchChatMessages])

    // Fetch comments when filter changes
    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    // Create comment
    const createComment = useCallback(async (input: CreateCommentInput) => {
        const newComment = await socialRepository.createComment(input)

        if (input.parentId) {
            // Add as reply
            setComments(prev => prev.map(comment => {
                if (comment.id === input.parentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment]
                    }
                }
                return comment
            }))
        } else {
            // Add as top-level comment
            setComments(prev => [newComment, ...prev])
        }

        return newComment
    }, [])

    // Delete comment
    const deleteComment = useCallback(async (id: string) => {
        await socialRepository.deleteComment(id)
        setComments(prev => prev.filter(c => c.id !== id))
    }, [])

    // Toggle like/dislike
    const toggleLike = useCallback(async (commentId: string, type: 'like' | 'dislike') => {
        const currentVote = userVotes[commentId]

        // Optimistic update
        setUserVotes(prev => ({
            ...prev,
            [commentId]: currentVote === type ? null : type
        }))

        setComments(prev => prev.map(comment => {
            if (comment.id === commentId) {
                let likesCount = comment.likesCount
                let dislikesCount = comment.dislikesCount

                // Remove old vote
                if (currentVote === 'like') likesCount--
                if (currentVote === 'dislike') dislikesCount--

                // Add new vote if not toggling off
                if (currentVote !== type) {
                    if (type === 'like') likesCount++
                    if (type === 'dislike') dislikesCount++
                }

                return {
                    ...comment,
                    likesCount: Math.max(0, likesCount),
                    dislikesCount: Math.max(0, dislikesCount),
                    isUpcomingFeature: likesCount >= 10 && comment.type === 'suggestion'
                }
            }

            // Check replies
            if (comment.replies) {
                return {
                    ...comment,
                    replies: comment.replies.map(reply => {
                        if (reply.id === commentId) {
                            let likesCount = reply.likesCount
                            let dislikesCount = reply.dislikesCount

                            if (currentVote === 'like') likesCount--
                            if (currentVote === 'dislike') dislikesCount--

                            if (currentVote !== type) {
                                if (type === 'like') likesCount++
                                if (type === 'dislike') dislikesCount++
                            }

                            return {
                                ...reply,
                                likesCount: Math.max(0, likesCount),
                                dislikesCount: Math.max(0, dislikesCount)
                            }
                        }
                        return reply
                    })
                }
            }

            return comment
        }))

        try {
            await socialRepository.toggleLike(commentId, type)
        } catch (error) {
            // Revert on error
            fetchComments()
        }
    }, [userVotes, fetchComments])

    // Send chat message
    const sendChatMessage = useCallback(async (input: CreateChatMessageInput) => {
        return await socialRepository.sendChatMessage(input)
    }, [])

    // Stats
    const stats = useMemo(() => ({
        totalComments: comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0),
        totalSuggestions: comments.filter(c => c.type === 'suggestion').length,
        totalFeedback: comments.filter(c => c.type === 'feedback').length,
        upcomingFeatures: comments.filter(c => c.isUpcomingFeature).length,
    }), [comments])

    return {
        comments,
        chatMessages,
        onlineUsers,
        filter,
        setFilter,
        loading,
        chatLoading,
        userVotes,
        stats,
        createComment,
        deleteComment,
        toggleLike,
        sendChatMessage,
        refetch: fetchComments,
    }
}
