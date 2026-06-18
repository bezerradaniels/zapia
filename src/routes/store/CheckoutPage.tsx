import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon, WhatsappIcon } from '@hugeicons/core-free-icons'
import type { Store } from '@/types/domain'
import { useCartStore } from '@/features/cart'
// Direct file import (not the '@/features/products' barrel) so this
// storefront page doesn't pull in ProductForm's dashboard-only weight.
import { effectivePrice } from '@/features/products/utils/price'
import { checkoutSchema, type CheckoutInput, useCreateOrder } from '@/features/orders'
import { formatMoney, toTitleCase } from '@/lib/format'
import { maskPhoneBR, validatePhoneBR } from '@/lib/br'
import { buildOrderMessage, buildWhatsAppLink } from '@/lib/whatsapp'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { Input } from '@/components/ui'
import { buildStorePath } from '@/lib/tenant'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function CheckoutPage() {
  const store = useOutletContext<Store>()

  useDocumentMeta({
    title: `Finalizar pedido - ${store.name}`,
    description: `Finalize seu pedido na ${store.name} e receba a confirmação pelo WhatsApp.`,
  })

  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotalInCents())
  const discount = useCartStore((s) => s.discountInCents())
  const total = useCartStore((s) => s.totalInCents())
  const coupon = useCartStore((s) => s.coupon)
  const clearCart = useCartStore((s) => s.clearCart)
  const createOrder = useCreateOrder()
  const homePath = buildStorePath(store.slug)
  const cartPath = buildStorePath(store.slug, 'carrinho')
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false)

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: '', phone: '', notes: '' },
  })

  const name = form.watch('name')
  const phone = form.watch('phone')
  const isFormComplete =
    name.trim().length >= 2 && validatePhoneBR(phone ?? '') && deliveryConfirmed

  if (items.length === 0) return <Navigate to={cartPath} replace />

  if (!store.whatsapp_phone) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
        <h1 className="text-lg font-bold tracking-tight">Loja indisponível</h1>
        <p className="text-sm text-z-text-muted">
          Esta loja ainda não configurou o WhatsApp para receber pedidos.
        </p>
        <Link to={homePath} className="text-sm font-medium text-[#10b981] hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!deliveryConfirmed) {
      form.setError('root', {
        message:
          'Confirme a forma de entrega para continuar. O pedido será finalizado pelo WhatsApp.',
      })
      return
    }

    try {
      const order = await createOrder.mutateAsync({
        storeId: store.id,
        customerName: values.name.trim(),
        customerPhone: values.phone,
        customerNotes: values.notes,
        items,
        totalInCents: total,
        coupon: coupon
          ? {
              id: coupon.id,
              code: coupon.code,
              discountInCents: coupon.discountInCents,
            }
          : null,
      })

      const message = buildOrderMessage({
        store: { name: store.name, slug: store.slug },
        items,
        customer: {
          name: values.name,
          phone: maskPhoneBR(values.phone),
          notes: values.notes,
        },
        totalInCents: total,
        coupon: coupon
          ? { code: coupon.code, discountInCents: coupon.discountInCents }
          : null,
      })
      const url = buildWhatsAppLink(store.whatsapp_phone!, message)

      clearCart()
      navigate(buildStorePath(store.slug, `pedido/${order.id}`), {
        replace: true,
        state: { whatsappUrl: url },
      })
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      form.setError('root', {
        message:
          err instanceof Error
            ? `Não conseguimos registrar o pedido: ${err.message}`
            : 'Não conseguimos registrar o pedido. Tente novamente.',
      })
    }
  })

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-5 pb-28 sm:px-6 sm:pb-8">
      <div className="mb-5 flex items-center gap-2">
        <Link
          to={cartPath}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
          aria-label="Voltar"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Finalizar pedido</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#cbd5e1' }}>
            <div className="mb-4 text-[15px] font-bold">Dados pessoais</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-z-text" htmlFor="checkout-name">
                  Nome completo
                  <span className="rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[11px] font-semibold text-[#02a650]">
                    Obrigatório
                  </span>
                </label>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  placeholder="Seu nome"
                  aria-invalid={!!form.formState.errors.name || undefined}
                  className="bg-z-bg border-[#cbd5e1]"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-sm font-medium text-z-text" htmlFor="checkout-phone">
                  WhatsApp
                  <span className="rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[11px] font-semibold text-[#02a650]">
                    Obrigatório
                  </span>
                </label>
                <PhoneInput
                  id="checkout-phone"
                  className="h-11 w-full rounded-lg border border-[#cbd5e1] bg-z-bg px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                  value={form.watch('phone') ?? ''}
                  onChange={(masked) =>
                    form.setValue('phone', masked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
                {form.formState.errors.phone && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#cbd5e1' }}>
            <div className="mb-3 flex items-center gap-1.5 text-[15px] font-bold">
              Confirmar forma de entrega
              <span className="rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[11px] font-semibold text-[#02a650]">
                Obrigatório
              </span>
            </div>
            <button
              type="button"
              aria-pressed={deliveryConfirmed}
              onClick={() => {
                setDeliveryConfirmed((current) => !current)
                form.clearErrors('root')
              }}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors"
              style={{
                background: deliveryConfirmed ? 'rgba(0,168,45,0.04)' : '#f8fafc',
                border: deliveryConfirmed
                  ? '2px solid var(--store-primary)'
                  : '1px solid #cbd5e1',
              }}
            >
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-white"
                style={{
                  borderColor: deliveryConfirmed
                    ? 'var(--store-primary)'
                    : 'var(--z-border, #e5e7eb)',
                }}
                aria-hidden="true"
              >
                {deliveryConfirmed && (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: 'var(--store-primary)' }}
                  />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">Combinar entrega pelo WhatsApp</div>
                <div className="mt-1 text-xs leading-relaxed text-z-text-muted">
                  Ao confirmar o pedido, você será direcionado para abrir o app do
                  WhatsApp com as informações do pedido preenchidas. Envie a mensagem
                  por lá para finalizar o pedido e combinar entrega, frete e prazo com
                  a loja.
                </div>
              </div>
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#cbd5e1' }}>
            <label className="mb-2 block text-sm font-medium text-z-text">
              Observação (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Algum detalhe especial para o pedido?"
              className="w-full resize-y rounded-lg border border-[#cbd5e1] bg-z-bg px-3.5 py-2.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
              {...form.register('notes')}
            />
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#cbd5e1' }}>
            <div className="mb-4 text-[15px] font-bold">Resumo do pedido</div>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              {items.map((item) => (
                <li
                  key={item.cartKey}
                  className="flex justify-between gap-2 text-z-text-muted"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {toTitleCase(item.product.name)} ×{item.quantity}
                    </span>
                    {item.selectedVariation && (
                      <span className="mt-0.5 w-fit rounded-full border border-z-border bg-z-bg px-2 py-px text-[11px] font-medium text-z-text">
                        {toTitleCase(item.selectedVariation)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold text-z-text tabular-nums">
                    {formatMoney(effectivePrice(item.product) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-z-border pt-3 text-[13px]">
              <div className="flex justify-between text-z-text-muted">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              {coupon && discount > 0 && (
                <div className="mt-1.5 flex justify-between text-[#10b981]">
                  <span>Cupom · {coupon.code}</span>
                  <span className="tabular-nums">−{formatMoney(discount)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between border-t border-z-border pt-3 text-base font-bold">
              <span>Total</span>
              <span className="font-bold text-z-text tabular-nums">
                {formatMoney(total)}
              </span>
            </div>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={createOrder.isPending || !isFormComplete}
              className="mt-4 hidden w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 sm:flex"
              style={{ background: '#34d399' }}
            >
              <HugeiconsIcon icon={WhatsappIcon} size={18} />
              {createOrder.isPending ? 'Registrando...' : 'Confirmar pedido'}
            </button>
          </div>
        </aside>
      </div>

      {/* Sticky bottom confirm — mobile only */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-z-border bg-white px-4 py-3 shadow-z-lg sm:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-z-text-hint">Total</div>
          <div className="text-[18px] font-bold tracking-tight text-z-text tabular-nums">
            {formatMoney(total)}
          </div>
        </div>
        <button
          type="submit"
          onClick={onSubmit}
          disabled={createOrder.isPending || !isFormComplete}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-[13px] font-bold uppercase tracking-wider text-white transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ background: '#34d399' }}
        >
          <HugeiconsIcon icon={WhatsappIcon} size={14} />
          {createOrder.isPending ? 'Enviando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
