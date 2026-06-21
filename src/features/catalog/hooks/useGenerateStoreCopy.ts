import { useRef, useState } from 'react'
import { generateStoreCopy, type GenerateStoreCopyInput, type StoreCopyKind } from '../api/ai'

const MAX_PREVIOUS_TEXTS = 2

type GenerateArgs = Omit<GenerateStoreCopyInput, 'previousTexts'>

/**
 * Generates store copy (slogan or "about us") via Gemini. Keeps the last
 * generations per field in memory (reset on remount, e.g. when switching
 * stores) so a repeated click produces a different result instead of a
 * near-identical reformulation.
 */
export function useGenerateStoreCopy() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const previousTextsByKind = useRef<Record<StoreCopyKind, string[]>>({ slogan: [], about: [] })

  async function generate(args: GenerateArgs): Promise<string> {
    setIsGenerating(true)
    setError(null)
    try {
      const previousTexts = previousTextsByKind.current[args.kind]
      const text = await generateStoreCopy({ ...args, previousTexts })
      previousTextsByKind.current[args.kind] = [text, ...previousTexts].slice(0, MAX_PREVIOUS_TEXTS)
      return text
    } catch (err) {
      const e = err instanceof Error ? err : new Error('generate_store_copy_failed')
      setError(e)
      throw e
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating, error }
}
