import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PackageIcon,
  SearchIcon,
  StarIcon,
  Sorting01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import type { Product, Store } from '@/types/domain'
// Direct file imports (not the '@/features/products' barrel) so this
// storefront page doesn't pull in ProductForm's dashboard-only weight.
import { usePublicProducts } from '@/features/products/hooks/useProducts'
import { useCartStore } from '@/features/cart'
import { buildStoreTitle, buildStoreDescription } from '@/features/catalog'
import { toTitleCase } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/store/ProductCard'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { track } from '@/features/analytics'
import { Skeleton, Sheet } from '@/components/ui'
import { EmptyState } from '@/components/feedback'

const ALL_CATEGORY = '__all__'
type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name: 'A → Z',
}

function effective(p: Product) {
  return p.promo_price_in_cents ?? p.price_in_cents
}

export default function StorePage() {
  const store = useOutletContext<Store>()
  const products = usePublicProducts(store.id)
  const addItem = useCartStore((s) => s.addItem)

  useDocumentMeta({
    title: buildStoreTitle(store),
    description: buildStoreDescription(store),
  })

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY)

  // Memoize so the `?? []` fallback keeps a stable reference and the
  // dependent useMemos below don't recompute on every render.
  const list = useMemo(() => products.data ?? [], [products.data])
  const featuredProducts = useMemo(
    () => list.filter((p) => p.is_featured && p.is_active),
    [list],
  )

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of list) {
      if (!p.category) continue
      if (!seen.has(p.category)) seen.set(p.category, toTitleCase(p.category))
    }
    return Array.from(seen, ([key, label]) => ({ key, label }))
  }, [list])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = list
    if (selectedCategory !== ALL_CATEGORY) {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }
    const sorted = [...result]
    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => effective(a) - effective(b))
        break
      case 'price_desc':
        sorted.sort((a, b) => effective(b) - effective(a))
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        break
      case 'recent':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
    }
    return sorted
  }, [list, search, sort, selectedCategory])

  useEffect(() => {
    const q = search.trim()
    if (!q) return
    const timer = setTimeout(() => {
      track('search_performed', {
        store_id: store.id,
        search_term: q,
        result_count: filtered.length,
      })
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  if (products.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[800px] px-3 py-4 sm:px-6 sm:py-6">
        <Skeleton className="mb-4 h-11 rounded-2xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-lg" />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-[6px] sm:gap-[12px] lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="px-5 py-16">
        <EmptyState
          icon={PackageIcon}
          title="Catálogo em construção"
          description="Nenhum produto disponível no momento."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[800px] px-3 py-4 sm:px-6 sm:py-6">
      {/* Em Destaque */}
      {featuredProducts.length > 0 && !search && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-z-text">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-2 gap-[6px] sm:gap-[12px] lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                storeSlug={store.slug}
                onAdd={() => addItem(p)}
                featured
              />
            ))}
          </div>
        </section>
      )}

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={SearchIcon}
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-z-text-hint"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos..."
            className="h-11 w-full rounded-2xl border border-z-border bg-white pl-10 pr-4 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
          />
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex w-max items-center gap-2">
            <span className="mr-1 shrink-0 text-[13px] font-semibold text-z-text-muted">
              Categorias:
            </span>
            <CategoryChip
              label="Todos"
              active={selectedCategory === ALL_CATEGORY}
              onClick={() => setSelectedCategory(ALL_CATEGORY)}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.key}
                label={c.label}
                active={selectedCategory === c.key}
                onClick={() => setSelectedCategory(c.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Nenhum produto encontrado"
          description={search ? `Não encontramos resultados para "${search}".` : 'Tente outro filtro.'}
          className="mt-5"
        />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-[6px] sm:gap-[12px] lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              storeSlug={store.slug}
              onAdd={() => addItem(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors',
        active
          ? 'border-transparent text-white'
          : 'border-z-border bg-white text-z-text-muted hover:bg-z-sand',
      )}
      style={
        active
          ? { background: 'var(--store-primary)' }
          : undefined
      }
    >
      {label}
    </button>
  )
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (next: SortKey) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ordenar"
        className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-z-border bg-white px-3.5 text-sm font-medium text-z-text-muted focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 sm:px-5"
      >
        <HugeiconsIcon icon={Sorting01Icon} size={16} />
        <span className="hidden sm:inline">{SORT_LABELS[value]}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Ordenar por">
        <div className="flex flex-col gap-1">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange(k)
                setOpen(false)
              }}
              className={cn(
                'flex h-12 items-center justify-between rounded-xl px-3 text-sm font-medium',
                value === k ? 'bg-z-bg text-z-text' : 'text-z-text-muted hover:bg-z-bg',
              )}
            >
              {SORT_LABELS[k]}
              {value === k && (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-[#10b981]" />
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

