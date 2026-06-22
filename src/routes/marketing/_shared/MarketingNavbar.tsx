import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ROUTES } from '@/config/routes'
import { useSession } from '@/features/auth'

const links = [
  { id: 'how', label: 'Como funciona', href: '#como-funciona', htmlId: 'lp-nav-link-como-funciona' },
  { id: 'features', label: 'Funcionalidades', href: '#funcionalidades', htmlId: 'lp-nav-link-funcionalidades' },
  { id: 'pricing', label: 'Preços', href: '#precos', htmlId: 'lp-nav-link-precos' },
  { id: 'faq', label: 'Dúvidas', href: '#faq', htmlId: 'lp-nav-link-faq' },
]

export function MarketingNavbar() {
  const { session, isLoading } = useSession()
  const isAuthenticated = !isLoading && session !== null

  return (
    <nav className="sticky top-0 z-40 border-b border-z-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6 py-3 md:h-20">
        <div className="flex items-center gap-8">
          <Link id="lp-nav-logo" to={ROUTES.home} aria-label="Zapia">
            <Logo size="sm" className="md:hidden" />
            <Logo size="lg" className="hidden md:flex" />
          </Link>
          <div className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            l.href.startsWith('#') ? (
              <a
                key={l.id}
                id={l.htmlId}
                href={l.href}
                className="text-sm font-medium text-z-text-muted transition-colors hover:text-z-text"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.id}
                id={l.htmlId}
                to={l.href}
                className="text-sm font-medium text-z-text-muted transition-colors hover:text-z-text"
              >
                {l.label}
              </Link>
            ),
          )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-[88px] rounded-md" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Button
              id="lp-nav-btn-dashboard"
              asChild
              variant="ghost"
              size="sm"
              className="border border-[#f8fafc] bg-[#f1f5f9] font-semibold text-[#020617] hover:bg-[#e2e8f0]"
            >
              <Link to={ROUTES.dashboard}>Painel</Link>
            </Button>
          ) : (
            <Button
              id="lp-nav-btn-login"
              asChild
              variant="ghost"
              size="sm"
              className="border border-[#f8fafc] bg-[#f1f5f9] font-semibold text-[#020617] hover:bg-[#e2e8f0]"
            >
              <Link to={ROUTES.login}>Login</Link>
            </Button>
          )}
          {!isAuthenticated && (
            <Button
              id="lp-nav-btn-signup"
              asChild
              variant="ghost"
              size="sm"
              className="hidden bg-green-100 font-semibold text-green-800 hover:bg-green-200 md:inline-flex"
            >
              <Link to={ROUTES.signup}>Teste grátis</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
