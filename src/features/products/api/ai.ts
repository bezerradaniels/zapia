import { invokeEdgeFunction } from '@/lib/supabase'

export type GenerateProductDescriptionInput = {
  storeId: string
  name: string
  category?: string
  subcategory?: string
  brand?: string
  condition?: string
  unit?: string
  previousTexts?: string[]
}

export async function generateProductDescription(
  input: GenerateProductDescriptionInput,
): Promise<string> {
  const { text } = await invokeEdgeFunction<{ text: string }>('ai-product-description', input)
  return text
}
