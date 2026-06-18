import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon, SearchIcon, ArrowDownIcon, StarIcon } from '@hugeicons/core-free-icons'
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

  if (products.isLoading) {
    return (
      <div className="px-5 py-12 text-center text-sm text-z-text-muted">
        Carregando produtos...
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
          <HugeiconsIcon icon={PackageIcon} size={26} />
        </div>
        <h2 className="text-base font-semibold">Catálogo em construção</h2>
        <p className="mt-1 text-sm text-z-text-muted">
          Nenhum produto disponível no momento.
        </p>
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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
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
            className="h-11 w-full rounded-2xl border border-[#cbd5e1] bg-white pl-10 pr-4 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
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
        <p className="py-12 text-center text-sm text-z-text-muted">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
        'shrink-0 rounded-lg border px-4 py-1.5 text-[13px] font-semibold transition-colors',
        active
          ? 'border-transparent text-white'
          : 'border-[#cbd5e1] bg-white text-z-text-muted hover:bg-z-bg2',
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
  return (
    <div className="relative inline-flex shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Ordenar"
        className="h-11 w-11 appearance-none rounded-2xl border border-[#cbd5e1] bg-white text-sm font-medium opacity-0 focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 sm:w-auto sm:pl-5 sm:pr-10 sm:opacity-100"
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
      {/* Mobile: icon-only handle behind the (transparent) select */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border border-[#cbd5e1] bg-white sm:hidden">
        <HugeiconsIcon icon={ArrowDownIcon} size={16} className="text-z-text-muted" />
      </div>
      {/* Desktop: caret */}
      <HugeiconsIcon
        icon={ArrowDownIcon}
        size={14}
        className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-z-text-hint sm:block"
      />
    </div>
  )
}

