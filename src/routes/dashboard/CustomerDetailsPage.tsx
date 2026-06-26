import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  Edit02Icon,
  InvoiceIcon,
  Mail01Icon,
  Location01Icon,
  PackageIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCustomer, useCustomerOrders } from '@/features/customers'
import { ROUTES } from '@/config/routes'
import { formatDate, formatMoney } from '@/lib/format'
import { fromE164BR } from '@/lib/br'
import { Badge, Button, Skeleton } from '@/components/ui'
import type { Order, OrderItem } from '@/types/domain'

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<Order['status'], React.ComponentProps<typeof Badge>['tone']> = {
  pending: 'amber',
  confirmed: 'lilac',
  completed: 'green',
  cancelled: 'rose',
}

type ProductSummary = {
  name: string
  quantity: number
  total: number
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

function addressFromOrder(order: Order) {
  const line = [
    order.address_street,
    order.address_number,
    order.address_complement,
  ]
    .filter(Boolean)
    .join(', ')
  const city = [
    order.address_neighborhood,
    order.address_city,
    order.address_state,
  ]
    .filter(Boolean)
    .join(' · ')
  return [line, city, order.address_cep].filter(Boolean).join('\n')
}

function summarizeProducts(items: OrderItem[]): ProductSummary[] {
  const map = new Map<string, ProductSummary>()
  for (const item of items) {
    const current = map.get(item.product_name) ?? {
      name: item.product_name,
      quantity: 0,
      total: 0,
    }
    current.quantity += item.quantity
    current.total += item.price_in_cents * item.quantity
    map.set(item.product_name, current)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { store, isLoading: storeLoading } = useActiveStore()
  const customer = useCustomer(id)
  const orders = useCustomerOrders(customer.data ?? undefined)

  if (storeLoading || customer.isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }
  if (!store) return <Navigate to={ROUTES.onboarding} replace />
  if (!customer.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-z-text-muted">Cliente não encontrado.</p>
        <Link
          to={ROUTES.dashboardCustomers}
          className="text-sm font-medium text-[#0bfeda] hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const waHref = `https://wa.me/${customer.data.whatsapp_phone.replace('+', '')}`
  const orderList = orders.data ?? []
  const billableOrders = orderList.filter((order) => order.status !== 'cancelled')
  const totalSpent = billableOrders.reduce((sum, order) => sum + order.total_in_cents, 0)
  const averageTicket = billableOrders.length > 0 ? Math.round(totalSpent / billableOrders.length) : 0
  const allItems = orderList.flatMap((order) => order.items)
  const products = summarizeProducts(allItems)
  const addresses = Array.from(
    new Set(orderList.map(addressFromOrder).filter(Boolean)),
  )

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.dashboardCustomers)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold tracking-tighter">
              {customer.data.name}
            </h1>
            <p className="text-xs text-z-text-muted">
              Cliente desde {formatDate(customer.data.created_at)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => customer.data && navigate(`${ROUTES.dashboardCustomers}/${customer.data.id}/editar`)}
        >
          <HugeiconsIcon icon={Edit02Icon} size={15} />
          Editar
        </Button>
      </header>

      <section className="w-full min-w-0 rounded-2xl border border-z-border bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-lg font-bold text-violet-700">
            {customer.data.avatar_url ? (
              <img
                src={customer.data.avatar_url}
                alt={customer.data.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(customer.data.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{customer.data.name}</h2>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#0bfeda]"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={15} />
              {fromE164BR(customer.data.whatsapp_phone)}
            </a>
          </div>
        </div>
        {customer.data.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {customer.data.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vendas" value={billableOrders.length.toString()} />
        <StatCard label="Receita" value={formatMoney(totalSpent)} />
        <StatCard label="Ticket médio" value={formatMoney(averageTicket)} />
        <StatCard
          label="Última compra"
          value={billableOrders[0] ? formatDate(billableOrders[0].created_at) : 'Nenhuma'}
        />
      </section>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <InfoPanel title="Contatos" icon={Mail01Icon}>
          <InfoLine label="WhatsApp" value={fromE164BR(customer.data.whatsapp_phone)} />
          <InfoLine
            label="Telefone secundário"
            value={customer.data.secondary_phone ? fromE164BR(customer.data.secondary_phone) : null}
          />
          <InfoLine label="E-mail" value={customer.data.email} />
          {customer.data.social_links.map((link) => (
            <InfoLine
              key={`${link.platform}-${link.value}`}
              label={link.platform}
              value={link.value}
            />
          ))}
          {!customer.data.secondary_phone &&
            !customer.data.email &&
            customer.data.social_links.length === 0 && (
              <p className="text-sm text-z-text-muted">Apenas WhatsApp cadastrado.</p>
            )}
        </InfoPanel>

        <InfoPanel title="Endereços usados em pedidos" icon={Location01Icon}>
          {orders.isLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : addresses.length > 0 ? (
            addresses.map((address) => (
              <p
                key={address}
                className="whitespace-pre-line rounded-xl border border-z-border bg-z-bg px-3 py-2 text-sm text-z-text-muted"
              >
                {address}
              </p>
            ))
          ) : (
            <p className="text-sm text-z-text-muted">Nenhum endereço encontrado em pedidos.</p>
          )}
        </InfoPanel>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <InfoPanel title="Produtos comprados" icon={PackageIcon}>
          {orders.isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : products.length > 0 ? (
            products.slice(0, 8).map((product) => (
              <div
                key={product.name}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-z-border bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-z-text">{product.name}</p>
                  <p className="text-xs text-z-text-muted">{product.quantity} unidade(s)</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-sm font-bold text-[#0bfeda]">
                  {formatMoney(product.total)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-z-text-muted">Nenhum produto comprado ainda.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Últimos pedidos" icon={InvoiceIcon}>
          {orders.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : orderList.length > 0 ? (
            orderList.slice(0, 6).map((order) => (
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
                  <span className="text-sm font-bold">{formatMoney(order.total_in_cents)}</span>
                  <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-z-text-muted">Nenhum pedido encontrado.</p>
          )}
        </InfoPanel>
      </div>

      {customer.data.profile_notes && (
        <InfoPanel title="Observações" icon={Edit02Icon}>
          <p className="whitespace-pre-line text-sm text-z-text-muted">
            {customer.data.profile_notes}
          </p>
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
