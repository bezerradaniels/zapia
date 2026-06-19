import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { listOrdersForStore, getOrderById } from '../api/queries'
import {
  createOrder,
  createManualOrder,
  updateOrderStatus,
  deleteOrder,
} from '../api/mutations'
import { ordersKeys } from '../api/keys'

export function useOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.list(storeId ?? ''),
    queryFn: () => listOrdersForStore(storeId as string),
    enabled: !!storeId,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.byId(id ?? ''),
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order, input) => {
      track('order_submitted', {
        store_id: input.storeId,
        order_id: order.id,
        value: input.totalInCents,
        item_count: input.items.length,
        has_coupon: !!input.coupon,
      })
    },
  })
}

export function useCreateManualOrder(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createManualOrder,
    onSuccess: (order, input) => {
      const totalInCents = input.items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0)
      track('order_created', {
        store_id: storeId,
        order_id: order.id,
        total_value: totalInCents,
        item_count: input.items.length,
        has_coupon: false,
      })
      qc.invalidateQueries({ queryKey: ordersKeys.list(storeId) })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      oldStatus?: string
    }) => updateOrderStatus(id, status),
    onSuccess: (order, variables) => {
      if (variables.oldStatus) {
        track('order_status_changed', {
          store_id: order.store_id,
          order_id: order.id,
          old_status: variables.oldStatus,
          new_status: variables.status,
        })
      }
      qc.invalidateQueries({ queryKey: ordersKeys.list(order.store_id) })
      qc.invalidateQueries({ queryKey: ordersKeys.byId(order.id) })
    },
  })
}

export function useDeleteOrder(storeId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_data, id) => {
      if (storeId) qc.invalidateQueries({ queryKey: ordersKeys.list(storeId) })
      qc.removeQueries({ queryKey: ordersKeys.byId(id) })
    },
  })
}
