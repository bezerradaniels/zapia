import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Zapia brand tokens - Modern Emerald & WhatsApp palette */
        z: {
          primary: "#0f172a",
          red: "#ef4444",
          white: "#ffffff",
          green: "#10b981",
          "green-hover": "#059669",
          "green-bg": "#ecfdf5",
          "green-fg": "#065f46",
          lime: "#10b981",
          "lime-fg": "#022c22",
          lilac: "#f1f5f9",
          "lilac-fg": "#334155",
          rose: "#ffe4e6",
          "rose-fg": "#e11d48",
          sky: "#e0f2fe",
          "sky-fg": "#0369a1",
          amber: "#fef3c7",
          "amber-fg": "#b45309",
          /* Clean neutral palette */
          bg: "#f8fafc",
          bg2: "#ffffff",
          sand: "#f1f5f9",
          "sand-deep": "#e2e8f0",
          "store-bg": "#f8fafc",
          ink: "#0f172a",
          text: "#0f172a",
          "text-muted": "#64748b",
          "text-hint": "#94a3b8",
          border: "#e2e8f0",
          sidebar: "#f8fafc",
          "sidebar-icon": "#64748b",
          whatsapp: "#25d366",
          "whatsapp-fg": "#ffffff",
          "whatsapp-dark": "#128c7e",
        },
        /* Per-store dynamic primary (catalog theme) */
        "store-primary": "var(--color-primary)",
        "store-primary-fg": "var(--color-primary-fg)",
        "store-primary-hover": "var(--color-primary-hover)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "0.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", ...fontFamily.sans],
        display: ['"Plus Jakarta Sans"', "Inter", ...fontFamily.sans],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
      },
      boxShadow: {
        z: "none",
        "z-lg": "none",
        "z-pop": "none",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "z-shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "z-shimmer": "z-shimmer 1.25s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
