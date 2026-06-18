import { useRef, useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, BarCode02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 500

interface Props {
  onDebouncedChange: (value: string) => void
  onBarcodeScanClick: () => void
  isLoading: boolean
  disabled?: boolean
  initialValue?: string
}

export function SearchInput({
  onDebouncedChange,
  onBarcodeScanClick,
  isLoading,
  disabled,
  initialValue = '',
}: Props) {
  const [raw, setRaw] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When a barcode is scanned externally, the parent sets initialValue. Sync it.
  useEffect(() => {
    if (initialValue && initialValue !== raw) {
      setRaw(initialValue)
      onDebouncedChange(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setRaw(value)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onDebouncedChange(value.trim())
    }, DEBOUNCE_MS)
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        <input
          type="search"
          value={raw}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Nome do produto, marca ou código de barras…"
          className={cn(
            'w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-10 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      </div>

      <button
        type="button"
        onClick={onBarcodeScanClick}
        disabled={disabled}
        title="Escanear código de barras"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input',
          'bg-background text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <HugeiconsIcon icon={BarCode02Icon} className="h-5 w-5" />
      </button>
    </div>
  )
}
