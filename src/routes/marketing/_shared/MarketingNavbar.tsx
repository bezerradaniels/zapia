import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo, Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { AuthContext } from '@/providers/AuthContext'

const links = [
  { id: 'how', label: 'Como funciona', href: '#como-funciona', htmlId: 'lp-nav-link-como-funciona' },
  { id: 'features', label: 'Funcionalidades', href: '#funcionalidades', htmlId: 'lp-nav-link-funcionalidades' },
  { id: 'pricing', label: 'Preços', href: '#precos', htmlId: 'lp-nav-link-precos' },
  { id: 'faq', label: 'Dúvidas', href: '#faq', htmlId: 'lp-nav-link-faq' },
]

export function MarketingNavbar() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const isLoggedIn = Boolean(auth?.session)

  return (
    <nav className="sticky top-0 z-40 border-b border-z-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6 py-3 md:h-20">
        <div className="flex items-center gap-8">
          <Link id="lp-nav-logo" to={ROUTES.home} aria-label="Zapia">
            <Logo variant="verde" height={58} className="h-[29px] md:h-[58px]" />
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
          <Button
            id="lp-nav-btn-login"
            variant={isLoggedIn ? 'primary' : 'ghost'}
            size="sm"
            className={!isLoggedIn ? 'border border-[#f8fafc] bg-[#f1f5f9] font-semibold text-[#020617] hover:bg-[#e2e8f0]' : ''}
            onClick={() => navigate(isLoggedIn ? ROUTES.dashboard : ROUTES.login)}
          >
            {isLoggedIn ? 'Dashboard' : 'Login'}
          </Button>
          {!isLoggedIn && (
            <Button
              id="lp-nav-btn-signup"
              variant="ghost"
              size="sm"
              className="hidden bg-green-100 font-semibold text-green-800 hover:bg-green-200 md:inline-flex"
              onClick={() => navigate(ROUTES.signup)}
            >
              Teste grátis
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
