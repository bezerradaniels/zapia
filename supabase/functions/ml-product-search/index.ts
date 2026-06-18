// Edge Function: ml-product-search
//
// Searches the Mercado Livre Brazil (MLB) catalog for products by text query
// or EAN/GTIN barcode. Results are cached in `ml_search_cache` (service-role
// only) to avoid hammering the external API on repeated popular queries.
//
// Strategy:
//   1. Normalise the query and check the DB cache.
//   2. On cache miss, call the ML Catalog Products API (/products/search).
//      These are official entries with verified data — prioritised over
//      individual seller listings.
//   3. For each catalog hit, derive high-res image URLs from the thumbnail
//      (ML uses a predictable suffix convention: -I → -F at 500 px).
//   4. If the catalog returns zero results, fall back to the site-search
//      endpoint (/sites/MLB/search) and filter items that carry a
//      catalog_product_id so quality stays high.
//   5. Persist the normalised response in cache before returning.
//
// Auth: caller must be an authenticated store member.
// Rate-limit protection: cache TTL of 1 h for text, 24 h for barcodes.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { adminClient, requireAuth } from '../_shared/auth.ts'
import { preflight, jsonResponse } from '../_shared/cors.ts'

const ML_BASE = 'https://api.mercadolibre.com'
const CACHE_TTL_TEXT_S = 60 * 60        // 1 hour
const CACHE_TTL_BARCODE_S = 60 * 60 * 24 // 24 hours
const ML_TOKEN_TTL_MS = 5.5 * 60 * 60 * 1000 // 5.5 h (ML tokens expire in 6 h)
const MAX_RESULTS = 10

// ---------------------------------------------------------------------------
// ML OAuth — Client Credentials flow
// Exchanges App ID + Secret for an access_token (app-level, no user scope).
// The token is cached in-memory for the lifetime of the Edge Function instance.
// ---------------------------------------------------------------------------

let _mlToken: { value: string; expiresAt: number } | null = null

async function getMlAccessToken(): Promise<string | null> {
  const appId = Deno.env.get('ML_APP_ID')
  const appSecret = Deno.env.get('ML_APP_SECRET')
  if (!appId || !appSecret) return null // fall back to unauthenticated

  if (_mlToken && Date.now() < _mlToken.expiresAt) return _mlToken.value

  const res = await fetch(`${ML_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: appId,
      client_secret: appSecret,
    }),
  })

  if (!res.ok) {
    console.error('[ml-product-search] token exchange failed', res.status)
    return null
  }

  const json = await res.json()
  _mlToken = { value: json.access_token, expiresAt: Date.now() + ML_TOKEN_TTL_MS }
  return _mlToken.value
}

async function mlHeaders(): Promise<Record<string, string>> {
  const token = await getMlAccessToken()
  return {
    'User-Agent': 'Zapia/1.0 (+https://zapia.app)',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MlProductResult {
  mlId: string
  title: string
  brand: string | null
  thumbnail: string
  images: string[]
  attributes: { name: string; value: string }[]
  description: string | null
  permalink: string | null
  source: 'catalog' | 'listing'
  barcode: string | null
}

interface CachedPayload {
  results: MlProductResult[]
}

// ---------------------------------------------------------------------------
// Helpers: Mercado Livre image URL manipulation
// ---------------------------------------------------------------------------

// ML CDN uses a size suffix just before the file extension:
//   -I  = ~100 px  (tiny thumbnail)
//   -O  = ~180 px
//   -N  = ~300 px  (medium)
//   -F  = ~500 px  (full — target for display)
//   -B  = ~700 px  (big — used for persistence)
function upgradeImageUrl(url: string, suffix: '-F' | '-B' = '-F'): string {
  return url.replace(/-[IONSFB](\.(jpg|jpeg|png|webp))/i, `${suffix}$1`)
}

// ---------------------------------------------------------------------------
// Helpers: barcode detection
// ---------------------------------------------------------------------------

function isBarcode(q: string): boolean {
  const digits = q.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 14 && digits === q.trim()
}

// ---------------------------------------------------------------------------
// Helpers: ML API calls
// ---------------------------------------------------------------------------

interface MlAttribute {
  id: string
  name: string
  value_name: string | null
}

// Fetch from the ML Catalog Products API. Returns official catalog entries
// which have richer, verified data. This endpoint is publicly accessible.
async function searchCatalog(query: string): Promise<MlProductResult[]> {
  const url = new URL(`${ML_BASE}/products/search`)
  url.searchParams.set('site_id', 'MLB')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(MAX_RESULTS))

  const res = await fetch(url.toString(), { headers: await mlHeaders() })

  if (!res.ok) return []

  const body = await res.json()
  const items: unknown[] = body?.results ?? []

  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item): MlProductResult => {
      const attrs = (item.attributes as MlAttribute[] | undefined) ?? []
      const brand = attrs.find((a) => a.id === 'BRAND')?.value_name ?? null
      const barcode =
        attrs.find((a) => ['GTIN', 'EAN'].includes(a.id))?.value_name ?? null

      const pictures: { url: string }[] =
        (item.pictures as { url: string }[] | undefined) ?? []
      const rawImages = pictures.map((p) => p.url).filter(Boolean)
      // Derive high-res images by upgrading size suffix
      const images = rawImages.slice(0, 5).map((u) => upgradeImageUrl(u, '-F'))
      const thumbnail = images[0] ? upgradeImageUrl(images[0], '-N') : ''

      return {
        mlId: String(item.id ?? ''),
        title: String(item.name ?? ''),
        brand,
        thumbnail,
        images,
        attributes: attrs
          .filter((a) => a.value_name)
          .map((a) => ({ name: a.name, value: a.value_name! })),
        description: (item.short_description as string | undefined) ?? null,
        permalink: null,
        source: 'catalog',
        barcode,
      }
    })
    .filter((r) => r.mlId && r.title)
}

// Fallback: site-level search, kept only when items have a catalog_product_id
// (meaning ML itself has matched them to an official catalog entry).
async function searchSite(query: string): Promise<MlProductResult[]> {
  const url = new URL(`${ML_BASE}/sites/MLB/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(MAX_RESULTS * 2)) // fetch extra so we can filter
  url.searchParams.set('catalog_listing', 'true')

  const res = await fetch(url.toString(), { headers: await mlHeaders() })

  if (!res.ok) return []

  const body = await res.json()
  const items: unknown[] = body?.results ?? []

  const seen = new Set<string>()
  const results: MlProductResult[] = []

  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const it = item as Record<string, unknown>

    const catalogId = it.catalog_product_id as string | undefined
    if (!catalogId) continue // skip uncatalogued listings
    if (seen.has(catalogId)) continue // deduplicate by catalog entry
    seen.add(catalogId)

    const attrs = (it.attributes as MlAttribute[] | undefined) ?? []
    const brand = attrs.find((a) => a.id === 'BRAND')?.value_name ?? null
    const barcode =
      attrs.find((a) => ['GTIN', 'EAN'].includes(a.id))?.value_name ?? null

    // Upgrade thumbnail to medium then derive up to one high-res image
    const rawThumb = String(it.thumbnail ?? '')
    const thumbnail = upgradeImageUrl(rawThumb, '-N')
    const highRes = upgradeImageUrl(rawThumb, '-F')

    results.push({
      mlId: catalogId,
      title: String(it.title ?? ''),
      brand,
      thumbnail,
      images: [highRes],
      attributes: attrs
        .filter((a) => a.value_name)
        .map((a) => ({ name: a.name, value: a.value_name! })),
      description: null,
      permalink: (it.permalink as string | undefined) ?? null,
      source: 'listing',
      barcode,
    })

    if (results.length >= MAX_RESULTS) break
  }

  return results
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function getCached(cacheKey: string): Promise<CachedPayload | null> {
  const admin = adminClient()
  const { data, error } = await admin
    .from('ml_search_cache')
    .select('payload, expires_at')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) {
    // Expired — delete async, don't wait
    admin.from('ml_search_cache').delete().eq('cache_key', cacheKey)
    return null
  }

  return data.payload as CachedPayload
}

async function setCached(
  cacheKey: string,
  payload: CachedPayload,
  ttlSeconds: number,
): Promise<void> {
  const admin = adminClient()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  await admin.from('ml_search_cache').upsert(
    { cache_key: cacheKey, payload, expires_at: expiresAt },
    { onConflict: 'cache_key' },
  )
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  try {
    await requireAuth(req)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unauthorized'
    return jsonResponse({ error: msg }, { status: 401, req })
  }

  let body: { query?: string; type?: 'text' | 'barcode' }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400, req })
  }

  const rawQuery = (body.query ?? '').trim()
  if (!rawQuery || rawQuery.length < 2) {
    return jsonResponse({ error: 'query_too_short' }, { status: 400, req })
  }

  const barcode = isBarcode(rawQuery)
  const normalised = rawQuery.toLowerCase()
  const cacheKey = `ml:${normalised}`
  const ttl = barcode ? CACHE_TTL_BARCODE_S : CACHE_TTL_TEXT_S

  // Cache hit
  const cached = await getCached(cacheKey)
  if (cached) {
    return jsonResponse({ ...cached, source: 'cache' }, { req })
  }

  // Search ML catalog first (higher quality)
  let results = await searchCatalog(rawQuery)

  // Fall back to site search filtered to catalog-matched listings
  if (results.length === 0) {
    results = await searchSite(rawQuery)
  }

  const payload: CachedPayload = { results }
  await setCached(cacheKey, payload, ttl)

  return jsonResponse({ ...payload, source: 'api' }, { req })
})
