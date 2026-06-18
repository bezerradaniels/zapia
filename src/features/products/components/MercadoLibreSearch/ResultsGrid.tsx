import { ResultCard } from './ResultCard'
import type { MlProductResult } from '../../types'

interface Props {
  results: MlProductResult[]
  isLoading: boolean
  isEmpty: boolean
  isError: boolean
  importingId: string | null
  onImport: (result: MlProductResult) => void
}

export function ResultsGrid({
  results,
  isLoading,
  isEmpty,
  isError,
  importingId,
  onImport,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Erro ao buscar no Mercado Livre. Verifique sua conexão e tente novamente.
      </p>
    )
  }

  if (isEmpty) {
    return (
      <p className="rounded-lg border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum produto encontrado no catálogo do Mercado Livre.
        <br />
        <span className="text-xs">Tente um nome diferente ou adicione o produto manualmente.</span>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((result) => (
        <ResultCard
          key={result.mlId}
          result={result}
          isImporting={importingId === result.mlId}
          onImport={onImport}
        />
      ))}
    </div>
  )
}
