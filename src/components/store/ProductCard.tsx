import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PackageIcon,
  ShoppingBagAddIcon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import type { Product } from '@/types/domain'
import { discountPercent } from '@/features/products/utils/price'
import { useCartStore, buildCartKey } from '@/features/cart'
import { formatMoney, toTitleCase } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buildStorePath } from '@/lib/tenant'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ROUTES } from '@/config/routes'
import { useStoreOwnerMode } from '@/routes/store/storeOwnerMode'

export function ProductCard({
  product: p,
  storeSlug,
  onAdd,
  featured = false,
}: {
  product: Product
  storeSlug: string
  onAdd: () => void
  featured?: boolean
}) {
  const discount = discountPercent(p)
  const finalPrice = p.promo_price_in_cents ?? p.price_in_cents
  const hasPromo = discount !== null
  const cartItems = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const isInCart = cartItems.some((item) => item.product.id === p.id)
  const { isOwner, ownerMode } = useStoreOwnerMode()
  const showEditOverlay = isOwner && ownerMode === 'lojista'

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: '#cbd5e1' }}
    >
      {showEditOverlay && (
        <Link
          to={`${ROUTES.dashboardProducts}?edit=${p.id}`}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-z-ink shadow-sm ring-1 ring-black/10 backdrop-blur-sm hover:bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={Edit01Icon} size={11} />
          Editar
        </Link>
      )}
      {featured && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <HugeiconsIcon icon={StarIcon} size={10} />
          Destaque
        </div>
      )}
      <Link to={buildStorePath(storeSlug, `produto/${p.slug}`)} className="block flex-1">
        <div className="relative aspect-square w-full overflow-hidden">
          {p.images[0] ? (
            <OptimizedImage
              src={p.images[0]}
              transform={{ width: 600, quality: 85 }}
              alt={p.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center text-z-text-hint"
              style={{ backgroundColor: '#f9f6f2' }}
            >
              <HugeiconsIcon icon={PackageIcon} size={36} />
              <span className="mt-2 text-xs">produto sem imagem</span>
            </div>
          )}
        </div>

        <div className="mt-3 px-3">
          <h3 className="line-clamp-2 min-h-[1.5em] text-[12px] font-extrabold leading-tight tracking-tight text-z-ink">
            {toTitleCase(p.name)}
          </h3>

          <div className="mt-[22px] flex flex-col gap-0.5">
            {hasPromo && (
              <span className="text-[12px] text-z-text-hint line-through">
                {formatMoney(p.price_in_cents)}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {finalPrice === 0 ? (
                <span className="text-[13px] font-medium leading-none text-z-text-hint">
                  Valor a combinar
                </span>
              ) : (
                <span className="text-[16px] font-extrabold leading-none text-z-ink">
                  <span className="text-[12px]">R$&nbsp;</span>
                  {formatMoney(finalPrice).replace(/^R\$[\s ]+/, '')}
                </span>
              )}
              {hasPromo && (
                <span className="rounded-md bg-[#e8f8ef] px-1.5 py-0.5 text-[11px] font-bold text-[#02a650]">
                  {discount}% OFF
                </span>
              )}
            </div>
            {p.installment_count != null && p.installment_total_in_cents != null && (
              <span className="text-[11px] text-z-text-muted">
                <span className="font-semibold text-z-ink">{p.installment_count}x </span>
                <span className="font-semibold text-z-ink">
                  {formatMoney(Math.ceil(p.installment_total_in_cents / p.installment_count))}
                </span>
                {p.installment_total_in_cents <= finalPrice && (
                  <span className="text-[#02a650]"> sem juros</span>
                )}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-auto px-3 pb-3">
        {p.has_variations ? (
          <Link
            to={buildStorePath(storeSlug, `produto/${p.slug}`)}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--store-primary)' }}
          >
            Ver mais
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAdd()
              }}
              className={cn(
                'mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-bold text-white transition-all active:scale-[0.98]',
                isInCart ? 'bg-gray-200 text-gray-600' : 'hover:opacity-90',
              )}
              style={!isInCart ? { background: 'var(--store-primary)' } : undefined}
            >
              {isInCart ? (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-400">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-white" />
                  </div>
                  Adicionado
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={ShoppingBagAddIcon} size={18} />
                  Adicionar
                </>
              )}
            </button>
            {isInCart && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeItem(buildCartKey(p.id, null))
                }}
                className="mt-2 block w-full text-center text-xs text-red-500 hover:text-red-600"
              >
                Remover
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}
