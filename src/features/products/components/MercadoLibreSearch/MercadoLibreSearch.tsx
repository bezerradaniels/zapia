// MercadoLibreSearch
//
// A modal panel that lets the lojista search the Mercado Livre Brazil catalog
// by product name, brand, or EAN/GTIN barcode and import data into the
// product creation form with a single click.
//
// Usage:
//   <MercadoLibreSearch storeId={storeId} onImport={handleMlImport} onClose={() => setOpen(false)} />
//
// The `onImport` callback receives a fully-typed `MlImportPayload` with:
//   - name, brand, description (structured attributes as HTML list)
//   - images (Supabase Storage URLs — already persisted)
//   - barcode + barcode_type
//
// Price and stock are intentionally left out — the lojista fills those manually.

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { SearchInput } from './SearchInput'
import { BarcodeScanner } from './BarcodeScanner'
import { ResultsGrid } from './ResultsGrid'
import { useMercadoLibreSearch } from '../../hooks/useMercadoLibreSearch'
import { useMercadoLibreImport } from '../../hooks/useMercadoLibreImport'
import type { MlImportPayload, MlProductResult } from '../../types'

interface Props {
  storeId: string
  onImport: (payload: MlImportPayload) => void
  onClose: () => void
}

export function MercadoLibreSearch({ storeId, onImport, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>()
  const [importingId, setImportingId] = useState<string | null>(null)

  const { results, isLoading, isEmpty, isError } = useMercadoLibreSearch({ query })

  const importMutation = useMercadoLibreImport({
    storeId,
    onSuccess: (payload) => {
      onImport(payload)
      onClose()
    },
  })

  function handleBarcodeScan(barcode: string) {
    setScannerOpen(false)
    setScannedBarcode(barcode)
    setQuery(barcode)
  }

  async function handleImport(result: MlProductResult) {
    setImportingId(result.mlId)
    try {
      await importMutation.mutateAsync({ result, searchedBarcode: scannedBarcode })
    } finally {
      setImportingId(null)
    }
  }

  const showResults = query.trim().length >= 2

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Importar do Mercado Livre"
        className="fixed inset-x-4 top-[10%] z-[90] mx-auto flex max-h-[80vh] max-w-lg flex-col rounded-xl bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Importar do Mercado Livre</p>
            <p className="text-xs text-muted-foreground">
              Busque por nome, marca ou código de barras
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Fechar"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="shrink-0 border-b px-4 py-3">
          <SearchInput
            onDebouncedChange={setQuery}
            onBarcodeScanClick={() => setScannerOpen(true)}
            isLoading={isLoading}
            initialValue={scannedBarcode}
          />
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {!showResults ? (
            <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
              <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Resultados com o badge <strong>Catálogo</strong> são produtos oficiais com dados
                verificados — prefira-os. Preço e estoque não são importados; preencha manualmente.
              </span>
            </div>
          ) : (
            <ResultsGrid
              results={results}
              isLoading={isLoading}
              isEmpty={isEmpty}
              isError={isError}
              importingId={importingId}
              onImport={handleImport}
            />
          )}
        </div>
      </div>

      {/* Barcode scanner overlay */}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  )
}
