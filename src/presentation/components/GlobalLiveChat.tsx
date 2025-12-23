import { useState, useEffect } from 'react'
import { LiveChat } from './LiveChat'
import { useSocial } from '@/presentation/hooks/useSocial'
import { CHAT_EVENTS, chatEvents } from '@/lib/chatEvents'

/**
 * GlobalLiveChat - Floating chat widget that appears on all pages
 * Uses useSocial hook internally to manage chat state
 */
export function GlobalLiveChat() {
    const [isOpen, setIsOpen] = useState(false)
    const { chatMessages, chatLoading, sendChatMessage, onlineUsers } = useSocial()

    // Listen for global open events (e.g. from SpeedDial)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true)
        const handleClose = () => setIsOpen(false)
        const handleToggle = () => setIsOpen(prev => !prev)

        chatEvents.addEventListener(CHAT_EVENTS.OPEN, handleOpen)
        chatEvents.addEventListener(CHAT_EVENTS.CLOSE, handleClose)
        chatEvents.addEventListener(CHAT_EVENTS.TOGGLE, handleToggle)

        return () => {
            chatEvents.removeEventListener(CHAT_EVENTS.OPEN, handleOpen)
            chatEvents.removeEventListener(CHAT_EVENTS.CLOSE, handleClose)
            chatEvents.removeEventListener(CHAT_EVENTS.TOGGLE, handleToggle)
        }
    }, [])

    // Adapter function to match LiveChat's expected signature
    const handleSendMessage = async (content: string) => {
        await sendChatMessage({ content })
    }

    return (
        <LiveChat
            messages={chatMessages}
            loading={chatLoading}
            onSendMessage={handleSendMessage}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onlineUsers={onlineUsers}
        />
    )
}
