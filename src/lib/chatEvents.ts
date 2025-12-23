/**
 * Simple event bus for Chat interactions.
 * Decouples the Dashboard SpeedDial (Trigger) from the GlobalLiveChat (UI).
 */
export const chatEvents = new EventTarget()

export const CHAT_EVENTS = {
    OPEN: 'open-chat',
    CLOSE: 'close-chat',
    TOGGLE: 'toggle-chat'
}

export function openChat() {
    chatEvents.dispatchEvent(new Event(CHAT_EVENTS.OPEN))
}

export function closeChat() {
    chatEvents.dispatchEvent(new Event(CHAT_EVENTS.CLOSE))
}

export function toggleChat() {
    chatEvents.dispatchEvent(new Event(CHAT_EVENTS.TOGGLE))
}
