import { useRef, useState } from 'react'
import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
} from '../api/ai'

const MAX_PREVIOUS_TEXTS = 2

type GenerateArgs = Omit<GenerateProductDescriptionInput, 'previousTexts'>

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Converts the plain text returned by Gemini into the HTML format expected
 * by `ProductRichTextEditor` (paragraph breaks preserved as line breaks). */
function toEditorHtml(text: string): string {
  return escapeHtml(text.trim()).split(/\n+/).join('<br>')
}

/**
 * Generates a product description via Gemini. Keeps the last generations in
 * memory (reset on remount, e.g. when opening a different product) so a
 * repeated click produces a different result instead of a reformulation.
 */
export function useGenerateProductDescription() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const previousTexts = useRef<string[]>([])

  async function generate(args: GenerateArgs): Promise<string> {
    setIsGenerating(true)
    setError(null)
    try {
      const text = await generateProductDescription({
        ...args,
        previousTexts: previousTexts.current,
      })
      previousTexts.current = [text, ...previousTexts.current].slice(0, MAX_PREVIOUS_TEXTS)
      return toEditorHtml(text)
    } catch (err) {
      const e = err instanceof Error ? err : new Error('generate_product_description_failed')
      setError(e)
      throw e
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating, error }
}
