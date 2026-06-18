// Local types for the products feature.
// Database-generated types live in @/types/database.ts.
// Cross-feature domain types live in @/types/domain.ts.

// ---------------------------------------------------------------------------
// Mercado Livre import
// ---------------------------------------------------------------------------

export interface MlProductResult {
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

export interface MlSearchResponse {
  results: MlProductResult[]
  source: 'cache' | 'api'
}

export interface MlImportImagesResponse {
  urls: string[]
  errors: string[]
}

/** Fields auto-populated in the product form after a ML import. */
export interface MlImportPayload {
  name: string
  brand: string | null
  description: string | null
  images: string[]         // Supabase Storage URLs — already persisted
  barcode: string | null
  barcode_type: string | null
  attributes: { name: string; value: string }[]
}
