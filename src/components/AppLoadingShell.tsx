/**
 * Full-screen loading state shown during the very first paint (before the
 * route's lazy chunk and data have arrived). The markup here is mirrored
 * (not reused — it can't be, it renders before any JS executes) by the
 * static shell baked into index.html, so there is no flash between:
 * static HTML paint -> Suspense fallback -> real content.
 */
export function AppLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-z-bg">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-z-border border-t-z-green" />
      <span className="text-sm font-medium text-z-text-muted">Carregando...</span>
    </div>
  )
}
