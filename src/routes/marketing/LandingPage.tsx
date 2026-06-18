import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight02Icon,
  StoreLocation01Icon,
  PackageIcon,
  WhatsappIcon,
  DashboardSquare01Icon,
  AiMagicIcon,
  PaintBrush02Icon,
  CreditCardIcon,
  Tick02Icon,
  HomeIcon,
  ShoppingCart01Icon,
  UserGroupIcon,
  UserIcon,
  InvoiceIcon,
  Money02Icon,
  CustomerSupportIcon,
  Search01Icon,
  Notification02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useSession } from '@/features/auth'
import type { User } from '@supabase/supabase-js'
import { MarketingNavbar } from './_shared/MarketingNavbar'
import { MarketingFooter } from './_shared/MarketingFooter'
import { PricingTable } from './_shared/PricingTable'

/* ─── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function revealStyle(visible: boolean, delay = 0): React.CSSProperties {
  return {
    transitionProperty: 'opacity, transform',
    transitionDuration: '680ms',
    transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: visible ? `${delay}ms` : '0ms',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(26px)',
  }
}

/* ─── Shared components ──────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[2.5px] text-[#10b981]">
      {children}
    </div>
  )
}

/* ─── Hero Mockup (dashboard + phone + floating cards) ───────────────────── */
const HERO_PRODUCTS = [
  { pos: 1, name: 'Kit Skincare Completo', price: 'R$ 89,90', sold: '142 vendas', bg: 'from-pink-100 to-rose-200' },
  { pos: 2, name: 'Sérum Facial Anti-idade', price: 'R$ 69,90', sold: '98 vendas', bg: 'from-purple-100 to-violet-200' },
  { pos: 3, name: 'Protetor Solar FPS 50', price: 'R$ 45,90', sold: '76 vendas', bg: 'from-amber-100 to-orange-200' },
  { pos: 4, name: 'Creme Hidratante 200ml', price: 'R$ 34,90', sold: '61 vendas', bg: 'from-emerald-100 to-green-200' },
  { pos: 5, name: 'Máscara Revitalizante', price: 'R$ 29,90', sold: '54 vendas', bg: 'from-blue-100 to-indigo-200' },
]

function HeroMobileMockup() {
  return (
    <div className="relative mx-auto mt-10 max-w-lg px-4 md:hidden">
      {/* Dashboard window */}
      <div className="overflow-hidden rounded-2xl border border-black/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.22)]">
        {/* Browser chrome */}
        <div className="flex flex-shrink-0 items-center gap-1 bg-[#1a1a2e] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f56]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
          <div className="ml-2 flex-1 rounded-full bg-white/8 px-2 py-0.5 text-center text-[8px] text-white/30">
            app.zapia.app
          </div>
        </div>

        {/* Dashboard */}
        <div className="flex">
          {/* Sidebar */}
          <div className="flex w-8 flex-shrink-0 flex-col items-center gap-2 bg-[#0d0d1a] py-2.5">
            <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500">
              <span className="text-[7px] font-black text-white">Z</span>
            </div>
            {SIDEBAR_ICONS.slice(0, 6).map((Icon, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md',
                  i === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'text-white/20',
                )}
              >
                <HugeiconsIcon icon={Icon} size={10} />
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 overflow-hidden bg-gray-50 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <div>
                <p className="text-[6px] text-gray-400">Bem-vinda,</p>
                <p className="text-[10px] font-bold text-gray-900">Loja da Juliana</p>
              </div>
              <div className="relative">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <HugeiconsIcon icon={Notification02Icon} size={9} />
                </div>
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[5px] font-bold text-white">
                  3
                </span>
              </div>
            </div>

            <div className="mb-1.5 grid grid-cols-2 gap-1">
              {[
                { label: 'Vendas do mês', value: 'R$ 8.450', delta: '+12%' },
                { label: 'Pedidos', value: '256', delta: '+15%' },
                { label: 'Ticket médio', value: 'R$ 228', delta: '+8%' },
                { label: 'Produtos ativos', value: '48', delta: '6 novos' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white p-1.5 shadow-sm">
                  <p className="text-[6px] text-gray-400">{s.label}</p>
                  <p className="text-[10px] font-bold leading-tight text-gray-900">{s.value}</p>
                  <p className="text-[6px] text-emerald-500">{s.delta}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-white p-1.5 shadow-sm">
              <p className="mb-1 text-[6px] font-semibold text-gray-400">Produtos mais vendidos</p>
              {HERO_PRODUCTS.slice(0, 3).map((p) => (
                <div key={p.name} className="mb-0.5 flex items-center gap-1">
                  <span className="w-2 text-[6px] text-gray-300">{p.pos}</span>
                  <div className={cn('h-3 w-3 flex-shrink-0 rounded bg-gradient-to-br', p.bg)} />
                  <span className="flex-1 truncate text-[7px] text-gray-600">{p.name}</span>
                  <span className="text-[7px] font-semibold text-gray-800">{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* iPhone catalog mockup — sobreposição à direita */}

    </div>
  )
}

function HeroSalesMockup() {
  return (
    <>
      <style>{`
        @keyframes heroFloatA {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes heroFloatB {
          0%, 100% { transform: translateY(0px) rotate(1.5deg); }
          50%       { transform: translateY(-11px) rotate(1.5deg); }
        }
        @keyframes heroFloatC {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-13px) rotate(-1deg); }
        }
        .hero-float-a { animation: heroFloatA 4.2s ease-in-out infinite; }
        .hero-float-b { animation: heroFloatB 5s   ease-in-out infinite 1.3s; }
        .hero-float-c { animation: heroFloatC 3.8s ease-in-out infinite 2.1s; }
      `}</style>

      {/* Mobile: 16:9 */}
      <HeroMobileMockup />

      {/* Desktop: floating cards + phone */}
      <div className="relative mx-auto mt-14 hidden max-w-5xl md:block">

        {/* ── Float A: novo pedido (top-left) ── */}
        <div className="hero-float-a absolute -left-3 top-14 z-20 hidden w-[172px] rounded-2xl border border-black/6 bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.14)] md:block">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <HugeiconsIcon icon={ShoppingCart01Icon} size={15} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900">Novo pedido!</p>
              <p className="text-[9px] text-gray-400">#1042 · há 2 min</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
            <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-100 to-rose-200" />
            <div>
              <p className="text-[10px] font-medium text-gray-600">Kit Skincare</p>
              <p className="text-[12px] font-bold text-emerald-600">R$ 89,90</p>
            </div>
          </div>
        </div>

        {/* ── Float B: visitantes ao vivo (top-right) ── */}
        <div className="hero-float-b absolute -right-3 top-12 z-20 hidden w-[152px] rounded-2xl border border-black/6 bg-white p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.14)] md:block">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-[10px] font-semibold text-gray-400">Ao vivo agora</p>
          </div>
          <p className="text-[32px] font-black leading-none text-gray-900">24</p>
          <p className="mt-0.5 text-[10px] text-gray-400">no catálogo agora</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
          </div>
        </div>

        {/* ── Float C: pedido WhatsApp (bottom-left) ── */}
        <div className="hero-float-c absolute bottom-16 -left-3 z-20 hidden w-[204px] rounded-2xl border border-black/6 bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.14)] md:block">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white">
              <HugeiconsIcon icon={WhatsappIcon} size={13} />
            </div>
            <p className="text-[10px] font-semibold text-gray-500">Pedido via WhatsApp</p>
          </div>
          <div className="rounded-xl bg-[#dcf8c6] px-2.5 py-2 text-[10px] leading-relaxed text-gray-700">
            Olá! Quero o <strong>Sérum Facial</strong> (tam. P). Pode confirmar? 😊
          </div>
        </div>

        {/* ── Dashboard window ── */}
        <div className="overflow-hidden rounded-t-2xl border border-black/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.28)] md:rounded-t-3xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-white/5 bg-[#1a1a2e] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            <div className="ml-3 flex-1 rounded-full bg-white/8 px-4 py-1 text-center text-[11px] text-white/30">
              app.zapia.app
            </div>
            <div className="ml-3 h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex" style={{ minHeight: 340 }}>
            {/* Sidebar */}
            <div className="flex w-14 flex-shrink-0 flex-col items-center gap-2.5 border-r border-white/5 bg-[#0d0d1a] py-4 md:w-16">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
                <span className="text-xs font-black text-white">Z</span>
              </div>
              {SIDEBAR_ICONS.map((Icon, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    i === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'text-white/25',
                  )}
                >
                  <HugeiconsIcon icon={Icon} size={15} />
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 bg-gray-50 p-4 md:p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400">Bem-vinda de volta,</p>
                  <h3 className="text-base font-bold text-gray-900">Loja da Juliana</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <HugeiconsIcon icon={Notification02Icon} size={16} />
                    </div>
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white">
                      3
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[11px] font-bold text-white">
                    JL
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {[
                  { label: 'Vendas do mês', value: 'R$ 8.450', delta: '+12%' },
                  { label: 'Pedidos', value: '256', delta: '+15%' },
                  { label: 'Ticket médio', value: 'R$ 228', delta: '+8%' },
                  { label: 'Produtos ativos', value: '48', delta: '6 novos' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="mb-0.5 text-[9px] font-medium text-gray-400">{stat.label}</div>
                    <div className="text-[15px] font-bold text-gray-900 md:text-lg">{stat.value}</div>
                    <div className="mt-0.5 text-[9px] text-emerald-500">{stat.delta}</div>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-[1fr_1.3fr] gap-2.5">
                {/* Products panel */}
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="mb-2.5 text-[10px] font-semibold text-gray-500">
                    Produtos mais vendidos
                  </div>
                  <div className="space-y-1.5">
                    {HERO_PRODUCTS.map((product) => (
                      <div
                        key={product.name}
                        className="flex items-center gap-2 border-b border-gray-50 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="w-3 text-[9px] text-gray-300">{product.pos}</span>
                        <div className={cn('h-6 w-6 flex-shrink-0 rounded-lg bg-gradient-to-br', product.bg)} />
                        <span className="flex-1 truncate text-[10px] text-gray-600">{product.name}</span>
                        <div className="text-right">
                          <div className="text-[10px] font-semibold text-gray-800">{product.price}</div>
                          <div className="text-[8px] text-emerald-500">{product.sold}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart + revenue */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex-1 rounded-xl bg-white p-3 shadow-sm">
                    <div className="mb-1 text-[10px] font-semibold text-gray-500">
                      Vendas nos últimos 7 dias
                    </div>
                    <svg viewBox="0 0 260 65" className="w-full" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon
                        fill="url(#chartGrad)"
                        points="10,52 50,58 90,36 130,46 170,16 210,32 250,20 250,65 10,65"
                      />
                      <polyline
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points="10,52 50,58 90,36 130,46 170,16 210,32 250,20"
                      />
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                        <text key={day} x={10 + i * 40} y={64} fontSize="7" fill="#9ca3af" textAnchor="middle">
                          {day}
                        </text>
                      ))}
                    </svg>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-[9px] font-medium text-gray-400">Receita do mês</div>
                    <div className="mt-0.5 text-xl font-bold text-gray-900">R$ 8.450,00</div>
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                      +12% vs mês anterior
                    </span>
                    <div className="mt-2 text-[10px] font-medium text-violet-500">Ver relatório</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Phone overlay ── */}
        <div className="absolute -bottom-6 right-4 hidden w-[164px] overflow-hidden rounded-[26px] border-[5px] border-gray-800 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.4)] md:block lg:right-8 lg:w-[184px]">
          <div className="absolute left-1/2 top-0 z-10 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-gray-800" />
          <div className="bg-violet-600 px-3 pb-3 pt-5 text-center">
            <div className="text-[8px] text-white/70">Catálogo de</div>
            <div className="mt-0.5 text-[13px] font-bold text-white">Loja da Juliana</div>
            <div className="mt-2 rounded-full bg-violet-500 py-1.5 text-[9px] font-semibold text-white">
              Compartilhar catálogo
            </div>
          </div>
          <div className="bg-white p-2.5">
            <div className="mb-2 flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-2">
              <HugeiconsIcon icon={Search01Icon} size={10} className="text-gray-400" />
              <span className="text-[9px] text-gray-400">Buscar produtos</span>
            </div>
            <div className="mb-2.5 flex gap-1.5">
              <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[8px] font-semibold text-white">
                Todos
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[8px] text-gray-500">
                Skincare
              </span>
            </div>
            {HERO_PRODUCTS.slice(0, 2).map((p) => (
              <div key={p.name} className="mb-2 flex items-center gap-2.5">
                <div className={cn('h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br', p.bg)} />
                <div>
                  <div className="text-[10px] font-semibold text-gray-800">{p.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="text-[10px] font-bold text-violet-600">{p.price}</div>
                </div>
              </div>
            ))}
            <div className="mt-1 flex justify-end">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] shadow-lg">
                <HugeiconsIcon icon={WhatsappIcon} size={14} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function getUserFirstName(user: User | null) {
  const metadataName = user?.user_metadata?.name
  const fullName = typeof metadataName === 'string' ? metadataName.trim() : ''
  const emailName = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
  return (fullName || emailName || 'lojista').split(/\s+/)[0]
}

function getHeroGreeting(date: Date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia ☀️'
  if (hour >= 12 && hour < 18) return 'Boa tarde 🚀'
  return 'Boa noite 🌙'
}

function getLoggedInHeroSub(date: Date) {
  const day = date.getDay()
  if (day === 1) return '🚀 A semana está começando com boas oportunidades, vamos conquistar novos clientes juntos?'
  if (day === 5) return '🔥 Vamos fechar a semana com mais pedidos e novos clientes?'
  if (day === 0 || day === 6) return '✨ O fim de semana também tem potencial, vamos conquistar novos clientes juntos?'
  return '💪 Esta semana tem potencial, vamos conquistar novos clientes juntos?'
}

function Hero() {
  const { session, user } = useSession()
  const now = new Date()
  const isLoggedIn = Boolean(session)
  const loggedInGreeting = `${getHeroGreeting(now)}, ${getUserFirstName(user)}.`

  return (
    <section className="relative overflow-hidden bg-[#f5f1ec] px-6 pb-16 md:pb-0 pt-10 md:pt-16">
      {/* Centered copy */}
      <div className="relative mx-auto max-w-2xl text-center">
        {isLoggedIn ? (
          <>
            <h1 className="text-[36px] font-black leading-tight tracking-tight text-z-text md:text-[52px]">
              <span className="block">{loggedInGreeting}</span>
              <span className="block text-z-text-muted">Que bom ver você novamente.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-z-text-muted md:text-xl">
              {getLoggedInHeroSub(now)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter text-z-text md:text-[56px] lg:text-[62px]" style={{ letterSpacing: '-0.055em' }}>
              Crie seu catálogo digital em poucos passos
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-z-text-muted md:text-[22px]">
              Cadastre seus produtos, compartilhe o link do seu catálogo e receba pedidos diretamente no seu WhatsApp.
            </p>
          </>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl bg-[#a4e636] px-8 text-base font-bold text-[#020617] hover:bg-[#a4e636]/90 shadow-sm transition-all duration-300 hover:scale-[1.02]"
          >
            <Link id="lp-hero-cta-signup" to={isLoggedIn ? ROUTES.dashboard : ROUTES.signup}>
              {isLoggedIn ? 'Ir para dashboard' : 'Crie seu catálogo grátis'}
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mockup */}
      <HeroSalesMockup />
    </section>
  )
}

/* ─── Stats strip ────────────────────────────────────────────────────────── */
const STATS = [
  { 
    icon: StoreLocation01Icon, 
    value: '< 5 minutos', 
    label: 'para ter o catálogo no ar',
    bg: 'bg-z-primary',
  },
  { 
    icon: ShoppingCart01Icon, 
    value: 'Link próprio', 
    label: 'da sua loja online',
    bg: 'bg-z-secondary',
  },
  { 
    icon: WhatsappIcon, 
    value: 'WhatsApp', 
    label: 'como canal de pedidos',
    bg: 'bg-z-green',
  },
  { 
    icon: DashboardSquare01Icon, 
    value: 'Dashboard', 
    label: 'tudo em um único lugar',
    bg: 'bg-z-secondary',
  },
]

function StatsStrip() {
  const { ref, visible } = useReveal()
  return (
    <section className="bg-z-bg/50 px-6 py-16 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className="group flex flex-col items-center gap-5 rounded-[2rem] border border-black/[0.04] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1.5"
              style={revealStyle(visible, i * 90)}
            >
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-white transition-transform duration-500 group-hover:scale-110", s.bg)}>
                <HugeiconsIcon icon={s.icon} size={30} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="text-[1.125rem] font-bold text-z-text">{s.value}</div>
                <div className="text-[0.9375rem] font-medium leading-relaxed text-z-text-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How it works ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    icon: StoreLocation01Icon,
    title: 'Crie sua loja',
    desc: 'Cadastre-se, adicione logo, cores da sua marca e personalize o catálogo em poucos minutos.',
  },
  {
    icon: PackageIcon,
    title: 'Adicione seus produtos',
    desc: 'Cadastre produtos com fotos, variações e preços. Use IA para gerar descrições automaticamente.',
  },
  {
    icon: WhatsappIcon,
    title: 'Compartilhe e venda',
    desc: 'Envie o link pelo WhatsApp. Os pedidos chegam no dashboard em tempo real, formatados e prontos.',
  },
]

function HowItWorks() {
  const { ref, visible } = useReveal()
  return (
    <section id="como-funciona" className="bg-z-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Como funciona</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Três passos para começar a vender
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Sem complicação. Sem código. Sem mensalidade no primeiro mês.
          </p>
        </div>

        {/* Steps */}
        <StepsGrid />

        {/* CTA */}
        <div className="mt-12 text-center" style={revealStyle(visible, 400)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-how-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-z-text-hint">
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  )
}

function StepsGrid() {
  const { ref, visible } = useReveal()
  return (
    <div className="relative grid gap-6 md:grid-cols-3" ref={ref}>
      {/* Connector line */}
      <div className="absolute left-[16.5%] right-[16.5%] top-9 hidden h-px bg-z-border md:block" />

      {STEPS.map((step, i) => (
        <div
          key={step.title}
          className="relative z-10 rounded-2xl border border-z-border bg-white p-7 text-center transition-shadow hover:shadow-z-lg"
          style={revealStyle(visible, i * 120)}
        >
          <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-emerald-50 bg-emerald-500 text-white">
            <HugeiconsIcon icon={step.icon} size={26} />
          </div>
          <h3 className="text-[1.1875rem] font-bold">{step.title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-z-text-muted">
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ShoppingCart01Icon,
    title: 'Catálogo online',
    desc: 'URL exclusiva, busca inteligente, categorias e grid otimizado para converter visitantes em clientes.',
    color: 'bg-emerald-500',
  },
  {
    icon: WhatsappIcon,
    title: 'Pedidos via WhatsApp',
    desc: 'Cada pedido vira uma mensagem formatada que chega direto no seu WhatsApp, pronta para atender.',
    color: 'bg-[#25D366]',
  },
  {
    icon: DashboardSquare01Icon,
    title: 'Dashboard completo',
    desc: 'Acompanhe pedidos, clientes e receita em tempo real, de qualquer dispositivo, a qualquer hora.',
    color: 'bg-emerald-500',
  },
  {
    icon: AiMagicIcon,
    title: 'IA integrada',
    desc: 'Gemini gera descrições de produtos, analisa perfis de clientes e sugere melhorias para o catálogo.',
    color: 'bg-violet-500',
  },
  {
    icon: PaintBrush02Icon,
    title: 'Personalização total',
    desc: 'Logo, banner, cores e slogan. Sua loja com a identidade visual da sua marca.',
    color: 'bg-emerald-500',
  },
  {
    icon: CreditCardIcon,
    title: 'Planos acessíveis',
    desc: 'A partir de R$ 9,90/mês. Cresça no seu ritmo sem surpresas na fatura.',
    color: 'bg-emerald-500',
  },
]

function Features() {
  const { ref, visible } = useReveal()
  return (
    <section id="funcionalidades" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Funcionalidades</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Tudo que você precisa para vender mais
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Ferramentas pensadas para o dia a dia de quem vende no Brasil.
          </p>
        </div>

        <FeaturesGrid />

        {/* CTA */}
        <div className="mt-14 text-center" style={revealStyle(visible, 500)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-features-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturesGrid() {
  const { ref, visible } = useReveal()
  return (
    <div className="grid gap-4 md:grid-cols-3" ref={ref}>
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className="group rounded-2xl border border-z-border bg-z-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-z-lg"
          style={revealStyle(visible, i * 80)}
        >
          <div
            className={cn(
              'mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white',
              f.color,
            )}
          >
            <HugeiconsIcon icon={f.icon} size={20} />
          </div>
          <h3 className="text-base font-bold">{f.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-z-text-muted">
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Product preview ────────────────────────────────────────────────────── */
const SIDEBAR_ICONS = [
  HomeIcon,
  InvoiceIcon,
  PackageIcon,
  UserGroupIcon,
  UserIcon,
  DashboardSquare01Icon,
  Money02Icon,
  CustomerSupportIcon,
]

function ProductPreview() {
  const { ref, visible } = useReveal()
  return (
    <section className="overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>O produto</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Dashboard + catálogo em harmonia
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Uma interface para gerenciar e outra para vender. Simples assim.
          </p>
        </div>

        <PreviewMockups visible={visible} />

        {/* CTA */}
        <div className="mt-14 text-center" style={revealStyle(visible, 500)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-preview-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
          <p className="mt-3 text-sm text-z-text-hint">
            Sem cartão · Configure em menos de 5 minutos
          </p>
        </div>
      </div>
    </section>
  )
}

function PreviewMockups({ visible }: { visible: boolean }) {
  return (
    <div className="relative">
      {/* Dashboard mockup */}
      <div
        className="overflow-hidden rounded-2xl border border-black/8 bg-[#1e1e1e] shadow-z-lg"
        style={revealStyle(visible, 180)}
      >
        <div className="flex items-center gap-1.5 border-b border-white/6 bg-[#252525] px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
          <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
          <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-[10px] text-white/30">
            Dashboard — Início
          </span>
        </div>
        <div className="flex h-72">
          <div className="flex w-14 flex-col items-center gap-3 border-r border-white/6 bg-z-ink py-3">
            {SIDEBAR_ICONS.map((Ic, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  i === 0 ? 'bg-z-green text-z-ink' : 'text-white/40',
                )}
              >
                <HugeiconsIcon icon={Ic} size={16} />
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Pedidos hoje', '14', '+3 ↑'],
                ['Receita', 'R$ 4.820', '↑ 18%'],
              ].map(([l, v, s]) => (
                <div key={l} className="rounded-lg bg-[#252525] px-3 py-2.5">
                  <div className="text-[9px] text-white/40">{l}</div>
                  <div className="text-base font-bold text-z-bg">{v}</div>
                  <div className="text-[9px] text-[#10b981]">{s}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-lg bg-[#252525] p-3">
              <div className="mb-2 text-[10px] text-white/40">
                Últimos pedidos
              </div>
              {[
                ['#1041', 'Ana Souza', 'R$ 89,90', 'Pago', 'text-[#10b981]'],
                ['#1040', 'Carlos Lima', 'R$ 147,00', 'Novo', 'text-z-lilac'],
                ['#1039', 'Bruna M.', 'R$ 62,50', 'Preparo', 'text-yellow-400'],
              ].map(([id, n, v, st]) => (
                <div
                  key={id}
                  className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0"
                >
                  <span className="text-[10px] font-semibold text-[#10b981]">
                    {id}
                  </span>
                  <span className="text-[10px] text-white/60">{n}</span>
                  <span className="text-[10px] font-semibold text-z-bg">
                    {v}
                  </span>
                  <Badge
                    tone={
                      st === 'Pago'
                        ? 'green'
                        : st === 'Novo'
                          ? 'lilac'
                          : 'amber'
                    }
                    className="text-[8px]"
                  >
                    {st}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* iPhone catalog mockup — sobreposição à direita */}
    </div>
  )
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function PricingSection() {
  const { ref, visible } = useReveal()
  return (
    <section id="precos" className="bg-z-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Planos e preços</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Invista no crescimento da sua loja
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Cancele quando quiser, sem burocracia.
          </p>
        </div>

        <div style={revealStyle(visible, 200)}>
          <PricingTable />
        </div>

        <div
          className="mt-10 text-center text-sm text-z-text-muted"
          style={revealStyle(visible, 350)}
        >
          Dúvidas sobre qual plano escolher?{' '}
          <a
            id="lp-pricing-link-faq"
            href="#faq"
            className="font-semibold text-[#10b981] underline-offset-2 hover:underline"
          >
            Veja as perguntas frequentes
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'Preciso saber de tecnologia para usar o Zapia?',
    a: 'Não. O Zapia foi criado para ser simples. Se você consegue usar o WhatsApp, consegue usar o Zapia. O cadastro leva menos de 5 minutos e o catálogo já fica disponível para seus clientes.',
  },
  {
    q: 'Como meus clientes fazem pedidos?',
    a: 'Seu cliente acessa o catálogo pelo link exclusivo da sua loja, escolhe os produtos e finaliza o pedido. Uma mensagem formatada é enviada direto para o seu WhatsApp com todos os detalhes do pedido.',
  },
  {
    q: 'O que acontece após o período de teste?',
    a: 'Se você não adicionar um método de pagamento, o catálogo público fica suspenso temporariamente — mas você mantém acesso ao dashboard para configurar o plano. Seus dados e produtos ficam salvos.',
  },
  {
    q: 'Posso trocar de plano ou cancelar quando quiser?',
    a: 'Sim. Upgrade acontece na hora. Downgrade e cancelamento têm efeito no final do período já pago. Sem multas, sem burocracia.',
  },
  {
    q: 'A loja fica acessível pelo celular?',
    a: 'Sim. O catálogo é totalmente responsivo e otimizado para mobile, que é como a maioria dos clientes de lojistas brasileiros acessa o link.',
  },
  {
    q: 'Quais formas de pagamento são aceitas para o plano?',
    a: 'Cartão de crédito (com recorrência automática), PIX e boleto bancário — todos em reais (BRL). Aceitamos os principais cartões do mercado.',
  },
]

function FAQ() {
  const { ref, visible } = useReveal()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Dúvidas frequentes</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Respostas para as principais dúvidas
          </h2>
        </div>

        <FaqList
          items={FAQ_ITEMS}
          open={open}
          setOpen={setOpen}
          visible={visible}
        />

        <div
          className="mt-12 text-center"
          style={revealStyle(visible, FAQ_ITEMS.length * 60 + 200)}
        >
          <p className="mb-4 text-sm text-z-text-muted">
            Não encontrou sua dúvida? A gente responde rápido.
          </p>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-faq-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FaqList({
  items,
  open,
  setOpen,
  visible,
}: {
  items: (typeof FAQ_ITEMS)[number][]
  open: number | null
  setOpen: (i: number | null) => void
  visible: boolean
}) {
  return (
    <div className="flex flex-col divide-y divide-z-border overflow-hidden rounded-2xl border border-z-border">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className="bg-white"
            style={revealStyle(visible, i * 55)}
          >
            <button
              id={`lp-faq-toggle-${i + 1}`}
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-z-bg"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-z-text">
                {item.q}
              </span>
              <span
                className="shrink-0 text-lg font-light leading-none text-z-text-muted transition-transform duration-300"
                style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{ maxHeight: isOpen ? '300px' : '0px' }}
            >
              <p className="px-6 pb-5 text-sm leading-relaxed text-z-text-muted">
                {item.a}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  const { ref, visible } = useReveal()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-100 via-green-50 to-lime-100 px-6 py-28 text-center">
      {/* Subtle radial accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(52,211,153,0.15) 0%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-2xl" ref={ref}>
        <div style={revealStyle(visible, 0)}>
          <SectionLabel>Comece agora</SectionLabel>
        </div>

        <h2
          className="mx-auto mt-4 text-3xl font-extrabold leading-tight tracking-tightest text-z-text md:text-5xl"
          style={revealStyle(visible, 80)}
        >
          Sua loja merece um catálogo à altura.
        </h2>

        <p
          className="mt-4 text-base text-z-text-muted"
          style={revealStyle(visible, 140)}
        >
          Configure em menos de 5 minutos.{' '}
          <br className="hidden md:block" />
          Sem cartão de crédito.
        </p>

        <div className="mt-10" style={revealStyle(visible, 200)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-final-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>

        <div
          className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2"
          style={revealStyle(visible, 260)}
        >
          {[
            'Sem cartão de crédito',
            'Cancele quando quiser',
            'Suporte em português',
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-1.5 text-xs text-z-text-muted"
            >
              <HugeiconsIcon
                icon={Tick02Icon}
                size={13}
                className="text-emerald-500"
                strokeWidth={2.5}
              />
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNavbar />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <Features />
      <ProductPreview />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <MarketingFooter />
    </div>
  )
}
