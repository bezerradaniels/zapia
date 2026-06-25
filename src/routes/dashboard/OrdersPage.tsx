import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InvoiceIcon,
  WhatsappIcon,
  PlusSignIcon,
  SearchIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  useOrders,
  useOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
} from '@/features/orders'
import { ROUTES } from '@/config/routes'
import { formatMoney } from '@/lib/format'
import { fromE164BR } from '@/lib/br'
import { Badge, Skeleton, Sheet } from '@/components/ui'
import { EmptyState } from '@/components/feedback'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithItems } from '@/types/domain'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<OrderStatus, React.ComponentProps<typeof Badge>['tone']> = {
  pending: 'amber',
  confirmed: 'lilac',
  completed: 'green',
  cancelled: 'rose',
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export default function OrdersPage() {
  const { store } = useActiveStore()
  const orders = useOrders(store?.id)
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const deleteOrder = useDeleteOrder(store?.id)
  const orderFromSearch = searchParams.get('order')

  // Open the order referenced by the `?order=` param. Synced during render
  // (not in an effect) so it reacts to URL changes without an extra pass.
  const [prevOrderFromSearch, setPrevOrderFromSearch] = useState<string | null>(null)
  if (orderFromSearch && orderFromSearch !== prevOrderFromSearch) {
    setPrevOrderFromSearch(orderFromSearch)
    setSelectedId(orderFromSearch)
  }

  const allOrders = orders.data ?? []
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const q = search.trim().toLowerCase()
  const list = allOrders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (q && !o.customer_name.toLowerCase().includes(q) && !String(o.order_number).includes(q)) {
      return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[25px] font-extrabold tracking-tighter">Pedidos</h1>
        <Link
          to={ROUTES.dashboardOrdersNew}
          className="flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Novo
        </Link>
      </header>

      {/* Search */}
      <div className="flex h-11 items-center gap-2.5 rounded-[13px] border border-z-border bg-white px-3.5">
        <HugeiconsIcon icon={SearchIcon} size={18} className="shrink-0 text-z-text-hint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pedido ou cliente"
          className="min-w-0 flex-1 bg-transparent text-sm text-z-text outline-none placeholder:text-z-text-hint"
        />
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors',
                active
                  ? 'bg-z-ink text-white'
                  : 'border border-z-border bg-white text-z-text-muted hover:bg-z-sand',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {orders.isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[78px] rounded-[18px]" />
          ))}
        </div>
      ) : allOrders.length === 0 ? (
        <EmptyState
          icon={InvoiceIcon}
          title="Nenhum pedido ainda"
          description="Quando um cliente finalizar o checkout, o pedido aparecerá aqui — mesmo que a mensagem do WhatsApp não seja enviada."
        />
      ) : list.length === 0 ? (
        <EmptyState icon={SearchIcon} title="Nenhum pedido encontrado" description="Tente outro filtro ou busca." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedId(o.id)}
              className="flex flex-col gap-2.5 rounded-[18px] border border-z-border bg-white p-4 text-left transition-colors hover:bg-z-bg active:bg-z-bg"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-extrabold tracking-tight">
                  {o.customer_name}
                </span>
                <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-z-text-muted">
                  #{o.order_number} · {formatDateTime(o.created_at)}
                </span>
                <span className="shrink-0 text-[15px] font-extrabold tracking-tight tabular-nums">
                  {formatMoney(o.total_in_cents)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <OrderDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onDeleted={() => setSelectedId(null)}
          deleteOrder={deleteOrder}
        />
      )}
    </div>
  )
}

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Novos' },
  { value: 'confirmed', label: 'Em atendimento' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
]

function OrderDetailModal({
  id,
  onClose,
  onDeleted,
  deleteOrder,
}: {
  id: string
  onClose: () => void
  onDeleted: () => void
  deleteOrder: ReturnType<typeof useDeleteOrder>
}) {
  const order = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} className="sm:max-w-lg">
      {order.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : order.data ? (
        <OrderDetailContent
          order={order.data}
          updateStatus={updateStatus}
          deleteOrder={deleteOrder}
          onDeleted={onDeleted}
        />
      ) : (
        <div>
          <h2 className="mb-2 text-base font-bold">Pedido não encontrado</h2>
          <p className="text-sm text-z-text-muted">
            Não foi possível carregar as informações do pedido.
          </p>
        </div>
      )}
    </Sheet>
  )
}

function OrderDetailContent({
  order: o,
  updateStatus,
  deleteOrder,
  onDeleted,
}: {
  order: OrderWithItems
  updateStatus: ReturnType<typeof useUpdateOrderStatus>
  deleteOrder: ReturnType<typeof useDeleteOrder>
  onDeleted: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header>
        <h2 className="truncate text-lg font-bold">{o.customer_name}</h2>
        <p className="text-xs text-z-text-muted">{formatDateTime(o.created_at)}</p>
      </header>

      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-z-text-muted">WhatsApp:</span>
            <a
              href={`https://wa.me/${o.customer_phone.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#0bfeda] hover:underline"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={14} />
              {fromE164BR(o.customer_phone)}
            </a>
          </div>
          {o.customer_notes && (
            <div className="rounded-lg bg-z-bg2 p-3">
              <div className="mb-1 text-xs font-medium text-z-text-hint">Observações</div>
              <p className="whitespace-pre-line text-sm">{o.customer_notes}</p>
            </div>
          )}
        </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
          Itens
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="truncate text-z-text-muted">
                {i.quantity}× {i.product_name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatMoney(i.price_in_cents * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-z-border pt-3 font-bold">
          <span>Total</span>
          <span className="tabular-nums text-[#0bfeda]">
            {formatMoney(o.total_in_cents)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
          Status do pedido
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={updateStatus.isPending || o.status === status}
              onClick={() => updateStatus.mutate({ id: o.id, status, oldStatus: o.status })}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-60',
                o.status === status
                  ? 'border-z-green bg-z-green text-z-ink'
                  : 'border-z-border bg-white text-z-text-muted hover:bg-z-bg2',
              )}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={deleteOrder.isPending}
        onClick={() => {
          if (!confirm(`Excluir pedido de "${o.customer_name}"?`)) return
          deleteOrder.mutate(o.id, { onSuccess: onDeleted })
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-z-border py-3 text-sm font-semibold text-z-red transition-colors hover:bg-z-rose/40 disabled:opacity-50"
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} />
        Excluir pedido
      </button>
    </div>
    </div>
  )
}

