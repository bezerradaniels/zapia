import { cn } from '@/lib/utils'

type ListCardProps = {
  leading?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function ListCard({ leading, title, meta, trailing, onClick, className }: ListCardProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full min-h-[64px] items-center gap-3 rounded-2xl border border-z-border bg-white p-3 text-left transition-colors',
        onClick && 'hover:bg-z-bg active:bg-z-bg',
        className,
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-z-text">{title}</div>
        {meta && <div className="mt-0.5 truncate text-xs text-z-text-muted">{meta}</div>}
      </div>
      {trailing && <div className="flex shrink-0 flex-col items-end gap-1">{trailing}</div>}
    </Comp>
  )
}
