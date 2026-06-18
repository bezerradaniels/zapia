import type { MlProductResult, MlImportPayload } from '../types'

// ---------------------------------------------------------------------------
// Barcode type inference from digit count
// ---------------------------------------------------------------------------

function inferBarcodeType(barcode: string | null): string | null {
  if (!barcode) return null
  const digits = barcode.replace(/\D/g, '')
  if (digits.length === 13) return 'EAN-13'
  if (digits.length === 8) return 'EAN-8'
  if (digits.length === 12) return 'UPC-A'
  if (digits.length === 14) return 'GTIN-14'
  return 'GTIN'
}

// ---------------------------------------------------------------------------
// Description builder
//
// ML catalog products expose structured attributes (Marca, Voltagem, Cor…).
// We render them as a plain HTML list so the rich-text editor can display
// them immediately. The lojista can edit before saving.
// ---------------------------------------------------------------------------

const EXCLUDED_ATTRIBUTE_IDS = new Set([
  'BRAND',    // surfaced separately in the `brand` field
  'GTIN',     // surfaced separately in the `barcode` field
  'EAN',
  'ITEM_CONDITION',
])

export function buildDescriptionFromAttributes(
  attributes: { name: string; value: string }[],
): string {
  const relevant = attributes.filter((a) => !EXCLUDED_ATTRIBUTE_IDS.has(a.name.toUpperCase()))
  if (relevant.length === 0) return ''

  return relevant.map((a) => `<p>${a.name}: ${a.value}</p>`).join('')
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

/**
 * Converts a Mercado Livre product result into the payload that will be
 * used to pre-populate the product creation form. Image URLs here are still
 * ML CDN URLs — the caller must run ml-image-import to persist them first.
 */
export function mapMlResultToFormPayload(
  result: MlProductResult,
  /** Pass the barcode the user typed/scanned when the search was a barcode lookup. */
  searchedBarcode?: string,
): Omit<MlImportPayload, 'images'> & { mlImages: string[] } {
  const barcode = searchedBarcode ?? result.barcode
  return {
    name: result.title,
    brand: result.brand,
    description: buildDescriptionFromAttributes(result.attributes),
    mlImages: result.images,
    barcode: barcode ?? null,
    barcode_type: inferBarcodeType(barcode ?? null),
    attributes: result.attributes,
  }
}
