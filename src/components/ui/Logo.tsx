import { HugeiconsIcon } from '@hugeicons/react'
import { ShoppingBagCheckIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'

type LogoVariant = 'ambos' | 'verde' | 'branca'

interface LogoProps {
  variant?: LogoVariant
  /** Use the white version (for dark backgrounds like the sidebar) */
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  height?: number
  className?: string
}

const heights: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
}

const iconSizes: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24,
  md: 28,
  lg: 36,
}

const textSizes: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ dark = false, variant, size = 'md', height: heightProp, className }: LogoProps) {
  const h = heightProp ?? heights[size]
  const iconSize = iconSizes[size]
  const textSize = textSizes[size]
  const isWhite = dark || variant === 'branca'

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  // Iridescent text-shadow dispersion (simulates diamond prism light splitting)
  // This guarantees the text NEVER disappears as the solid color is 100% preserved.
  const textStyle = isHovered && !isWhite
    ? {
        textShadow: `
          ${(mousePos.x - 50) * 0.08}px ${(mousePos.y - 50) * 0.08}px 2px rgba(255, 0, 127, 0.6), 
          ${(50 - mousePos.x) * 0.08}px ${(50 - mousePos.y) * 0.08}px 2px rgba(0, 255, 255, 0.6),
          0 0 4px rgba(127, 0, 255, 0.3)
        `,
        filter: 'saturate(1.4) brightness(1.1)',
        transition: 'text-shadow 0.1s ease, filter 0.3s ease',
      }
    : {
        transition: 'text-shadow 0.3s ease, filter 0.3s ease',
      }

  const iconStyle = isHovered && !isWhite
    ? {
        filter: `drop-shadow(0 0 4px rgba(0, 255, 255, 0.6)) drop-shadow(0 0 8px rgba(255, 0, 127, 0.4)) hue-rotate(${mousePos.x * 3.6}deg) saturate(1.5)`,
        transform: 'scale(1.05) rotate(3deg)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.15s ease',
      }
    : {
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.3s ease',
      }

  return (
    <div 
      ref={containerRef}
      className={cn('flex items-center gap-2 cursor-pointer select-none group', className)}
      style={{ height: h }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={iconStyle}>
        <HugeiconsIcon 
          icon={ShoppingBagCheckIcon} 
          size={iconSize}
          className={cn(isWhite ? 'text-white' : 'text-[#020617]')}
        />
      </div>
      <span 
        className={cn(
          'font-bold tracking-tight transition-all duration-300',
          textSize,
          isWhite ? 'text-white' : 'text-gray-900'
        )}
        style={textStyle}
      >
        Zap.IA
      </span>
    </div>
  )
}
