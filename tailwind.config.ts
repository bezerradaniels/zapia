import type { Config } from "tailwindcss";
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
        /* Zapia brand tokens - Violet 400 Primary, Sky & Emerald Highlights */
        z: {
          primary: "#a78bfa",
          "primary-fg": "#18181a",
          "primary-hover": "#8b5cf6",
          red: "#ef4444",
          white: "#ffffff",
          green: "#4ade80",
          "green-hover": "#22c55e",
          "green-bg": "#f0fdf4",
          "green-fg": "#052e16",
          emerald: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            300: "#86efac",
            400: "#4ade80",
            500: "#22c55e",
          },
          sky: {
            50: "#f0f9ff",
            100: "#e0f2fe",
            200: "#bae6fd",
            300: "#7dd3fc",
            400: "#38bdf8",
            500: "#0ea5e9",
          },
          violet: {
            50: "#f5f3ff",
            100: "#ede9fe",
            200: "#ddd6fe",
            300: "#c4b5fd",
            400: "#a78bfa",
            500: "#8b5cf6",
          },
          purple: {
            50: "#faf5ff",
            100: "#f3e8ff",
            200: "#e9d5ff",
            300: "#d8b4fe",
            400: "#c084fc",
            500: "#a855f7",
          },
          lime: "#4ade80",
          "lime-fg": "#052e16",
          lilac: "#f5f3ff",
          "lilac-fg": "#2e1065",
          rose: "#ffe4e6",
          "rose-fg": "#e11d48",
          amber: "#fef3c7",
          "amber-fg": "#b45309",
          /* Clean neutral palette */
          bg: "#f8fafc",
          bg2: "#ffffff",
          sand: "#f1f5f9",
          "sand-deep": "#e2e8f0",
          "store-bg": "#f8fafc",
          ink: "#18181a",
          text: "#18181a",
          "text-muted": "#64748b",
          "text-hint": "#94a3b8",
          border: "#e2e8f0",
          sidebar: "#fbfbfb",
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
        sans: ['"Google Sans Flex"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        body: ['"Google Sans Flex"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        display: ['"Google Sans Flex"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        heading: ['"Google Sans Flex"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
      },
      boxShadow: {
        DEFAULT: "none",
        xs: "none",
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        none: "none",
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
