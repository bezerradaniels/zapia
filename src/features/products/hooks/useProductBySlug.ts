import { useQuery } from '@tanstack/react-query'
import { getProductBySlug } from '../api/queries'
import { productsKeys } from '../api/keys'

export function useProductBySlug(storeId: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: productsKeys.bySlug(storeId ?? '', slug ?? ''),
    queryFn: () => getProductBySlug(storeId as string, slug as string),
    enabled: !!storeId && !!slug,
  })
}
