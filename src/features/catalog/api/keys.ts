export const catalogKeys = {
  all: ['catalog'] as const,
  storeBySlug: (slug: string) => [...catalogKeys.all, 'store', slug] as const,
  myStores: () => [...catalogKeys.all, 'myStores'] as const,
  slugAvailability: (slug: string) => [...catalogKeys.all, 'slugAvailability', slug] as const,
}
