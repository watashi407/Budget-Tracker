import { useEffect, useSyncExternalStore } from 'react'
import { aiApiKeyService, type AIApiKeyStatus } from '@/data/services/AIApiKeyService'

const EMPTY_AI_STATUS: AIApiKeyStatus = {
    hasKey: false,
    hasByokKey: false,
    provider: 'gemini',
    source: 'none',
    textModel: 'gemini-2.0-flash',
    visionModel: 'gemini-2.0-flash',
}

const EMPTY_AI_STATUS_SNAPSHOT = JSON.stringify(EMPTY_AI_STATUS)

export function useAIConfiguration() {
    const snapshot = useSyncExternalStore(
        (callback) => aiApiKeyService.subscribe(callback),
        () => aiApiKeyService.getSnapshot(),
        () => EMPTY_AI_STATUS_SNAPSHOT
    )

    useEffect(() => {
        void aiApiKeyService.refreshRemoteStatus()
    }, [])

    return JSON.parse(snapshot) as AIApiKeyStatus
}
