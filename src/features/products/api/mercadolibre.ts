import { createBrowserClient } from '@/lib/supabase'
import type { MlProductResult, MlSearchResponse, MlImportImagesResponse } from '../types'

// ---------------------------------------------------------------------------
// ml-product-search
// ---------------------------------------------------------------------------

export async function searchMercadoLibre(
  query: string,
): Promise<MlSearchResponse> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.functions.invoke<MlSearchResponse>(
    'ml-product-search',
    { body: { query } },
  )
  if (error) throw error
  return data!
}

// ---------------------------------------------------------------------------
// ml-image-import
// ---------------------------------------------------------------------------

export async function importMlImages(
  storeId: string,
  mlImageUrls: string[],
): Promise<string[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.functions.invoke<MlImportImagesResponse>(
    'ml-image-import',
    { body: { storeId, mlImageUrls } },
  )
  if (error) throw error
  return data!.urls
}

// Re-export type so callers don't need to import from types directly
export type { MlProductResult }
