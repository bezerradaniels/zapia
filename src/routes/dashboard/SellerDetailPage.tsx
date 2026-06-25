import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  Edit02Icon,
  LinkSquare01Icon,
  ShoppingCart01Icon,
  UserGroupIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useSellerCatalog, useDeleteSellerCatalog } from '@/features/sellers'
import { useOrders } from '@/features/orders'
import { ROUTES } from '@/config/routes'
import { formatDate } from '@/lib/format'
import { Button, Badge } from '@/components/ui'
import { useState } from 'react'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-green-500' : 'bg-slate-400',
      )}
    >
      <span
        className={cn(
          'inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { store, isLoading: storeLoading } = useActiveStore()
  const seller = useSellerCatalog(id)
  const orders = useOrders(store?.id)
  const deleteSeller = useDeleteSellerCatalog(store?.id ?? '')
  const [isActive, setIsActive] = useState(true)

  if (storeLoading || seller.isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }
  if (!store) return <Navigate to={ROUTES.onboarding} replace />
  if (!seller.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-z-text-muted">Vendedor não encontrado.</p>
        <Link
          to={ROUTES.dashboardSellers}
          className="text-sm font-medium text-[#0bfeda] hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const displayName = seller.data.name

  const orderList = orders.data ?? []
  const assignedOrders = orderList.filter(order => order.seller_id === seller.data!.id)
  const billableOrders = assignedOrders.filter(order => order.status !== 'cancelled')
  const totalRevenue = billableOrders.reduce((sum, order) => sum + order.total_in_cents, 0)

  async function handleDelete() {
    if (!id) return
    if (!confirm(`Remover ${seller.data!.name} da equipe? Esta ação não pode ser desfeita.`)) return
    await deleteSeller.mutateAsync(id)
    navigate(ROUTES.dashboardSellers)
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.dashboardSellers)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center">
              <Toggle checked={isActive} onChange={setIsActive} />
            </div>
            <h1 className="truncate text-[22px] font-bold tracking-tighter">
              {displayName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`${ROUTES.dashboardSellers}/${seller.data.id}/editar`)}
          >
            <HugeiconsIcon icon={Edit02Icon} size={15} />
            Editar
          </Button>
        </div>
      </header>

      <section className="grid w-full min-w-0 grid-cols-2 gap-3">
        <StatCard label="Pedidos atribuídos" value={assignedOrders.length.toString()} />
        <StatCard label="Vendas concluídas" value={billableOrders.length.toString()} />
        <StatCard label="Receita total" value={(totalRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
        <StatCard
          label="Última venda"
          value={billableOrders[0] ? formatDate(billableOrders[0].created_at) : 'Nenhuma'}
        />
      </section>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <InfoPanel title="Informações do catálogo" icon={LinkSquare01Icon}>
          <InfoLine label="Nome" value={seller.data.name} />
          <InfoLine label="Slug do catálogo" value={seller.data.catalog_slug} />
          <InfoLine label="WhatsApp" value={seller.data.whatsapp_phone || 'Usar WhatsApp da loja'} />
          <InfoLine label="E-mail de contato" value={seller.data.contact_email || 'Não informado'} />
          <InfoLine label="Acesso ao dashboard" value={seller.data.has_dashboard_access ? 'Sim' : 'Não'} />
          <InfoLine label="Produtos" value={seller.data.catalog_products === 'all' ? 'Todos os produtos' : `${seller.data.specific_product_ids.length} produtos específicos`} />
        </InfoPanel>

        <InfoPanel title="Ações rápidas" icon={UserGroupIcon}>
          <div className="flex flex-col gap-2">
            {seller.data.linked_user_id && (
              <Link
                to={`${ROUTES.dashboardOrders}?seller=${seller.data.linked_user_id}`}
                className="flex items-center gap-2 rounded-xl border border-z-border bg-white px-4 py-3 text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
              >
                <HugeiconsIcon icon={ShoppingCart01Icon} size={18} />
                Ver pedidos do vendedor
              </Link>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`${ROUTES.dashboardSellers}/${seller.data.id}/editar`)}
            >
              <HugeiconsIcon icon={Edit02Icon} size={18} />
              Editar cadastro
            </Button>
            <Button
              variant="outline"
              className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={handleDelete}
            >
              <HugeiconsIcon icon={Delete02Icon} size={18} />
              Remover vendedor
            </Button>
          </div>
        </InfoPanel>
      </div>

      {assignedOrders.length > 0 && (
        <InfoPanel title="Pedidos recentes" icon={ShoppingCart01Icon}>
          <div className="flex flex-col gap-2">
            {assignedOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-z-border bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-z-text">
                    Pedido #{order.order_number}
                  </p>
                  <p className="text-xs text-z-text-muted">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold">{(order.total_in_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <Badge tone={order.status === 'completed' ? 'green' : order.status === 'cancelled' ? 'rose' : 'amber'}>
                    {order.status === 'completed' ? 'Concluído' : order.status === 'cancelled' ? 'Cancelado' : order.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </InfoPanel>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-z-border bg-white p-4">
      <p className="text-xs font-semibold text-z-text-muted">{label}</p>
      <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-z-text">{value}</p>
    </div>
  )
}

function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string
  icon: Parameters<typeof HugeiconsIcon>[0]['icon']
  children: React.ReactNode
}) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-z-border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon icon={icon} size={18} className="text-z-text-hint" />
        <h2 className="text-sm font-bold text-z-text">{title}</h2>
      </div>
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </section>
  )
}

function InfoLine({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-z-bg px-3 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <span className="text-xs font-semibold text-z-text-muted">{label}</span>
      <span className="min-w-0 break-words text-sm font-medium text-z-text sm:text-right">{value}</span>
    </div>
  )
}
