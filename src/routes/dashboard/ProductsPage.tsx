import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  ArrowDown01Icon,
  PackageIcon,
  EditIcon,
  DeleteIcon,
  PauseIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  NewProductFullModal,
  useCreateProduct,
  useDeleteProduct,
  useDeleteProducts,
  useSetProductActive,
  useSetProductsActive,
  useProducts,
} from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { PLANS } from '@/config/plans'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui'

export default function ProductsPage() {
  const { store } = useActiveStore()
  const products = useProducts(store?.id)
  const create = useCreateProduct(store?.id ?? '')
  const del = useDeleteProduct(store?.id ?? '')
  const setActive = useSetProductActive(store?.id ?? '')
  const setManyActive = useSetProductsActive(store?.id ?? '')
  const delMany = useDeleteProducts(store?.id ?? '')
  const limits = usePlanLimits(store?.id)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const list = products.data ?? []
  const limit = limits.productLimit
  const atLimit = limit !== null && list.length >= limit
  const allSelected = list.length > 0 && selected.size === list.length

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(list.map((p) => p.id)))
  }

  function handleBulkActivate(isActive: boolean) {
    setManyActive.mutate({ ids: Array.from(selected), isActive })
    setSelected(new Set())
  }

  function handleBulkDelete() {
    if (!confirm(`Excluir ${selected.size} produto(s) selecionado(s)?`)) return
    delMany.mutate(Array.from(selected))
    setSelected(new Set())
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tighter">Produtos</h1>
          <p className="text-sm text-z-text-muted">
            {list.length} {list.length === 1 ? 'produto' : 'produtos'}
            {limit !== null && (
              <>
                {' '}
                de <strong className="text-z-text">{limit}</strong> no plano{' '}
                {limits.plan ? PLANS[limits.plan.id].name : '—'}
              </>
            )}
            .
          </p>
        </div>

        {/* Header buttons — hidden on mobile */}
        <div className="hidden items-center gap-2 sm:flex">
          {atLimit ? (
            <Button asChild variant="outline">
              <Link to={ROUTES.dashboardBilling}>Aumentar limite</Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button">
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  Novo produto
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setNewProductOpen(true)}>
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  Novo produto
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.dashboardProductsBulk}>
                    <HugeiconsIcon icon={PlusSignIcon} size={16} />
                    Vários produtos
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {atLimit && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-900">
            Você atingiu o limite de <strong>{limit}</strong> produtos do plano{' '}
            <strong>{limits.plan ? PLANS[limits.plan.id].name : '—'}</strong>. Faça upgrade para adicionar
            mais.
          </span>
          <Link
            to={ROUTES.dashboardBilling}
            className="shrink-0 text-sm font-semibold text-[#10b981] hover:underline"
          >
            Ver planos →
          </Link>
        </div>
      )}

      {products.isLoading ? (
        <p className="text-sm text-z-text-muted">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
            <HugeiconsIcon icon={PackageIcon} size={26} />
          </div>
          <div className="text-base font-semibold">
            Nenhum produto cadastrado
          </div>
          <p className="max-w-sm text-sm text-z-text-muted">
            Adicione seu primeiro produto e ele aparecerá no seu catálogo público.
          </p>
          <Button type="button" onClick={() => setNewProductOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Criar produto
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-z-text-muted">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-z-green"
              />
              Selecionar todos
            </label>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-z-text-muted">
                  {selected.size} selecionado{selected.size > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  aria-label="Ativar selecionados"
                  title="Ativar selecionados"
                  onClick={() => handleBulkActivate(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                >
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Desativar selecionados"
                  title="Desativar selecionados"
                  onClick={() => handleBulkActivate(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50"
                >
                  <HugeiconsIcon icon={PauseIcon} size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Excluir selecionados"
                  title="Excluir selecionados"
                  onClick={handleBulkDelete}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                >
                  <HugeiconsIcon icon={DeleteIcon} size={14} />
                </button>
              </div>
            )}
          </div>

          {list.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-3 rounded-2xl border border-z-border bg-white p-3 sm:gap-4 sm:p-4"
            >
              <input
                type="checkbox"
                checked={selected.has(product.id)}
                onChange={() => toggleSelected(product.id)}
                className="mt-1 h-4 w-4 shrink-0 rounded accent-z-green"
                aria-label={`Selecionar ${product.name}`}
              />

              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-z-bg2 sm:h-14 sm:w-14">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-z-text-hint">
                    <HugeiconsIcon icon={PackageIcon} size={20} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  {product.category && (
                    <span className="rounded-md bg-z-bg2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-z-text-muted">
                      {product.category}
                    </span>
                  )}
                  {product.promo_price_in_cents != null && (
                    <Badge tone="lilac">Promo</Badge>
                  )}
                  {!product.is_active && <Badge tone="neutral">Inativo</Badge>}
                </div>
                <p className="text-sm text-z-text-muted">
                  {product.promo_price_in_cents != null ? (
                    <>
                      <span className="line-through text-z-text-hint">
                        {formatMoney(product.price_in_cents)}
                      </span>{' '}
                      <strong className="text-[#10b981]">
                        {formatMoney(product.promo_price_in_cents)}
                      </strong>
                    </>
                  ) : (
                    formatMoney(product.price_in_cents)
                  )}
                  {product.stock !== null && ` · ${product.stock} em estoque`}
                </p>

                <div className="mt-2 flex items-center gap-1.5">
                  <Link
                    to={`${ROUTES.dashboardProducts}/${product.id}`}
                    aria-label="Editar produto"
                    title="Editar produto"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
                  >
                    <HugeiconsIcon icon={EditIcon} size={14} />
                  </Link>
                  <button
                    type="button"
                    aria-label={product.is_active ? 'Desativar produto' : 'Ativar produto'}
                    title={product.is_active ? 'Desativar produto' : 'Ativar produto'}
                    onClick={() =>
                      setActive.mutate({ id: product.id, isActive: !product.is_active })
                    }
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      product.is_active
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50',
                    )}
                  >
                    <HugeiconsIcon icon={product.is_active ? PauseIcon : PlayIcon} size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir produto"
                    title="Excluir produto"
                    onClick={() => {
                      if (confirm(`Excluir "${product.name}"?`)) {
                        del.mutate(product.id)
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <HugeiconsIcon icon={DeleteIcon} size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limite atingido — aviso mobile (bottom bar não leva ao billing) */}
      {atLimit && (
        <Link
          to={ROUTES.dashboardBilling}
          aria-label="Aumentar limite de produtos"
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 sm:hidden"
        >
          Aumentar limite →
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
