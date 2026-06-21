import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon } from '@hugeicons/core-free-icons'

type AiGenerateButtonProps = {
  /** Whether the store's plan includes AI helpers. */
  canUse: boolean
  isLoading: boolean
  onClick: () => void
}

/** "Gerar com IA" button shown next to AI-assisted fields. Disabled with an
 * upsell hint when the store's plan doesn't include AI helpers. */
export function AiGenerateButton({ canUse, isLoading, onClick }: AiGenerateButtonProps) {
  if (!canUse) {
    return (
      <span
        title="Disponível nos planos Pro e Premium"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-z-text-hint opacity-50"
      >
        <HugeiconsIcon icon={AiMagicIcon} size={14} />
        Gerar com IA
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-purple-500 transition-colors hover:bg-z-bg2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <HugeiconsIcon icon={AiMagicIcon} size={14} />
      {isLoading ? 'Gerando...' : 'Gerar com IA'}
    </button>
  )
}
