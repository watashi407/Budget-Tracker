import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-healthcheck-secret',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const healthcheckSecret = Deno.env.get('HEALTHCHECK_SECRET') ?? ''

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    })
}

function requireEnv() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Supabase health function environment is not configured')
    }
}

function assertSecret(req: Request) {
    if (!healthcheckSecret) return

    const providedSecret = req.headers.get('x-healthcheck-secret')
    if (providedSecret !== healthcheckSecret) {
        throw new Error('Unauthorized')
    }
}

function serviceClient() {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
        },
    })
}

async function recordHeartbeat(req: Request) {
    const now = new Date().toISOString()
    const { error } = await serviceClient()
        .from('project_heartbeats')
        .upsert({
            id: 'primary',
            last_seen_at: now,
            source: 'edge-function',
            metadata: {
                user_agent: req.headers.get('user-agent') ?? null,
            },
        })

    if (error) throw error

    return {
        ok: true,
        checked_at: now,
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        requireEnv()
        assertSecret(req)
        return jsonResponse(await recordHeartbeat(req))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Health check failed'
        return jsonResponse({ ok: false, error: message }, message === 'Unauthorized' ? 401 : 400)
    }
})
