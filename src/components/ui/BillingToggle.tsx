import { cn } from '@/lib/utils'

type Props = {
  value: 'monthly' | 'annual'
  onChange: (value: 'monthly' | 'annual') => void
  className?: string
}

export function BillingToggle({ value, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-[#475569] bg-z-bg p-1', className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-4 py-1.5 text-base font-medium transition-all',
          value === 'monthly'
            ? 'bg-[#10b981] text-white shadow-sm'
            : cn('text-z-text-muted hover:text-z-text', value === 'annual' && 'font-bold '),
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base font-medium transition-all',
          value === 'annual'
            ? 'bg-[#10b981] text-white shadow-sm'
            : cn('text-z-text-muted hover:text-z-text', value === 'monthly' && 'font-bold '),
        )}
      >
        Anual
        <span className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
          value === 'annual'
            ? 'bg-white/20 text-white'
            : 'bg-[#10b981]/10 text-[#10b981]',
        )}>
          até -30%
        </span>
      </button>
    </div>
  )
}
