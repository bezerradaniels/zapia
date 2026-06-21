import { cn } from '@/lib/utils'

type Option = { value: string; label: string }

type Props = {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

/** Same visual language as RoundMultiCheck, but enforces a single selection
 * (radio behavior) instead of a checklist. */
export function RoundSingleCheck({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
              checked
                ? 'border-[#11b981] bg-[#11b981]/10'
                : 'border-slate-300 bg-white hover:border-z-ink/20',
            )}
          >
            <span
              className={cn(
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                checked ? 'border-[#11b981]' : 'border-slate-300',
              )}
            >
              {checked && <span className="h-2.5 w-2.5 rounded-full bg-[#11b981]" />}
            </span>
            <span className={cn('text-sm font-medium', checked ? 'text-[#11b981]' : 'text-z-text')}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
