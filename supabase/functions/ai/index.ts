import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type AIProvider = 'gemini' | 'nvidia'

interface SaveConfigBody {
    action: 'saveConfig'
    provider: AIProvider
    apiKey?: string
    textModel?: string
    visionModel?: string
}

interface StatusBody {
    action: 'status'
}

interface ChatBody {
    action: 'chat'
    prompt: string
    image?: {
        base64: string
        mimeType: string
    }
}

interface ClearConfigBody {
    action: 'clearConfig'
    provider: AIProvider
}

type RequestBody = SaveConfigBody | StatusBody | ChatBody | ClearConfigBody

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const defaultModels: Record<AIProvider, { text: string; vision: string }> = {
    gemini: {
        text: 'gemini-2.0-flash',
        vision: 'gemini-2.0-flash',
    },
    nvidia: {
        text: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        vision: 'nvidia/nemotron-nano-12b-v2-vl',
    },
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const encryptionKeySecret = Deno.env.get('AI_TOKEN_ENCRYPTION_KEY') ?? ''

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    })
}

function requireEnv() {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !encryptionKeySecret) {
        throw new Error('Supabase AI function environment is not configured')
    }
}

async function sha256(value: string): Promise<ArrayBuffer> {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
}

async function getCryptoKey() {
    return crypto.subtle.importKey(
        'raw',
        await sha256(encryptionKeySecret),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    )
}

function toBase64(bytes: Uint8Array): string {
    let binary = ''
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte)
    })
    return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

async function encryptToken(token: string) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await getCryptoKey(),
        new TextEncoder().encode(token)
    )

    return {
        encryptedToken: toBase64(new Uint8Array(encrypted)),
        iv: toBase64(iv),
    }
}

async function decryptToken(encryptedToken: string, iv: string) {
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(iv) },
        await getCryptoKey(),
        fromBase64(encryptedToken)
    )

    return new TextDecoder().decode(decrypted)
}

function maskToken(token: string): string {
    if (token.length <= 10) return 'Configured'
    return `${token.slice(0, 6)}...${token.slice(-4)}`
}

async function getUser(req: Request) {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { Authorization: authHeader },
        },
    })

    const { data, error } = await userClient.auth.getUser()
    if (error || !data.user) {
        throw new Error('Unauthorized')
    }

    return data.user
}

function serviceClient() {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
        },
    })
}

async function saveConfig(userId: string, body: SaveConfigBody) {
    const provider = body.provider
    const textModel = body.textModel?.trim() || defaultModels[provider].text
    const visionModel = body.visionModel?.trim() || defaultModels[provider].vision
    const db = serviceClient()

    await db
        .from('ai_api_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)

    const payload: Record<string, unknown> = {
        user_id: userId,
        provider,
        text_model: textModel,
        vision_model: visionModel,
        is_active: true,
        updated_at: new Date().toISOString(),
    }

    if (body.apiKey?.trim()) {
        const encrypted = await encryptToken(body.apiKey.trim())
        payload.encrypted_api_key = encrypted.encryptedToken
        payload.encryption_iv = encrypted.iv
        payload.masked_api_key = maskToken(body.apiKey.trim())
    }

    const { error } = await db
        .from('ai_api_tokens')
        .upsert(payload, { onConflict: 'user_id,provider' })

    if (error) throw error

    return getStatus(userId)
}

async function clearConfig(userId: string, body: ClearConfigBody) {
    const { error } = await serviceClient()
        .from('ai_api_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', body.provider)

    if (error) throw error

    return getStatus(userId)
}

async function getActiveConfig(userId: string) {
    const { data, error } = await serviceClient()
        .from('ai_api_tokens')
        .select('provider, encrypted_api_key, encryption_iv, masked_api_key, text_model, vision_model')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

    if (error) throw error
    return data
}

async function getStatus(userId: string) {
    const data = await getActiveConfig(userId)
    if (!data) {
        return {
            hasKey: false,
            hasByokKey: false,
            provider: 'gemini',
            source: 'none',
            textModel: defaultModels.gemini.text,
            visionModel: defaultModels.gemini.vision,
        }
    }

    return {
        hasKey: Boolean(data.encrypted_api_key),
        hasByokKey: Boolean(data.encrypted_api_key),
        provider: data.provider,
        source: data.encrypted_api_key ? 'supabase' : 'none',
        maskedKey: data.masked_api_key,
        textModel: data.text_model || defaultModels[data.provider as AIProvider].text,
        visionModel: data.vision_model || defaultModels[data.provider as AIProvider].vision,
    }
}

async function callNvidiaChat(apiKey: string, model: string, prompt: string, image?: ChatBody['image']) {
    const content = image
        ? [
            { type: 'text', text: prompt },
            {
                type: 'image_url',
                image_url: {
                    url: `data:${image.mimeType};base64,${image.base64}`,
                },
            },
        ]
        : prompt

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content }],
            max_tokens: image ? 1024 : 2048,
            temperature: 0.4,
            top_p: 1,
            stream: false,
        }),
    })

    if (!response.ok) {
        throw new Error(`NVIDIA AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
}

async function callGemini(apiKey: string, model: string, prompt: string, image?: ChatBody['image']) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const parts = image
        ? [
            { text: prompt },
            {
                inline_data: {
                    mime_type: image.mimeType,
                    data: image.base64,
                },
            },
        ]
        : [{ text: prompt }]

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: image ? 1024 : 2048,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function chatWithAI(userId: string, body: ChatBody) {
    const config = await getActiveConfig(userId)
    if (!config?.encrypted_api_key || !config.encryption_iv) {
        throw new Error('AI token is not configured')
    }

    const provider = config.provider as AIProvider
    const apiKey = await decryptToken(config.encrypted_api_key, config.encryption_iv)
    const model = body.image
        ? config.vision_model || defaultModels[provider].vision
        : config.text_model || defaultModels[provider].text
    const text = provider === 'nvidia'
        ? await callNvidiaChat(apiKey, model, body.prompt, body.image)
        : await callGemini(apiKey, model, body.prompt, body.image)

    return { text }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        requireEnv()
        const user = await getUser(req)
        const body = await req.json() as RequestBody

        if (body.action === 'saveConfig') {
            return jsonResponse(await saveConfig(user.id, body))
        }

        if (body.action === 'status') {
            return jsonResponse(await getStatus(user.id))
        }

        if (body.action === 'clearConfig') {
            return jsonResponse(await clearConfig(user.id, body))
        }

        if (body.action === 'chat') {
            return jsonResponse(await chatWithAI(user.id, body))
        }

        return jsonResponse({ error: 'Unsupported AI action' }, 400)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'AI function failed'
        const status = message === 'Unauthorized' ? 401 : 400
        return jsonResponse({ error: message }, status)
    }
})
