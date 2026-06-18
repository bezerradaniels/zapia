import { HugeiconsIcon } from '@hugeicons/react'
import { Download02Icon, ExternalLink } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import type { MlProductResult } from '../../types'

interface Props {
  result: MlProductResult
  isImporting: boolean
  onImport: (result: MlProductResult) => void
}

export function ResultCard({ result, isImporting, onImport }: Props) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border bg-card p-3 transition-colors',
        'hover:border-primary/40 hover:bg-accent/30',
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt={result.title}
            className="h-full w-full object-contain p-1"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        {result.source === 'catalog' && (
          <span className="absolute left-0.5 top-0.5 rounded bg-primary px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-primary-foreground">
            Catálogo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-snug" title={result.title}>
            {result.title}
          </p>
          {result.brand && (
            <p className="text-xs text-muted-foreground">{result.brand}</p>
          )}
          {result.barcode && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {result.barcode}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onImport(result)}
            disabled={isImporting}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground',
              'transition-opacity hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isImporting ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            ) : (
              <HugeiconsIcon icon={Download02Icon} className="h-3 w-3" />
            )}
            {isImporting ? 'Importando…' : 'Importar'}
          </button>

          {result.permalink && (
            <a
              href={result.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ExternalLink} className="h-3 w-3" />
              Ver no ML
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
