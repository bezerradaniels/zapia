// Edge Function: ml-image-import
//
// Downloads images from the Mercado Livre CDN and re-uploads them to the
// store's Supabase Storage bucket (`product-images`). This breaks the
// dependency on the external CDN: if the original ML listing is removed,
// the product images in Zapia remain intact.
//
// Auth: caller must be an authenticated store member.
// Limits: max 5 images per call, each image capped at 8 MB.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { adminClient, requireStoreMember } from '../_shared/auth.ts'
import { preflight, jsonResponse } from '../_shared/cors.ts'

const MAX_IMAGES = 5
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

// Maps content-type to file extension for storage path
function extForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mime] ?? 'jpg'
}

serve(async (req: Request) => {
  const early = preflight(req)
  if (early) return early

  let body: { mlImageUrls?: string[]; storeId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400, req })
  }

  const { mlImageUrls, storeId } = body
  if (!storeId) {
    return jsonResponse({ error: 'missing_store_id' }, { status: 400, req })
  }
  if (!Array.isArray(mlImageUrls) || mlImageUrls.length === 0) {
    return jsonResponse({ error: 'missing_images' }, { status: 400, req })
  }

  try {
    await requireStoreMember(req, storeId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unauthorized'
    return jsonResponse({ error: msg }, { status: 401, req })
  }

  const urls = mlImageUrls.slice(0, MAX_IMAGES)
  const admin = adminClient()
  const persistedUrls: string[] = []
  const errors: string[] = []

  await Promise.all(
    urls.map(async (mlUrl) => {
      try {
        // Verify the URL is from the ML CDN before fetching
        const parsed = new URL(mlUrl)
        const isAllowedHost =
          parsed.hostname.endsWith('.mlstatic.com') ||
          parsed.hostname.endsWith('.mercadolivre.com.br') ||
          parsed.hostname.endsWith('.mercadolibre.com')

        if (!isAllowedHost) {
          errors.push(`Host não permitido: ${parsed.hostname}`)
          return
        }

        const mlRes = await fetch(mlUrl, {
          headers: { 'User-Agent': 'Zapia/1.0 (+https://zapia.app)' },
        })

        if (!mlRes.ok) {
          errors.push(`HTTP ${mlRes.status} ao buscar imagem`)
          return
        }

        const contentType = mlRes.headers.get('content-type')?.split(';')[0].trim() ?? ''
        if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
          errors.push(`Tipo de imagem não suportado: ${contentType}`)
          return
        }

        const buffer = await mlRes.arrayBuffer()
        if (buffer.byteLength > MAX_BYTES) {
          errors.push(`Imagem muito grande: ${Math.round(buffer.byteLength / 1024)}KB`)
          return
        }

        const ext = extForMime(contentType)
        const storagePath = `${storeId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await admin.storage
          .from('product-images')
          .upload(storagePath, buffer, {
            contentType,
            cacheControl: '31536000', // 1 year — content-addressed via UUID
            upsert: false,
          })

        if (uploadError) {
          errors.push(`Erro no upload: ${uploadError.message}`)
          return
        }

        const { data: urlData } = admin.storage
          .from('product-images')
          .getPublicUrl(storagePath)

        persistedUrls.push(urlData.publicUrl)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'erro desconhecido')
      }
    }),
  )

  if (persistedUrls.length === 0) {
    return jsonResponse(
      { error: 'Nenhuma imagem pôde ser importada.', details: errors },
      { status: 422, req },
    )
  }

  return jsonResponse({ urls: persistedUrls, errors }, { req })
})
