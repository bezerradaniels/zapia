import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  UserGroupIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useSession } from '@/features/auth'
import {
  useSellerCatalogs,
} from '@/features/sellers'
import { usePlanLimits } from '@/features/billing'
import { useOrders } from '@/features/orders'
import { ROUTES } from '@/config/routes'
import { NewSellerModal } from './NewSellerModal'
import type { SellerCatalog } from '@/features/sellers/types'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Seller row ──────────────────────────────────────────────────────────────

type SellerRowProps = {
  catalog: SellerCatalog
  isOwner: boolean
  assignedOrderCount: number
  onRemove: () => void
}

function SellerRow({ catalog, isOwner, assignedOrderCount, onRemove }: SellerRowProps) {
  const displayName = catalog.name
  const colorClass = avatarColor(displayName)

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-z-border bg-white p-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${colorClass}`}>
        {initials(displayName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-z-text">{displayName}</p>
        <p className="text-sm font-medium text-z-text-hint">
          {assignedOrderCount} {assignedOrderCount === 1 ? 'pedido atribuído' : 'pedidos atribuídos'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 sm:flex">
          <span>Ativo</span>
        </span>

        <Link
          to={`${ROUTES.dashboardSellers}/${catalog.id}`}
          className="flex h-9 items-center rounded-full border border-z-border px-3 text-xs font-bold text-z-text transition-colors hover:bg-z-bg2"
        >
          Ver detalhes
        </Link>
        {isOwner && (
          <button
            type="button"
            title="Remover vendedor"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
          >
            <HugeiconsIcon icon={Delete02Icon} size={15} />
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SellersPage() {
  const { user } = useSession()
  const { store } = useActiveStore()
  const sellerCatalogs = useSellerCatalogs(store?.id)
  const limits = usePlanLimits(store?.id)
  const orders = useOrders(store?.id)

  const [search, setSearch] = useState('')
  const [showNewSellerModal, setShowNewSellerModal] = useState(false)

  if (!store) return <p className="text-sm text-z-text-muted">Carregando...</p>

  const isOwner = store.owner_id === user?.id
  const list = sellerCatalogs.data ?? []
  const sellerLimit = limits.sellerLimit
  const atLimit = sellerLimit !== null && list.length >= sellerLimit

  // Calculate order count for each seller
  const orderList = orders.data ?? []
  function getAssignedOrderCount(catalogId: string): number {
    return orderList.filter(order => order.seller_id === catalogId).length
  }

  const filtered = search.trim()
    ? list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : list

  function handleRemove(catalog: SellerCatalog) {
    if (!confirm(`Remover ${catalog.name} da equipe?`)) return
    // TODO: Implement delete seller catalog
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Search + button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-z-primary" />
            <input
              type="search"
              placeholder="Pesquise por vendedores"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-z-border bg-white pl-9 pr-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
            />
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowNewSellerModal(true)}
              disabled={atLimit}
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-z-green px-5 text-sm font-semibold text-z-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Cadastrar vendedor
            </button>
          )}
        </div>

        {isOwner && atLimit && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
            <span className="text-amber-800">
              Limite de {sellerLimit} {sellerLimit === 1 ? 'vendedor' : 'vendedores'} atingido.
            </span>
            <Link to={ROUTES.dashboardBilling} className="font-semibold text-[#0bfeda] hover:underline">
              Ver planos →
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-z-text-muted">
          <span>Gerencie os seus catálogos de vendedores</span>
          <span>{list.length}/{sellerLimit ?? '∞'} vendedores</span>
        </div>

        {sellerCatalogs.isLoading ? (
          <p className="py-6 text-center text-sm text-z-text-muted">Carregando...</p>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
              <HugeiconsIcon icon={UserGroupIcon} size={26} />
            </div>
            <p className="text-base font-semibold">Sua equipe está vazia</p>
            <p className="max-w-sm text-sm text-z-text-muted">
              Adicione vendedores para que eles acessem os pedidos da loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((catalog) => (
              <SellerRow
                key={catalog.id}
                catalog={catalog}
                isOwner={isOwner}
                assignedOrderCount={getAssignedOrderCount(catalog.id)}
                onRemove={() => handleRemove(catalog)}
              />
            ))}
            {filtered.length === 0 && search && (
              <p className="col-span-full py-6 text-center text-sm text-z-text-muted">
                Nenhum vendedor encontrado para "{search}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* New Seller Modal */}
      <NewSellerModal
        open={showNewSellerModal}
        onClose={() => setShowNewSellerModal(false)}
        storeId={store?.id ?? ''}
        storeSlug={store?.slug ?? ''}
        storeWhatsapp={store?.whatsapp_phone ?? ''}
      />
    </>
  )
}
