// Imported from the concrete hook file (not the '@/features/catalog' barrel)
// because that barrel also re-exports zod schemas used only by dashboard
// onboarding forms, pulling react-hook-form/zod into every storefront visit.
import { useStoreBySlug } from '@/features/catalog/hooks/useStoreBySlug'
import { resolveStoreSlug } from './resolveStore'

export function useCurrentStore() {
  const slug = resolveStoreSlug()
  const query = useStoreBySlug(slug)
  return { slug, ...query }
}
