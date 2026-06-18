// Barcode scanner overlay using html5-qrcode.
// Opens the device camera to scan EAN/GTIN barcodes.
// The library is loaded lazily so it doesn't affect initial bundle size.

import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface Props {
  onDetected: (barcode: string) => void
  onClose: () => void
}

const SCANNER_ELEMENT_ID = 'zapia-barcode-scanner'

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting')
  // Holds the Html5QrcodeScanner instance so we can stop it on unmount
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null)

  useEffect(() => {
    let mounted = true

    async function initScanner() {
      try {
        // Dynamic import keeps html5-qrcode out of the main bundle
        const { Html5QrcodeScanner, Html5QrcodeScanType } = await import('html5-qrcode')

        if (!mounted) return

        const scanner = new Html5QrcodeScanner(
          SCANNER_ELEMENT_ID,
          {
            fps: 10,
            qrbox: { width: 260, height: 120 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            aspectRatio: 1.5,
          },
          /* verbose = */ false,
        )

        scanner.render(
          (decodedText: string) => {
            // Only accept barcode formats (EAN-8, EAN-13, UPC-A, Code128, etc.)
            const digits = decodedText.replace(/\D/g, '')
            if (digits.length >= 8) {
              scanner.clear().catch(console.error)
              onDetected(decodedText.trim())
            }
          },
          () => {
            // Scan error / no match — ignore, scanner keeps trying
          },
        )

        scannerRef.current = scanner
        if (mounted) setStatus('scanning')
      } catch (err) {
        if (!mounted) return
        setError('Câmera não disponível ou permissão negada.')
        setStatus('error')
        console.error('[BarcodeScanner]', err)
      }
    }

    initScanner()

    return () => {
      mounted = false
      scannerRef.current?.clear().catch(console.error)
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm rounded-xl bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Escanear código de barras</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="p-4">
          {status === 'starting' && (
            <div className="flex h-48 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {status === 'error' && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-destructive">
              <p>{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              >
                Fechar
              </button>
            </div>
          )}

          {/* html5-qrcode renders directly into this div */}
          <div
            id={SCANNER_ELEMENT_ID}
            className={cn(
              'overflow-hidden rounded-lg',
              status !== 'scanning' && 'hidden',
            )}
          />
        </div>

        <p className="px-4 pb-4 text-center text-xs text-muted-foreground">
          Aponte a câmera para o código de barras do produto
        </p>
      </div>
    </div>
  )
}
