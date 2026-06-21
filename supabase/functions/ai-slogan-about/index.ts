// Generates a store slogan or "about us" text via Gemini.
// Input: { storeId, kind: 'slogan' | 'about', name, category?, slogan?, aboutUs?, previousTexts? }
// Output: { text: string }
// Requires the caller's store to be on a plan with AI helpers (has_ai_helpers).

import { jsonResponse, preflight } from '../_shared/cors.ts'
import { requireAiHelpers } from '../_shared/auth.ts'
import { generateContent } from '../_shared/gemini.ts'
import { buildSystemInstruction, temperatureFor, type CopyKind } from '../_shared/copywriting.ts'

type Body = {
  storeId?: string
  kind?: 'slogan' | 'about'
  name?: string
  category?: string
  slogan?: string
  aboutUs?: string
  previousTexts?: string[]
}

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405, req })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400, req })
  }

  const { storeId, kind, name, category, slogan, aboutUs, previousTexts } = body
  if (!storeId || !kind || !name) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400, req })
  }
  if (kind !== 'slogan' && kind !== 'about') {
    return jsonResponse({ error: 'invalid_kind' }, { status: 400, req })
  }

  try {
    await requireAiHelpers(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    const status = message === 'plan_upgrade_required' ? 403 : 401
    return jsonResponse({ error: message }, { status, req })
  }

  const copyKind: CopyKind = kind
  const contextLines = [
    `Nome da loja: ${name}`,
    category ? `Categoria: ${category}` : null,
    // Cross-context: the existing copy on the *other* field helps keep tone consistent.
    kind === 'slogan' && aboutUs ? `Texto "Sobre nós" já existente: ${aboutUs}` : null,
    kind === 'about' && slogan ? `Slogan já existente: ${slogan}` : null,
  ].filter(Boolean)

  const prompt = contextLines.join('\n')

  try {
    const { text } = await generateContent(prompt, {
      systemInstruction: buildSystemInstruction(copyKind, { previousTexts }),
      temperature: temperatureFor(previousTexts),
      maxOutputTokens: kind === 'slogan' ? 60 : 400,
    })
    return jsonResponse({ text }, { req })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'gemini_error'
    return jsonResponse({ error: message }, { status: 502, req })
  }
})
