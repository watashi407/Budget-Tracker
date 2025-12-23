import { useState } from 'react'
import { LiveChat } from './LiveChat'
import { useSocial } from '@/presentation/hooks/useSocial'
import { Button } from '@/presentation/components/ui/button'
import { MessageCircle } from 'lucide-react'

/**
 * GlobalLiveChat - Floating chat widget that appears on all pages
 * Uses useSocial hook internally to manage chat state
 */
export function GlobalLiveChat() {
    const [isOpen, setIsOpen] = useState(false)
    const { chatMessages, chatLoading, sendChatMessage, onlineUsers } = useSocial()

    // Adapter function to match LiveChat's expected signature
    const handleSendMessage = async (content: string) => {
        await sendChatMessage({ content })
    }

    return (
        <>
            {/* Chat Window */}
            <LiveChat
                messages={chatMessages}
                loading={chatLoading}
                onSendMessage={handleSendMessage}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onlineUsers={onlineUsers}
            />

            {/* FAB Button - Only show when chat is closed */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-400 z-50 animate-pulse-glow"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}
        </>
    )
}
