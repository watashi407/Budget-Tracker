import { supabase } from '@/lib/supabase'

export type AIProvider = 'gemini' | 'nvidia'
export type AIApiKeySource = 'byok' | 'environment' | 'supabase' | 'none'

export interface AIProviderConfig {
    provider: AIProvider
    apiKey: string | null
    textModel: string
    visionModel: string
}

export interface AIApiKeyStatus {
    hasKey: boolean
    hasByokKey: boolean
    provider: AIProvider
    source: AIApiKeySource
    maskedKey?: string
    textModel: string
    visionModel: string
}

export const AI_PROVIDER_OPTIONS: Array<{ value: AIProvider; label: string }> = [
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'nvidia', label: 'NVIDIA NIM' },
]

export const DEFAULT_AI_MODELS: Record<AIProvider, { text: string; vision: string }> = {
    gemini: {
        text: 'gemini-2.0-flash',
        vision: 'gemini-2.0-flash',
    },
    nvidia: {
        text: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        vision: 'nvidia/nemotron-nano-12b-v2-vl',
    },
}

const ACTIVE_PROVIDER_STORAGE_KEY = 'watashi-pocket.ai.provider'
const GEMINI_BYOK_STORAGE_KEY = 'watashi-pocket.ai.geminiApiKey'
const NVIDIA_BYOK_STORAGE_KEY = 'watashi-pocket.ai.nvidiaApiKey'
const NVIDIA_TEXT_MODEL_STORAGE_KEY = 'watashi-pocket.ai.nvidiaTextModel'
const NVIDIA_VISION_MODEL_STORAGE_KEY = 'watashi-pocket.ai.nvidiaVisionModel'
const REMOTE_STATUS_STORAGE_KEY = 'watashi-pocket.ai.remoteStatus'
const AI_API_KEY_CHANGED_EVENT = 'watashi-pocket:ai-api-key-changed'

class AIApiKeyService {
    private readonly environmentKeys: Record<AIProvider, string> = {
        gemini: import.meta.env.VITE_GEMINI_API_KEY?.trim() || '',
        nvidia: import.meta.env.VITE_NVIDIA_API_KEY?.trim() || '',
    }

    getProvider(): AIProvider {
        if (!this.canUseStorage()) return 'gemini'

        const provider = window.localStorage.getItem(ACTIVE_PROVIDER_STORAGE_KEY)
        return provider === 'nvidia' ? 'nvidia' : 'gemini'
    }

    setProvider(provider: AIProvider): void {
        if (!this.canUseStorage()) return

        window.localStorage.setItem(ACTIVE_PROVIDER_STORAGE_KEY, provider)
        window.dispatchEvent(new Event(AI_API_KEY_CHANGED_EVENT))
    }

    getConfig(): AIProviderConfig {
        const provider = this.getProvider()
        return {
            provider,
            apiKey: this.getApiKey(provider),
            textModel: this.getTextModel(provider),
            visionModel: this.getVisionModel(provider),
        }
    }

    getApiKey(provider = this.getProvider()): string | null {
        return this.getByokApiKey(provider) || this.environmentKeys[provider] || null
    }

    getByokApiKey(provider = this.getProvider()): string {
        if (!this.canUseStorage()) return ''
        return window.localStorage.getItem(this.getProviderStorageKey(provider))?.trim() || ''
    }

    setByokApiKey(apiKey: string, provider = this.getProvider()): void {
        if (!this.canUseStorage()) return

        const normalizedApiKey = apiKey.trim()
        if (normalizedApiKey) {
            window.localStorage.setItem(this.getProviderStorageKey(provider), normalizedApiKey)
        } else {
            window.localStorage.removeItem(this.getProviderStorageKey(provider))
        }
        window.dispatchEvent(new Event(AI_API_KEY_CHANGED_EVENT))
    }

    clearByokApiKey(provider = this.getProvider()): void {
        this.setByokApiKey('', provider)
    }

    setNvidiaModels(textModel: string, visionModel: string): void {
        if (!this.canUseStorage()) return

        window.localStorage.setItem(NVIDIA_TEXT_MODEL_STORAGE_KEY, textModel.trim() || DEFAULT_AI_MODELS.nvidia.text)
        window.localStorage.setItem(NVIDIA_VISION_MODEL_STORAGE_KEY, visionModel.trim() || DEFAULT_AI_MODELS.nvidia.vision)
        window.dispatchEvent(new Event(AI_API_KEY_CHANGED_EVENT))
    }

    private getTextModel(provider: AIProvider): string {
        if (provider === 'gemini' || !this.canUseStorage()) return DEFAULT_AI_MODELS[provider].text

        return window.localStorage.getItem(NVIDIA_TEXT_MODEL_STORAGE_KEY)?.trim() || DEFAULT_AI_MODELS.nvidia.text
    }

    private getVisionModel(provider: AIProvider): string {
        if (provider === 'gemini' || !this.canUseStorage()) return DEFAULT_AI_MODELS[provider].vision

        return window.localStorage.getItem(NVIDIA_VISION_MODEL_STORAGE_KEY)?.trim() || DEFAULT_AI_MODELS.nvidia.vision
    }

    getStatus(): AIApiKeyStatus {
        const remoteStatus = this.getRemoteStatus()
        if (remoteStatus) return remoteStatus

        const { provider, textModel, visionModel } = this.getConfig()
        const byokApiKey = this.getByokApiKey(provider)
        const activeApiKey = byokApiKey || this.environmentKeys[provider]

        if (!activeApiKey) {
            return {
                hasKey: false,
                hasByokKey: false,
                provider,
                source: 'none',
                textModel,
                visionModel,
            }
        }

        return {
            hasKey: true,
            hasByokKey: Boolean(byokApiKey),
            provider,
            source: byokApiKey ? 'byok' : 'environment',
            maskedKey: this.maskApiKey(activeApiKey),
            textModel,
            visionModel,
        }
    }

    getSnapshot(): string {
        return JSON.stringify(this.getStatus())
    }

    async refreshRemoteStatus(): Promise<AIApiKeyStatus | null> {
        const { data, error } = await supabase.functions.invoke<AIApiKeyStatus>('ai', {
            body: { action: 'status' },
        })

        if (error || !data) {
            return null
        }

        this.setRemoteStatus(data)
        return data
    }

    async saveRemoteConfig(options: {
        provider: AIProvider
        apiKey?: string
        textModel: string
        visionModel: string
    }): Promise<AIApiKeyStatus> {
        const { data, error } = await supabase.functions.invoke<AIApiKeyStatus>('ai', {
            body: {
                action: 'saveConfig',
                provider: options.provider,
                apiKey: options.apiKey,
                textModel: options.textModel,
                visionModel: options.visionModel,
            },
        })

        if (error || !data) {
            throw new Error(error?.message || 'Failed to save AI settings')
        }

        this.clearLocalProviderApiKey(options.provider)
        this.setRemoteStatus(data)
        return data
    }

    async clearRemoteConfig(provider = this.getProvider()): Promise<AIApiKeyStatus> {
        const { data, error } = await supabase.functions.invoke<AIApiKeyStatus>('ai', {
            body: {
                action: 'clearConfig',
                provider,
            },
        })

        if (error || !data) {
            throw new Error(error?.message || 'Failed to remove AI token')
        }

        this.clearLocalProviderApiKey(provider)
        this.setRemoteStatus(data)
        return data
    }

    subscribe(callback: () => void): () => void {
        if (!this.canUseStorage()) return () => undefined

        const handleStorage = (event: StorageEvent) => {
            if (
                event.key === ACTIVE_PROVIDER_STORAGE_KEY ||
                event.key === GEMINI_BYOK_STORAGE_KEY ||
                event.key === NVIDIA_BYOK_STORAGE_KEY ||
                event.key === NVIDIA_TEXT_MODEL_STORAGE_KEY ||
                event.key === NVIDIA_VISION_MODEL_STORAGE_KEY ||
                event.key === REMOTE_STATUS_STORAGE_KEY
            ) {
                callback()
            }
        }

        window.addEventListener(AI_API_KEY_CHANGED_EVENT, callback)
        window.addEventListener('storage', handleStorage)

        return () => {
            window.removeEventListener(AI_API_KEY_CHANGED_EVENT, callback)
            window.removeEventListener('storage', handleStorage)
        }
    }

    private maskApiKey(apiKey: string): string {
        if (apiKey.length <= 10) return 'Configured'
        return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
    }

    private getProviderStorageKey(provider: AIProvider): string {
        return provider === 'nvidia' ? NVIDIA_BYOK_STORAGE_KEY : GEMINI_BYOK_STORAGE_KEY
    }

    private clearLocalProviderApiKey(provider: AIProvider): void {
        if (!this.canUseStorage()) return
        window.localStorage.removeItem(this.getProviderStorageKey(provider))
    }

    private getRemoteStatus(): AIApiKeyStatus | null {
        if (!this.canUseStorage()) return null

        const status = window.localStorage.getItem(REMOTE_STATUS_STORAGE_KEY)
        if (!status) return null

        try {
            const parsed = JSON.parse(status) as AIApiKeyStatus
            return parsed.provider === this.getProvider() ? parsed : null
        } catch {
            window.localStorage.removeItem(REMOTE_STATUS_STORAGE_KEY)
            return null
        }
    }

    private setRemoteStatus(status: AIApiKeyStatus): void {
        if (!this.canUseStorage()) return
        window.localStorage.setItem(REMOTE_STATUS_STORAGE_KEY, JSON.stringify(status))
        window.localStorage.setItem(ACTIVE_PROVIDER_STORAGE_KEY, status.provider)
        window.dispatchEvent(new Event(AI_API_KEY_CHANGED_EVENT))
    }

    private canUseStorage(): boolean {
        return typeof window !== 'undefined' && Boolean(window.localStorage)
    }
}

export const aiApiKeyService = new AIApiKeyService()
