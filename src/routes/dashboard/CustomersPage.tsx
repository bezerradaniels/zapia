import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, UserGroupIcon, Add01Icon, FilterHorizontalIcon } from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCustomers } from '@/features/customers'
import { CustomerRow } from '@/features/customers/components/CustomerRow'
import { IntelligenceCards, type IntelligenceFilter } from '@/features/customers/components/IntelligenceCards'
import { AIPanel } from '@/features/customers/components/AIPanel'
import { ROUTES } from '@/config/routes'
import { Skeleton, Sheet, Button } from '@/components/ui'
import { EmptyState } from '@/components/feedback'
import type { Customer } from '@/features/customers/types'

export default function CustomersPage() {
  const navigate = useNavigate()
  const { store } = useActiveStore()
  const customers = useCustomers(store?.id)

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sellerFilter, setSellerFilter] = useState('')
  const [intelligenceFilter, setIntelligenceFilter] = useState<IntelligenceFilter | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = (tagFilter ? 1 : 0) + (sellerFilter ? 1 : 0)

  // Memoize so the `?? []` fallback keeps a stable reference and the
  // dependent useMemos below don't recompute on every render.
  const list = useMemo(() => customers.data ?? [], [customers.data])

  // Collect all unique tags across customers
  const allTags = useMemo(
    () => Array.from(new Set(list.flatMap((c) => c.tags))).sort(),
    [list],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.whatsapp_phone.includes(q.replace(/\D/g, ''))) {
        return false
      }
      if (tagFilter && !c.tags.includes(tagFilter)) return false
      if (sellerFilter && c.seller_id !== sellerFilter) return false
      return true
    })
  }, [list, search, tagFilter, sellerFilter])

  function handleDetails(customer: Customer) {
    navigate(`${ROUTES.dashboardCustomers}/${customer.id}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Intelligence cards */}
      <IntelligenceCards
        customers={list}
        activeFilter={intelligenceFilter}
        onFilterChange={(f) => setIntelligenceFilter(intelligenceFilter === f ? null : f)}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Main list panel */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-z-border bg-white p-5">
          {/* Filters row */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-z-primary"
              />
              <input
                type="search"
                placeholder="Pesquisar nos dados do cliente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-z-border bg-white pl-9 pr-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Filtros"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-z-border bg-white text-z-text-muted hover:bg-z-bg"
            >
              <HugeiconsIcon icon={FilterHorizontalIcon} size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-z-green text-[10px] font-bold text-z-ink">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboardCustomersNew)}
              aria-label="Novo cliente"
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-z-green px-4 text-sm font-semibold text-z-ink transition-opacity hover:opacity-90"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} />
              <span className="hidden sm:inline">Novo cliente</span>
            </button>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filtros">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-z-text-muted">Tag</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-11 rounded-xl border border-z-border bg-white px-3 text-sm text-z-text focus:border-z-green focus:outline-none"
                >
                  <option value="">Todas</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-z-text-muted">
                  Vendedor responsável
                </label>
                <input
                  type="text"
                  placeholder="Nome do vendedor"
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  className="h-11 rounded-xl border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                />
              </div>

              <Button
                fullWidth
                size="lg"
                variant="outline"
                onClick={() => {
                  setTagFilter('')
                  setSellerFilter('')
                }}
              >
                Limpar filtros
              </Button>
              <Button fullWidth size="lg" onClick={() => setFiltersOpen(false)}>
                Aplicar
              </Button>
            </div>
          </Sheet>

          {/* Count */}
          {!customers.isLoading && (
            <p className="text-sm font-medium text-z-text-muted">
              {filtered.length} {filtered.length === 1 ? 'encontrado' : 'encontrados'}
            </p>
          )}

          {/* List */}
          {customers.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[60px] rounded-2xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={UserGroupIcon}
              title="Ainda não há clientes"
              description="Cadastre o primeiro cliente ou aguarde pedidos chegarem pelo catálogo."
              action={
                <Button onClick={() => navigate(ROUTES.dashboardCustomersNew)}>
                  <HugeiconsIcon icon={Add01Icon} size={15} />
                  Novo cliente
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((c) => (
                <CustomerRow
                  key={c.id}
                  customer={c}
                  onDetails={handleDetails}
                />
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-z-text-muted">
                  Nenhum cliente encontrado para "{search}".
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI panel — hidden on mobile, sidebar on desktop */}
        <div className="hidden lg:block lg:w-72 lg:shrink-0">
          <AIPanel />
        </div>
      </div>
    </div>
  )
}
