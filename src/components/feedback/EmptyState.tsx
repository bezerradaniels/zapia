import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: IconSvgElement
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border py-12 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg text-z-text-hint">
        <HugeiconsIcon icon={icon} size={28} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 px-6">
        <p className="text-sm font-semibold text-z-text">{title}</p>
        {description && <p className="text-xs text-z-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
