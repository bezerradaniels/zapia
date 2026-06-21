// Generates a product description via Gemini.
// Input: { storeId, name, category?, subcategory?, brand?, condition?, unit?, previousTexts? }
// Output: { text: string } (plain text, no markdown)
// Requires the caller's store to be on a plan with AI helpers (has_ai_helpers).

import { jsonResponse, preflight } from '../_shared/cors.ts'
import { requireAiHelpers } from '../_shared/auth.ts'
import { generateContent } from '../_shared/gemini.ts'
import { buildSystemInstruction, temperatureFor } from '../_shared/copywriting.ts'

const CONDITION_LABEL: Record<string, string> = {
  new: 'novo',
  used: 'usado',
  refurbished: 'recondicionado',
}

type Body = {
  storeId?: string
  name?: string
  category?: string
  subcategory?: string
  brand?: string
  condition?: string
  unit?: string
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

  const { storeId, name, category, subcategory, brand, condition, unit, previousTexts } = body
  if (!storeId || !name) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400, req })
  }

  try {
    await requireAiHelpers(req, storeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'forbidden'
    const status = message === 'plan_upgrade_required' ? 403 : 401
    return jsonResponse({ error: message }, { status, req })
  }

  const contextLines = [
    `Nome do produto: ${name}`,
    category ? `Categoria: ${category}` : null,
    subcategory ? `Subcategoria: ${subcategory}` : null,
    brand ? `Marca: ${brand}` : null,
    condition ? `Condição: ${CONDITION_LABEL[condition] ?? condition}` : null,
    unit ? `Unidade de venda: ${unit}` : null,
  ].filter(Boolean)

  const prompt = contextLines.join('\n')

  try {
    const { text } = await generateContent(prompt, {
      systemInstruction: buildSystemInstruction('product_description', { previousTexts }),
      temperature: temperatureFor(previousTexts),
      maxOutputTokens: 600,
    })
    return jsonResponse({ text }, { req })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'gemini_error'
    return jsonResponse({ error: message }, { status: 502, req })
  }
})
