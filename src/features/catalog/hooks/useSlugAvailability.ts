import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isSlugAvailable } from '../api/queries'
import { catalogKeys } from '../api/keys'

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export type SlugAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken'

/** Debounced live check for whether a store slug is free to use. Skips the
 * check entirely when the slug hasn't changed from the store's current one,
 * or when it doesn't match the slug format yet. */
export function useSlugAvailability(slug: string, currentSlug: string): SlugAvailabilityStatus {
  const [debounced, setDebounced] = useState(slug)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(slug), 500)
    return () => clearTimeout(timer)
  }, [slug])

  const isUnchanged = debounced === currentSlug
  const isValidFormat = slugRegex.test(debounced)
  const shouldCheck = isValidFormat && !isUnchanged

  const query = useQuery({
    queryKey: catalogKeys.slugAvailability(debounced),
    queryFn: () => isSlugAvailable(debounced),
    enabled: shouldCheck,
    staleTime: 0,
  })

  if (!shouldCheck) return 'idle'
  if (debounced !== slug || query.isFetching) return 'checking'
  if (query.data === true) return 'available'
  if (query.data === false) return 'taken'
  return 'idle'
}
