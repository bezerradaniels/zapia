export const customersKeys = {
  all: ['customers'] as const,
  list: (storeId: string) => [...customersKeys.all, 'list', storeId] as const,
  detail: (id: string) => [...customersKeys.all, 'detail', id] as const,
  orders: (id: string) => [...customersKeys.all, 'orders', id] as const,
}
