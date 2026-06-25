import { createBrowserClient } from '@/lib/supabase'
import type { Customer } from '../types'
import type { Order, OrderItem, OrderWithItems } from '@/types/domain'

export async function listCustomersForStore(storeId: string): Promise<Customer[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Customer[]
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Customer
}

type OrderWithRelationItems = Order & { order_items?: OrderItem[] | null }

export async function listCustomerOrdersWithItems(customer: Customer): Promise<OrderWithItems[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('store_id', customer.store_id)
    .eq('customer_phone', customer.whatsapp_phone)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as unknown as OrderWithRelationItems[]).map((order) => {
    const { order_items, ...rest } = order
    return { ...rest, items: order_items ?? [] }
  })
}
