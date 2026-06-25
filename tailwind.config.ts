import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Zapia brand tokens */
        z: {
          primary: '#020617',
          red: '#dc2626',
          white: '#ffffff',
          green: '#07feda',
          'green-hover': '#0ab89e',
          'green-bg': '#e8fcf9',
          'green-fg': '#0f574c',
          lime: '#07feda',
          'lime-fg': '#052e28',
          lilac: '#e8fcf9',
          'lilac-fg': '#0f574c',
          rose: '#fee2e2',
          'rose-fg': '#dc2626',
          sky: '#dbeafe',
          'sky-fg': '#1e40af',
          amber: '#fde68a',
          'amber-fg': '#b45309',
          /* Warm off-white palette (handoff: painel/onboarding) */
          bg: '#f9f6f2',
          bg2: '#ffffff',
          sand: '#f4eee5',
          'sand-deep': '#efe7da',
          'store-bg': '#f1f5f9',
          ink: '#141414',
          text: '#141414',
          'text-muted': '#7c766c',
          'text-hint': '#9a948a',
          border: '#e2e8f0',
          sidebar: '#e2e8f0',
          'sidebar-icon': '#7c766c',
          whatsapp: '#34d399',
          'whatsapp-fg': '#020617',
        },
        /* Per-store dynamic primary (catalog theme) */
        'store-primary': 'var(--color-primary)',
        'store-primary-fg': 'var(--color-primary-fg)',
        'store-primary-hover': 'var(--color-primary-hover)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['DM Sans', ...fontFamily.sans],
        display: ['DM Sans', ...fontFamily.sans],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        tight: '-0.015em',
      },
      boxShadow: {
        z: 'none',
        'z-lg': 'none',
        'z-pop': 'none',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'z-shimmer': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'z-shimmer': 'z-shimmer 1.25s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
}

export default config
