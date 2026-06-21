import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import {
  createProduct,
  deleteProduct,
  deleteProducts,
  setProductsActive,
  updateProduct,
} from '../api/mutations'
import { productsKeys } from '../api/keys'
import type { ProductInput } from '../schemas'

export function useCreateProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(storeId, input),
    onSuccess: (product) => {
      track('product_created', {
        store_id: storeId,
        product_id: product.id,
        product_name: product.name,
        has_image: (product.images?.length ?? 0) > 0,
        has_variations: product.has_variations ?? false,
      })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}

export function useUpdateProduct(storeId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => updateProduct(id, input),
    onSuccess: () => {
      track('product_updated', { store_id: storeId, product_id: id })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.byId(id) })
      // Slug is part of the query key but isn't known here; invalidate every
      // bySlug entry for this store so the public product page (if open in
      // the same session, e.g. owner previewing) refetches fresh data.
      qc.invalidateQueries({ queryKey: [...productsKeys.all, 'bySlug', storeId] })
    },
  })
}

export function useDeleteProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_data, id) => {
      track('product_deleted', { store_id: storeId, product_id: id })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}

export function useSetProductActive(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setProductsActive([id], isActive),
    onSuccess: (_data, { id, isActive }) => {
      track('product_bulk_active_toggled', {
        store_id: storeId,
        product_ids: [id],
        is_active: isActive,
      })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}

export function useSetProductsActive(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      setProductsActive(ids, isActive),
    onSuccess: (_data, { ids, isActive }) => {
      track('product_bulk_active_toggled', {
        store_id: storeId,
        product_ids: ids,
        is_active: isActive,
      })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}

export function useDeleteProducts(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteProducts(ids),
    onSuccess: (_data, ids) => {
      track('product_bulk_deleted', { store_id: storeId, product_ids: ids })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}
