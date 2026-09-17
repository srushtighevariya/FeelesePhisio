import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Clinic Design System ───────────────────────────────
        page:    "#EDE9E1",   // warm cream page background
        card:    "#DDD5C7",   // primary card surface
        dark:    "#16181D",   // dark contrast panels / sidebar
        accent:  "#F2924A",   // warm amber CTA / active state
        // Status colours
        status: {
          completed:  "#22C55E",  // green
          scheduled:  "#EAB308",  // yellow
          cancelled:  "#EF4444",  // red
          missed:     "#9CA3AF",  // grey/white
        },
        // Neutral palette
        ink: {
          primary:    "#1A1A1A",
          secondary:  "#4B4B4B",
          muted:      "#9B9B9B",
          faint:      "#D4CFC6",
        },
        // Aliases for shadcn / component compatibility
        background: "#EDE9E1",
        foreground: "#1A1A1A",
        primary: {
          DEFAULT:    "#F2924A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT:    "#DDD5C7",
          foreground: "#1A1A1A",
        },
        muted: {
          DEFAULT:    "#EDE9E1",
          foreground: "#9B9B9B",
        },
        border:     "#D4CFC6",
        input:      "#D4CFC6",
        ring:       "#F2924A",
        destructive: {
          DEFAULT:    "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        // ─── Pill-shaped UI ─────────────────────────────────────
        card:   "28px",
        cardLg: "32px",
        pill:   "9999px",
        lg:     "16px",
        md:     "12px",
        sm:     "8px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["monospace"],
      },
      boxShadow: {
        card:  "0 2px 16px 0 rgba(22,24,29,0.06)",
        panel: "0 4px 32px 0 rgba(22,24,29,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
