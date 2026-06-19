import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { createStore } from '../api/mutations'
import { catalogKeys } from '../api/keys'

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createStore,
    onSuccess: (store) => {
      track('store_created', { store_id: store.id, store_slug: store.slug })
      qc.invalidateQueries({ queryKey: catalogKeys.myStores() })
    },
  })
}
