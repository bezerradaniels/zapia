import { invokeEdgeFunction } from '@/lib/supabase'

export type StoreCopyKind = 'slogan' | 'about'

export type GenerateStoreCopyInput = {
  storeId: string
  kind: StoreCopyKind
  name: string
  category?: string
  slogan?: string
  aboutUs?: string
  previousTexts?: string[]
}

export async function generateStoreCopy(input: GenerateStoreCopyInput): Promise<string> {
  const { text } = await invokeEdgeFunction<{ text: string }>('ai-slogan-about', input)
  return text
}
