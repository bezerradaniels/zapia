import { useState } from 'react'
import { Button } from '@/components/ui'

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

/** Free-text tag list for the "Personalizado" delivery area scope —
 * lets the lojista add cities/regions not covered by the preset options. */
export function DeliveryAreaCustomLocations({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...value, v])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-z-border bg-z-bg p-3">
      <p className="text-xs text-z-text-muted">Adicione as cidades e regiões para onde você entrega.</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            add()
          }}
          placeholder="Ex.: Zona Sul, Niterói..."
          className="h-10 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm outline-none focus:border-z-green"
        />
        <Button type="button" variant="ghost" size="sm" onClick={add}>
          Adicionar
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((loc, i) => (
            <span
              key={`${loc}-${i}`}
              className="flex items-center gap-1.5 rounded-full border border-z-border bg-white px-3 py-1 text-xs font-medium text-z-text"
            >
              {loc}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-z-text-hint hover:text-z-text"
                aria-label={`Remover ${loc}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
