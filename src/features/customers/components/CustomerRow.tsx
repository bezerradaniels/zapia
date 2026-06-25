import { HugeiconsIcon } from '@hugeicons/react'
import {
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import type { Customer } from '../types'

type Props = {
  customer: Customer
  onDetails: (customer: Customer) => void
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CustomerRow({ customer, onDetails }: Props) {
  const waHref = `https://wa.me/${customer.whatsapp_phone.replace('+', '')}`
  const colorClass = avatarColor(customer.name)

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-z-border bg-white px-4 py-3 transition-shadow hover:shadow-sm">
      {/* Avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
      >
        {customer.avatar_url ? (
          <img
            src={customer.avatar_url}
            alt={customer.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials(customer.name)
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight text-z-text">{customer.name}</p>
        {customer.tags.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-z-text-muted">
            {customer.tags.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir WhatsApp"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-z-text-hint transition-colors hover:bg-z-bg2 hover:text-[#10b981]"
        >
          <HugeiconsIcon icon={WhatsappIcon} size={18} />
        </a>
        <button
          type="button"
          onClick={() => onDetails(customer)}
          className="flex h-9 items-center justify-center rounded-xl border border-z-border px-3 text-xs font-semibold text-z-text-muted transition-colors hover:border-z-green hover:text-z-text"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}
