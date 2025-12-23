import { useState, useTransition } from 'react'
import { useSocial } from '@/presentation/hooks/useSocial'
import { useAuth } from '@/presentation/context/AuthContext'
import { CommentCard } from '@/presentation/components/CommentCard'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog'
import { EmailVerificationMessage } from '@/presentation/components/EmailVerificationMessage'
import {
    MessageSquare,
    Lightbulb,
    MessageCircle,
    Sparkles,
    Plus,
    Loader2,
    TrendingUp
} from 'lucide-react'

type FilterType = 'all' | 'suggestion' | 'feedback' | 'upcoming'

export function SocialPage() {
    const { user } = useAuth()
    const {
        comments,
        comments,
        onlineUsers,
        filter,
        setFilter,
        loading,
        userVotes,
        stats,
        createComment,
        deleteComment,
        toggleLike,
        toggleLike
    } = useSocial()

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [replyToId, setReplyToId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [content, setContent] = useState('')
    const [type, setType] = useState<'suggestion' | 'feedback'>('suggestion')

    const isEmailVerified = user?.emailVerified

    const handleCreateComment = async () => {
        if (!content.trim()) return

        startTransition(async () => {
            try {
                await createComment({
                    content: content.trim(),
                    type,
                    parentId: replyToId || undefined,
                })
                setContent('')
                setType('suggestion')
                setReplyToId(null)
                setCreateDialogOpen(false)
            } catch (error) {
                console.error('Failed to create comment:', error)
            }
        })
    }

    const handleReply = (commentId: string) => {
        setReplyToId(commentId)
        setType('feedback')
        setCreateDialogOpen(true)
    }

    const handleDelete = (commentId: string) => {
        startTransition(async () => {
            try {
                await deleteComment(commentId)
            } catch (error) {
                console.error('Failed to delete comment:', error)
            }
        })
    }



    const filterButtons: { value: FilterType; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: 'All', icon: <MessageSquare className="w-4 h-4" /> },
        { value: 'suggestion', label: 'Suggestions', icon: <Lightbulb className="w-4 h-4" /> },
        { value: 'feedback', label: 'Feedback', icon: <MessageCircle className="w-4 h-4" /> },
        { value: 'upcoming', label: 'Upcoming', icon: <Sparkles className="w-4 h-4" /> },
    ]

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Community</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Social Hub</h1>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Post
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Share suggestions, provide feedback, and connect with the community
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total Posts</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stats.totalComments}</p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Suggestions</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stats.totalSuggestions}</p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Feedback</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stats.totalFeedback}</p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground">Upcoming</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stats.upcomingFeatures}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted/30 rounded-xl">
                {filterButtons.map(btn => (
                    <Button
                        key={btn.value}
                        variant={filter === btn.value ? 'default' : 'ghost'}
                        size="sm"
                        className="gap-2 flex-1 sm:flex-none"
                        onClick={() => setFilter(btn.value)}
                    >
                        {btn.icon}
                        {btn.label}
                    </Button>
                ))}
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/30">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground">No posts yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Be the first to share something!</p>
                        <Button
                            variant="outline"
                            className="mt-4 gap-2"
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Create First Post
                        </Button>
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            userVote={userVotes[comment.id] || null}
                            onLike={toggleLike}
                            onReply={handleReply}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>



            {/* Create Comment Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {replyToId ? 'Reply to Comment' : 'Create New Post'}
                        </DialogTitle>
                        <DialogDescription>
                            {replyToId
                                ? 'Share your thoughts on this comment'
                                : 'Share a suggestion or feedback with the community'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {!isEmailVerified ? (
                        <EmailVerificationMessage
                            onClose={() => setCreateDialogOpen(false)}
                            actionName="posting comments"
                        />
                    ) : (
                        <>
                            <div className="space-y-4 py-4">
                                {!replyToId && (
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select value={type} onValueChange={(v) => setType(v as 'suggestion' | 'feedback')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="suggestion">
                                                    <div className="flex items-center gap-2">
                                                        <Lightbulb className="w-4 h-4 text-blue-500" />
                                                        Suggestion
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="feedback">
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="w-4 h-4 text-purple-500" />
                                                        Feedback
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Suggestions with 10+ likes become "Upcoming Features"! 🎉
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <Textarea
                                        placeholder="Share your thoughts..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={4}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setCreateDialogOpen(false)
                                        setReplyToId(null)
                                    }}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateComment}
                                    disabled={!content.trim() || isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        replyToId ? 'Reply' : 'Post'
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
