export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN ?? 'zapia.app'

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'staging', 'admin', 'api', 'mail'])

const RESERVED_PATHS = new Set([
  '',
  'precos',
  'entrar',
  'cadastrar',
  'recuperar-senha',
  'nova-loja',
  'dashboard',
])

export function isStoreDomain(): boolean {
  const { hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return false
  const sub = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1)
  return !!sub && !RESERVED_SUBDOMAINS.has(sub)
}

export function resolveStoreSlug(): string | null {
  if (isStoreDomain()) {
    const sub = window.location.hostname.slice(
      0,
      window.location.hostname.length - ROOT_DOMAIN.length - 1,
    )
    return sub || null
  }

  const pathSlug = window.location.pathname.split('/').filter(Boolean)[0] ?? ''
  if (pathSlug && !RESERVED_PATHS.has(pathSlug)) return pathSlug
  return null
}

export function buildStoreUrl(slug: string): string {
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const host = `${hostname}${port ? `:${port}` : ''}`
    return `${protocol}//${host}${buildStorePath(slug)}`
  }
  return `${protocol}//${slug}.${ROOT_DOMAIN}`
}

export function buildStorePath(slug: string, path = ''): string {
  const cleanPath = path.replace(/^\/+/, '')
  if (isStoreDomain()) {
    return `/${cleanPath}`
  }
  return `/${slug}${cleanPath ? `/${cleanPath}` : ''}`
}
