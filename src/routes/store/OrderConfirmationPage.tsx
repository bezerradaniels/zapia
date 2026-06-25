import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, WhatsappIcon } from '@hugeicons/core-free-icons'
import { buildStorePath } from '@/lib/tenant'
import { Button } from '@/components/ui'
import type { Store } from '@/types/domain'

type LocationState = { whatsappUrl?: string } | null

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const store = useOutletContext<Store>()
  const location = useLocation()
  const state = location.state as LocationState
  const whatsappUrl = state?.whatsappUrl

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-z-border bg-white p-8 text-center shadow-z">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-100 text-[#10b981]">
          <HugeiconsIcon icon={Tick02Icon} size={34} strokeWidth={3} />
        </div>
        <h1 className="text-[22px] font-bold tracking-tighter">Pedido registrado!</h1>
        {id && (
          <div
            className="mt-2 text-2xl font-bold"
            style={{ color: 'var(--store-primary)' }}
          >
            #{id.slice(0, 8)}
          </div>
        )}
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-z-text-muted">
          Seu pedido foi registrado e enviado para o WhatsApp da loja. Aguarde a
          confirmação.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {whatsappUrl ? (
            <Button variant="whatsapp" size="lg" fullWidth asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <HugeiconsIcon icon={WhatsappIcon} size={18} />
                Abrir WhatsApp
              </a>
            </Button>
          ) : (
            <p className="text-xs text-z-text-hint">
              Se a janela do WhatsApp não abriu, volte à loja e tente novamente.
            </p>
          )}
          <Button variant="ghost" size="lg" fullWidth asChild>
            <Link to={buildStorePath(store.slug)}>Continuar comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
