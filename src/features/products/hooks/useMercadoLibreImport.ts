import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importMlImages } from '../api/mercadolibre'
import { mapMlResultToFormPayload } from '../utils/mapMercadoLibreProduct'
import type { MlProductResult, MlImportPayload } from '../types'

interface ImportOptions {
  storeId: string
  /** Called after images are persisted and all fields are ready to fill. */
  onSuccess: (payload: MlImportPayload) => void
}

interface ImportArgs {
  result: MlProductResult
  /** The barcode originally typed/scanned by the user, if any. */
  searchedBarcode?: string
}

export function useMercadoLibreImport({ storeId, onSuccess }: ImportOptions) {
  return useMutation({
    mutationFn: async ({ result, searchedBarcode }: ImportArgs) => {
      const mapped = mapMlResultToFormPayload(result, searchedBarcode)

      // Persist ML images to Supabase Storage so we own the URLs
      let persistedImages: string[] = []
      if (mapped.mlImages.length > 0) {
        try {
          persistedImages = await importMlImages(storeId, mapped.mlImages)
        } catch {
          // Non-fatal: the lojista can upload images manually
          toast.warning('Imagens não puderam ser importadas. Adicione manualmente.')
        }
      }

      const payload: MlImportPayload = {
        name: mapped.name,
        brand: mapped.brand,
        description: mapped.description,
        images: persistedImages,
        barcode: mapped.barcode,
        barcode_type: mapped.barcode_type,
        attributes: mapped.attributes,
      }

      return payload
    },
    onSuccess,
    onError: () => {
      toast.error('Erro ao importar produto do Mercado Livre.')
    },
  })
}
