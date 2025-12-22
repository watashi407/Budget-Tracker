import { useState } from 'react'
import type { SocialComment } from '@/domain/entities/Social'
import { Button } from '@/presentation/components/ui/button'
import { useAuth } from '@/presentation/context/AuthContext'
import { ThumbsUp, ThumbsDown, Reply, Trash2, MessageSquare, Sparkles, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CommentCardProps {
    comment: SocialComment
    userVote: 'like' | 'dislike' | null
    onLike: (commentId: string, type: 'like' | 'dislike') => void
    onReply: (commentId: string) => void
    onDelete: (commentId: string) => void
    isReply?: boolean
}

export function CommentCard({ comment, userVote, onLike, onReply, onDelete, isReply = false }: CommentCardProps) {
    const { user } = useAuth()
    const [showReplies, setShowReplies] = useState(true)
    const isOwner = user?.id === comment.userId

    return (
        <div className={`${isReply ? 'ml-8 border-l-2 border-border/50 pl-4' : ''}`}>
            <div className={`p-4 rounded-xl bg-card/50 border border-border/50 ${comment.isUpcomingFeature ? 'ring-2 ring-amber-500/50 bg-amber-500/5' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {comment.authorName || 'Anonymous'}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Type Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${comment.type === 'suggestion'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-purple-500/10 text-purple-500'
                            }`}>
                            {comment.type}
                        </span>

                        {/* Upcoming Feature Badge */}
                        {comment.isUpcomingFeature && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-amber-500/10 text-amber-500 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Upcoming
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">
                    {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Like */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 ${userVote === 'like' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground'}`}
                        onClick={() => onLike(comment.id, 'like')}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs font-medium">{comment.likesCount}</span>
                    </Button>

                    {/* Dislike */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 ${userVote === 'dislike' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}`}
                        onClick={() => onLike(comment.id, 'dislike')}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-xs font-medium">{comment.dislikesCount}</span>
                    </Button>

                    {/* Reply (only for top-level) */}
                    {!isReply && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground"
                            onClick={() => onReply(comment.id)}
                        >
                            <Reply className="w-4 h-4" />
                            <span className="text-xs">Reply</span>
                        </Button>
                    )}

                    {/* Delete (owner only) */}
                    {isOwner && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(comment.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Replies toggle */}
                    {!isReply && comment.replies && comment.replies.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground ml-auto"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs">{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.replies.map(reply => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            userVote={null}
                            onLike={onLike}
                            onReply={onReply}
                            onDelete={onDelete}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
