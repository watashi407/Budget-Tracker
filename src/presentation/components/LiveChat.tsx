import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/domain/entities/Social'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { useAuth } from '@/presentation/context/AuthContext'
import { Send, MessageCircle, X, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface LiveChatProps {
    messages: ChatMessage[]
    loading: boolean
    onSendMessage: (content: string) => Promise<void>
    isOpen: boolean
    onClose: () => void
}

export function LiveChat({ messages, loading, onSendMessage, isOpen, onClose }: LiveChatProps) {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!message.trim() || sending) return

        setSending(true)
        try {
            await onSendMessage(message.trim())
            setMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-orange-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Live Chat</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Chat with the community in real-time
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                        <p className="text-xs text-muted-foreground">Be the first to say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.userId === user?.id
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                    {!isOwn && (
                                        <p className="text-[10px] text-muted-foreground mb-1 ml-1">
                                            {msg.authorName || 'User'}
                                        </p>
                                    )}
                                    <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : 'bg-muted text-foreground rounded-bl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <p className={`text-[9px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                        {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/30">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="flex-1 h-10 rounded-xl"
                    />
                    <Button
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        onClick={handleSend}
                        disabled={!message.trim() || sending}
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
