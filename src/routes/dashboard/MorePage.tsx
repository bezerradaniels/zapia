import { Link } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  CreditCardIcon,
  HeadphonesIcon,
  Logout01Icon,
  PaintBrush01Icon,
  Settings01Icon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import { useSignOut } from '@/features/auth'
import { usePlanLimits } from '@/features/billing'
import { useMembers } from '@/features/sellers'
import { useActiveStore } from '@/lib/tenant'

type MoreItem = {
  label: string
  description: string
  icon: IconSvgElement
  to: string
}

export default function MorePage() {
  const { store } = useActiveStore()
  const planLimits = usePlanLimits(store?.id)
  const members = useMembers(store?.id)
  const signOut = useSignOut()

  const sellerCount = members.data?.length ?? 0
  const sellerDescription =
    sellerCount === 1 ? '1 vendedor ativo' : `${sellerCount} vendedores ativos`
  const isTrialing = planLimits.subscription?.status === 'trialing'
  const planName = planLimits.plan?.name ?? 'Gratuito'
  const planDescription = isTrialing ? `Plano ${planName} · trial` : `Plano ${planName}`

  const items: MoreItem[] = [
    {
      label: 'Personalizar catálogo',
      description: 'Logo, cores, categorias, contatos',
      icon: PaintBrush01Icon,
      to: ROUTES.dashboardCatalog,
    },
    {
      label: 'Vendedores',
      description: members.isLoading ? 'Carregando vendedores' : sellerDescription,
      icon: UserSwitchIcon,
      to: ROUTES.dashboardSellers,
    },
    {
      label: 'Assinatura',
      description: planDescription,
      icon: CreditCardIcon,
      to: ROUTES.dashboardBilling,
    },
    {
      label: 'Suporte',
      description: 'Fale com a equipe Zapable',
      icon: HeadphonesIcon,
      to: ROUTES.dashboardSupport,
    },
    {
      label: 'Configurações',
      description: 'Dados da loja e da conta',
      icon: Settings01Icon,
      to: ROUTES.dashboardProfile,
    },
  ]

  async function handleSignOut() {
    await signOut.mutateAsync()
    window.location.href = ROUTES.home
  }

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col px-1 pb-12 pt-2 sm:px-0 lg:max-w-none">
      <h1 className="mb-6 text-[31px] font-extrabold tracking-tight text-z-text">Mais</h1>

      <section className="overflow-hidden rounded-[22px] border border-z-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {items.map((item, index) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex min-h-[82px] items-center gap-4 px-5 py-4 transition-colors hover:bg-z-bg2 ${
              index < items.length - 1 ? 'border-b border-z-border' : ''
            }`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-[#0bfeda]">
              <HugeiconsIcon icon={item.icon} size={25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[19px] font-extrabold leading-tight text-z-text">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-[15px] font-medium leading-tight text-z-text-hint">
                {item.description}
              </span>
            </span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={22} className="shrink-0 text-z-text-hint" />
          </Link>
        ))}
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signOut.isPending}
        className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-[22px] border border-z-border bg-white text-[18px] font-extrabold text-red-800 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <HugeiconsIcon icon={Logout01Icon} size={24} />
        {signOut.isPending ? 'Saindo...' : 'Sair da conta'}
      </button>

      <p className="mt-8 text-center text-sm font-medium text-z-text-hint">
        Zapable · v2.0 · feito no Brasil
      </p>
    </div>
  )
}
