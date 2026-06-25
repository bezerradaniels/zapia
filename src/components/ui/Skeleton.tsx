import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-z-shimmer rounded-xl bg-[length:200%_100%]', className)}
      style={{
        backgroundImage:
          'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
      }}
      aria-hidden="true"
    />
  )
}
