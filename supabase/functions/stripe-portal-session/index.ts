// Creates a Stripe Customer Portal session so the lojista can manage payment
// methods, invoices and cancellation. Requires an existing subscription
// linked to a Stripe customer.

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&deno-std=0.220.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS helpers
function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? ''
  if (origin === 'https://zapia.app') return origin
  if (origin === 'https://staging.zapia.app') return origin
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin
  if (/^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/.test(origin)) return origin
  return 'https://zapia.app'
}

function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}

function jsonResponse(
  body: unknown,
  init: ResponseInit & { req?: Request } = {},
): Response {
  const { req, ...restInit } = init
  const cors = req ? getCorsHeaders(req) : { 'Access-Control-Allow-Origin': 'https://zapia.app', 'Vary': 'Origin' }
  return new Response(JSON.stringify(body), {
    ...restInit,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      ...(restInit.headers ?? {}),
    },
  })
}

// Auth helpers
function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function userClient(authHeader: string) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function requireStoreMember(
  req: Request,
  storeId: string,
): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('missing_authorization')

  const supabase = userClient(authHeader)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('invalid_token')

  const { data: member, error: memberError } = await supabase
    .from('store_members')
    .select('user_id')
    .eq('store_id', storeId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member) throw new Error('not_a_member')

  return { userId: userData.user.id }
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured')

const APP_URL = Deno.env.get('APP_URL') ?? 'https://zapia.app'

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  let body: { storeId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 })
  }

  const { storeId } = body
  if (!storeId) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    await requireStoreMember(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    return jsonResponse({ error: message }, { status: 401 })
  }

  const admin = adminClient()
  const { data: sub, error } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) {
    return jsonResponse({ error: 'db_error' }, { status: 500 })
  }
  if (!sub?.stripe_customer_id) {
    return jsonResponse({ error: 'no_customer' }, { status: 400 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/assinatura`,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('stripe-portal-session error', err)
    return jsonResponse(
      { error: 'stripe_error', message: (err as Error).message },
      { status: 500 },
    )
  }
})
