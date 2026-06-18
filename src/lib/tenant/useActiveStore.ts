// Imported from the concrete hook file (not the '@/features/catalog' barrel)
// because that barrel also re-exports zod schemas used only by dashboard
// onboarding forms, pulling react-hook-form/zod into every storefront visit
// (this hook is called from StoreLayout to detect owner-mode).
import { useMyStores } from '@/features/catalog/hooks/useMyStores'
import { useSession } from '@/features/auth'

/**
 * Returns the owner's "active" store in the dashboard context.
 * For MVP we assume a single store per user — the first one is used.
 * (Multi-store switching can be layered on later via a Zustand store.)
 */
export function useActiveStore() {
  const { session } = useSession()
  const query = useMyStores(!!session)
  const store = query.data?.[0] ?? null
  return { ...query, store }
}
