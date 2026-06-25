import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  PackageIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  PauseIcon,
  PlayIcon,
  MoreVerticalIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  NewProductFullModal,
  useCreateProduct,
  useDeleteProduct,
  useSetProductActive,
  useProducts,
} from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { formatMoney } from '@/lib/format'
import { ROUTES } from '@/config/routes'
import { PLANS } from '@/config/plans'
import { Badge, Button, Skeleton, Sheet } from '@/components/ui'
import { EmptyState } from '@/components/feedback'
import type { Product } from '@/types/domain'

function stockPill(stock: number | null) {
  if (stock === null) return null
  if (stock === 0) return { label: 'Esgotado', tone: 'rose' as const }
  if (stock <= 5) return { label: `${stock} · baixo`, tone: 'amber' as const }
  return { label: `${stock} em estoque`, tone: 'neutral' as const }
}

export default function ProductsPage() {
  const { store } = useActiveStore()
  const navigate = useNavigate()
  const products = useProducts(store?.id)
  const create = useCreateProduct(store?.id ?? '')
  const del = useDeleteProduct(store?.id ?? '')
  const setActive = useSetProductActive(store?.id ?? '')
  const limits = usePlanLimits(store?.id)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [actionsFor, setActionsFor] = useState<Product | null>(null)

  const all = products.data ?? []
  const limit = limits.productLimit
  const atLimit = limit !== null && all.length >= limit

  const q = search.trim().toLowerCase()
  const list = q
    ? all.filter((p) =>
        [p.name, p.sku, p.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
      )
    : all

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[25px] font-extrabold tracking-tighter">Produtos</h1>
        {atLimit ? (
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.dashboardBilling}>Aumentar limite</Link>
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => setNewProductOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Novo
          </button>
        )}
      </header>

      {/* Search */}
      <div className="flex h-11 items-center gap-2.5 rounded-[13px] border border-z-border bg-white px-3.5">
        <HugeiconsIcon icon={SearchIcon} size={18} className="shrink-0 text-z-text-hint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou SKU"
          className="min-w-0 flex-1 bg-transparent text-sm text-z-text outline-none placeholder:text-z-text-hint"
        />
      </div>

      {atLimit && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-z-amber bg-z-amber/30 px-4 py-3 text-sm">
          <span className="text-z-amber-fg">
            Você atingiu o limite de <strong>{limit}</strong> produtos do plano{' '}
            <strong>{limits.plan ? PLANS[limits.plan.id].name : '—'}</strong>.
          </span>
          <Link
            to={ROUTES.dashboardBilling}
            className="shrink-0 text-sm font-semibold text-[#0bfeda] hover:underline"
          >
            Ver planos →
          </Link>
        </div>
      )}

      {products.isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[88px] rounded-[18px]" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Nenhum produto cadastrado"
          description="Adicione seu primeiro produto e ele aparecerá no seu catálogo público."
          action={
            <Button type="button" onClick={() => setNewProductOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Criar produto
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState icon={SearchIcon} title="Nenhum produto encontrado" description={`Nada para "${search}".`} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((product) => {
            const pill = stockPill(product.stock)
            const hasPromo = product.promo_price_in_cents != null
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-[18px] border border-z-border bg-white p-3"
              >
                <button
                  type="button"
                  onClick={() => navigate(`${ROUTES.dashboardProducts}/${product.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-z-sand">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <HugeiconsIcon icon={PackageIcon} size={22} className="text-z-text-hint" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[14px] font-bold tracking-tight">{product.name}</p>
                      {!product.is_active && <Badge tone="neutral">Inativo</Badge>}
                    </div>
                    {product.category && (
                      <p className="mt-0.5 truncate text-xs text-z-text-muted">{product.category}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-extrabold tracking-tight text-[#0bfeda]">
                        {formatMoney(product.promo_price_in_cents ?? product.price_in_cents)}
                      </span>
                      {hasPromo && (
                        <span className="text-xs text-z-text-hint line-through">
                          {formatMoney(product.price_in_cents)}
                        </span>
                      )}
                      {pill && <Badge tone={pill.tone}>{pill.label}</Badge>}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Ações do produto"
                  onClick={() => setActionsFor(product)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-z-text-hint hover:bg-z-bg"
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Per-product actions sheet */}
      <Sheet
        open={actionsFor !== null}
        onOpenChange={(open) => !open && setActionsFor(null)}
        title={actionsFor?.name}
      >
        {actionsFor && (
          <div className="flex flex-col gap-1">
            <SheetAction
              icon={EditIcon}
              label="Editar produto"
              onClick={() => {
                navigate(`${ROUTES.dashboardProducts}/${actionsFor.id}`)
                setActionsFor(null)
              }}
            />
            <SheetAction
              icon={actionsFor.is_active ? PauseIcon : PlayIcon}
              label={actionsFor.is_active ? 'Desativar' : 'Ativar'}
              onClick={() => {
                setActive.mutate({ id: actionsFor.id, isActive: !actionsFor.is_active })
                setActionsFor(null)
              }}
            />
            <SheetAction
              icon={DeleteIcon}
              label="Excluir produto"
              danger
              onClick={() => {
                if (confirm(`Excluir "${actionsFor.name}"?`)) {
                  del.mutate(actionsFor.id)
                  setActionsFor(null)
                }
              }}
            />
          </div>
        )}
      </Sheet>

      {/* Limite atingido — aviso mobile */}
      {atLimit && (
        <Link
          to={ROUTES.dashboardBilling}
          aria-label="Aumentar limite de produtos"
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-z-amber px-4 py-3 text-sm font-semibold text-z-amber-fg shadow-lg transition-transform active:scale-95 sm:hidden"
        >
          Aumentar limite
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      )}

      {store && newProductOpen && (
        <NewProductFullModal
          storeId={store.id}
          storeSlug={store.slug}
          onClose={() => setNewProductOpen(false)}
          onSubmit={async (values) => {
            const created = await create.mutateAsync(values)
            return created.id
          }}
        />
      )}
    </div>
  )
}

function SheetAction({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]['icon']
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-z-bg ${
        danger ? 'text-z-red' : 'text-z-text'
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} />
      {label}
    </button>
  )
}
