// Edge Function: ml-product-search
//
// Searches the Mercado Livre Brazil (MLB) marketplace for products by text
// query or EAN/GTIN barcode. Results are cached in `ml_search_cache`
// (service-role only) to avoid hammering the external API on repeated queries.
//
// Strategy:
//   1. Normalise the query and check the DB cache (keyed with version prefix
//      so a strategy change auto-invalidates old entries).
//   2. On cache miss, call the site-search endpoint (/sites/MLB/search).
//      This endpoint always returns thumbnail URLs. Items that carry a
//      catalog_product_id are considered official catalog entries, are
//      de-duplicated, sorted first, and labelled source:'catalog'.
//   3. Persist the normalised response in cache before returning.
//
// Auth: caller must be an authenticated store member.
// Rate-limit protection: 1 h TTL for text queries, 24 h for barcodes.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { adminClient, requireAuth } from '../_shared/auth.ts'
import { preflight, jsonResponse } from '../_shared/cors.ts'

const ML_BASE = 'https://api.mercadolibre.com'
const CACHE_TTL_TEXT_S = 60 * 60         // 1 hour
const CACHE_TTL_BARCODE_S = 60 * 60 * 24 // 24 hours
const ML_TOKEN_TTL_MS = 5.5 * 60 * 60 * 1000 // 5.5 h (ML tokens expire in 6 h)
const MAX_RESULTS = 10
// Bump this when the response shape changes to auto-invalidate cached entries.
const CACHE_VERSION = 'v2'

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
// Helpers: ML API attribute type
// ---------------------------------------------------------------------------

interface MlAttribute {
  id: string
  name: string
  value_name: string | null
}

// ---------------------------------------------------------------------------
// Catalog search
//
// Calls the ML Catalog Products API (/products/search). These are official,
// verified catalog entries with rich attributes. Images are often absent but
// data quality is higher. Used as a fallback when site search returns nothing.
// ---------------------------------------------------------------------------

async function searchCatalog(query: string): Promise<MlProductResult[]> {
  const url = new URL(`${ML_BASE}/products/search`)
  url.searchParams.set('site_id', 'MLB')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(MAX_RESULTS))

  const res = await fetch(url.toString(), { headers: await mlHeaders() })
  if (!res.ok) {
    console.error('[ml-product-search] catalog search failed', res.status)
    return []
  }

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
      const images = rawImages.slice(0, 5).map((u) => upgradeImageUrl(u, '-F'))
      const thumbnail = rawImages[0] ? upgradeImageUrl(rawImages[0], '-I') : ''

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

// ---------------------------------------------------------------------------
// Site search
//
// Calls /sites/MLB/search which always returns thumbnail URLs. Items that
// carry a catalog_product_id are de-duplicated by that ID and sorted first;
// plain seller listings (no catalog link) follow. Both groups are capped at
// MAX_RESULTS total.
// ---------------------------------------------------------------------------

async function searchSite(query: string): Promise<MlProductResult[]> {
  const url = new URL(`${ML_BASE}/sites/MLB/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(MAX_RESULTS * 2))

  const res = await fetch(url.toString(), { headers: await mlHeaders() })
  if (!res.ok) {
    console.error('[ml-product-search] site search failed', res.status)
    return []
  }

  const body = await res.json()
  const items: unknown[] = body?.results ?? []

  const seenCatalog = new Set<string>()
  const seenItem = new Set<string>()
  const catalogResults: MlProductResult[] = []
  const listingResults: MlProductResult[] = []

  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const it = item as Record<string, unknown>

    const itemId = String(it.id ?? '')
    if (!itemId) continue

    const catalogId = it.catalog_product_id as string | undefined

    // De-duplicate: one entry per catalog product, one per item otherwise
    if (catalogId) {
      if (seenCatalog.has(catalogId)) continue
      seenCatalog.add(catalogId)
    } else {
      if (seenItem.has(itemId)) continue
      seenItem.add(itemId)
    }

    const attrs = (it.attributes as MlAttribute[] | undefined) ?? []
    const brand = attrs.find((a) => a.id === 'BRAND')?.value_name ?? null
    const barcode =
      attrs.find((a) => ['GTIN', 'EAN'].includes(a.id))?.value_name ?? null

    // Site search always includes a thumbnail URL
    const rawThumb = String(it.thumbnail ?? '')
    const highRes = upgradeImageUrl(rawThumb, '-F')

    const result: MlProductResult = {
      mlId: catalogId ?? itemId,
      title: String(it.title ?? ''),
      brand,
      thumbnail: rawThumb,
      images: highRes ? [highRes] : [],
      attributes: attrs
        .filter((a) => a.value_name)
        .map((a) => ({ name: a.name, value: a.value_name! })),
      description: null,
      permalink: (it.permalink as string | undefined) ?? null,
      source: catalogId ? 'catalog' : 'listing',
      barcode,
    }

    if (catalogId) {
      catalogResults.push(result)
    } else {
      listingResults.push(result)
    }
  }

  // Catalog-linked results first, then plain listings
  return [...catalogResults, ...listingResults].slice(0, MAX_RESULTS)
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
  const cacheKey = `ml:${CACHE_VERSION}:${normalised}`
  const ttl = barcode ? CACHE_TTL_BARCODE_S : CACHE_TTL_TEXT_S

  const cached = await getCached(cacheKey)
  if (cached) {
    return jsonResponse({ ...cached, source: 'cache' }, { req })
  }

  // Run both in parallel: site search has thumbnails, catalog has richer data.
  // Prefer site results when available; fall back to catalog so there are always results.
  const [siteResults, catalogResults] = await Promise.all([
    searchSite(rawQuery),
    searchCatalog(rawQuery),
  ])

  let results: MlProductResult[]

  if (siteResults.length > 0) {
    // Site search worked — results always include thumbnails.
    // Enrich with any catalog data (descriptions) where IDs match.
    results = siteResults
  } else {
    // Site search failed or returned nothing (possible geo-block on this IP).
    // Fall back to catalog results; they may lack thumbnails but show useful data.
    console.warn('[ml-product-search] site search empty, falling back to catalog')
    results = catalogResults
  }

  const payload: CachedPayload = { results }
  await setCached(cacheKey, payload, ttl)

  return jsonResponse({ ...payload, source: 'api' }, { req })
})
