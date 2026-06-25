import { useQuery } from '@tanstack/react-query'
import { getCustomerById, listCustomerOrdersWithItems } from '../api/queries'
import { customersKeys } from '../api/keys'
import type { Customer } from '../types'

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customersKeys.detail(id ?? ''),
    queryFn: () => getCustomerById(id as string),
    enabled: !!id,
  })
}

export function useCustomerOrders(customer: Customer | undefined) {
  return useQuery({
    queryKey: customersKeys.orders(customer?.id ?? ''),
    queryFn: () => listCustomerOrdersWithItems(customer as Customer),
    enabled: !!customer,
  })
}
