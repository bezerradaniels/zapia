import { useQuery } from '@tanstack/react-query'
import { searchMercadoLibre } from '../api/mercadolibre'
import type { MlProductResult } from '../types'

const DEBOUNCE_WAIT_MS = 500
const MIN_QUERY_LENGTH = 2

// ---------------------------------------------------------------------------
// React Query key
// ---------------------------------------------------------------------------

const mlSearchKeys = {
  search: (query: string) => ['ml', 'search', query] as const,
}

// ---------------------------------------------------------------------------
// Simple hook-level debounce via delayed enabled flag pattern.
//
// We don't use a debounce utility here because React Query's `enabled`
// flag is the cleanest way to suppress in-flight requests while the user
// is still typing — no cancelled requests, no race conditions.
// The debounced value is owned by the *component* (see SearchInput);
// this hook simply requires the caller to pass an already-debounced query.
// ---------------------------------------------------------------------------

interface UseMercadoLibreSearchOptions {
  /** Already-debounced search query from the component. */
  query: string
  enabled?: boolean
}

interface UseMercadoLibreSearchResult {
  results: MlProductResult[]
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
}

export function useMercadoLibreSearch({
  query,
  enabled = true,
}: UseMercadoLibreSearchOptions): UseMercadoLibreSearchResult {
  const trimmed = query.trim()
  const isReady = enabled && trimmed.length >= MIN_QUERY_LENGTH

  const { data, isLoading, isError } = useQuery({
    queryKey: mlSearchKeys.search(trimmed),
    queryFn: () => searchMercadoLibre(trimmed),
    enabled: isReady,
    staleTime: DEBOUNCE_WAIT_MS * 2,   // keep result alive briefly while user reviews
    gcTime: 5 * 60 * 1000,            // 5 min — discard after user closes modal
    retry: 1,
  })

  const results = data?.results ?? []

  return {
    results,
    isLoading: isReady && isLoading,
    isError,
    isEmpty: isReady && !isLoading && results.length === 0,
  }
}
