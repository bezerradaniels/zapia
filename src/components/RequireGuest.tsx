import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '@/features/auth'
import { ROUTES } from '@/config/routes'

/** Redirects already-authenticated users away from guest-only pages (signup, login). */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()

  if (isLoading) return null
  if (session) return <Navigate to={ROUTES.dashboard} replace />

  return children
}
