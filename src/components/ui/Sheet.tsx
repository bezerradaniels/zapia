import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onOpenChange, title, children, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]',
    )
    firstFocusable?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onOpenChange])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-[rgba(20,20,20,.42)]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-[26px] bg-white pb-[max(18px,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-[26px]',
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-z-border sm:hidden" />
        {title && (
          <div className="flex items-center justify-between px-5 pt-3">
            <h2 className="text-base font-bold tracking-tight text-z-text">{title}</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg2"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
