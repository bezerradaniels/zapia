import type { Store } from '@/types/domain'

const MAX_DESCRIPTION_LENGTH = 170

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function buildStoreTitle(store: Store): string {
  if (!store.address_city) return `${store.name} - Catálogo por Zapia`
  return `${store.name} em ${store.address_city} - Catálogo por Zapia`
}

export function buildStoreDescription(store: Store): string {
  const location = store.address_city
    ? `em ${store.address_city}`
    : 'no seu catálogo online'
  const segment = store.category ? `${store.category.toLowerCase()} ` : ''

  const description = `Confira o catálogo de ${segment}da ${store.name} ${location} e faça seu pedido pelo WhatsApp.`

  return truncate(description, MAX_DESCRIPTION_LENGTH)
}
