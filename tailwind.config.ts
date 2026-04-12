import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds — dark-first design
        background: {
          DEFAULT: "#0a0a0a",
          secondary: "#111111",
          tertiary: "#1a1a1a",
          card: "#222222",
          overlay: "rgba(0,0,0,0.75)",
        },

        // Primary — electric green (energy / health / life)
        primary: {
          DEFAULT: "#00ff88",
          hover: "#00e67a",
          active: "#00cc6a",
          muted: "rgba(0,255,136,0.15)",
          glow: "rgba(0,255,136,0.35)",
        },

        // Accent — cyan-blue (tech / scan feel)
        accent: {
          DEFAULT: "#00d4ff",
          hover: "#00bde8",
          muted: "rgba(0,212,255,0.15)",
          glow: "rgba(0,212,255,0.35)",
        },

        // Semantic states
        danger: {
          DEFAULT: "#ff4444",
          hover: "#e63e3e",
          muted: "rgba(255,68,68,0.15)",
        },
        warning: {
          DEFAULT: "#ffaa00",
          hover: "#e69900",
          muted: "rgba(255,170,0,0.15)",
        },
        success: {
          DEFAULT: "#00ff88",
          hover: "#00e67a",
          muted: "rgba(0,255,136,0.15)",
        },

        // Text scale
        text: {
          primary: "#ffffff",
          secondary: "#a0a0a0",
          tertiary: "#6b6b6b",
          disabled: "#444444",
          inverse: "#0a0a0a",
        },

        // Border scale
        border: {
          DEFAULT: "#2a2a2a",
          subtle: "#1e1e1e",
          strong: "#3a3a3a",
          focus: "#00ff88",
        },

        // Surface elevations (glassmorphism helpers)
        surface: {
          1: "rgba(255,255,255,0.03)",
          2: "rgba(255,255,255,0.06)",
          3: "rgba(255,255,255,0.09)",
          4: "rgba(255,255,255,0.12)",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        heading: ["var(--font-rajdhani)", ...fontFamily.sans],
        display: ["var(--font-orbitron)", ...fontFamily.mono],
        mono: ["var(--font-jetbrains-mono)", ...fontFamily.mono],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1.05" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },

      fontWeight: {
        thin: "100",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },

      letterSpacing: {
        tightest: "-0.075em",
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0em",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.15em",
        "ultra-wide": "0.3em",
      },

      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },

      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
        "128": "32rem",
      },

      boxShadow: {
        // Green glow shadows
        "glow-sm": "0 0 8px rgba(0,255,136,0.25)",
        glow: "0 0 16px rgba(0,255,136,0.3)",
        "glow-md": "0 0 24px rgba(0,255,136,0.35)",
        "glow-lg": "0 0 40px rgba(0,255,136,0.4)",
        "glow-xl": "0 0 64px rgba(0,255,136,0.45)",

        // Accent cyan glow
        "accent-glow-sm": "0 0 8px rgba(0,212,255,0.25)",
        "accent-glow": "0 0 16px rgba(0,212,255,0.3)",
        "accent-glow-lg": "0 0 40px rgba(0,212,255,0.4)",

        // Danger glow
        "danger-glow": "0 0 16px rgba(255,68,68,0.35)",

        // Card / surface shadows
        "card-sm": "0 2px 8px rgba(0,0,0,0.4)",
        card: "0 4px 16px rgba(0,0,0,0.5)",
        "card-lg": "0 8px 32px rgba(0,0,0,0.6)",
        "card-xl": "0 16px 64px rgba(0,0,0,0.7)",

        // Inset
        "inner-sm": "inset 0 1px 2px rgba(0,0,0,0.3)",
        inner: "inset 0 2px 4px rgba(0,0,0,0.4)",
      },

      dropShadow: {
        "glow-green": ["0 0 8px rgba(0,255,136,0.5)", "0 0 16px rgba(0,255,136,0.25)"],
        "glow-cyan": ["0 0 8px rgba(0,212,255,0.5)", "0 0 16px rgba(0,212,255,0.25)"],
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)",
        "gradient-primary-subtle": "linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(0,212,255,0.1) 100%)",
        "gradient-dark": "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
        "gradient-card": "linear-gradient(135deg, #1a1a1a 0%, #111111 100%)",
        "scanline":
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 4px)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      keyframes: {
        // Pulsing green glow — used for active indicators, live metrics
        "pulse-green": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(0,255,136,0.3), 0 0 16px rgba(0,255,136,0.15)",
            opacity: "1",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3)",
            opacity: "0.85",
          },
        },

        // Horizontal scan line — tech / scanner aesthetic
        "scan-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },

        // Vertical progress bar fill animation
        "fill-up": {
          "0%": { transform: "scaleY(0)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(1)", transformOrigin: "bottom" },
        },

        // Number counter fade-in-up
        "count-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },

        // Slide in from bottom
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },

        // Slide in from right
        "slide-in-right": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },

        // Fade in
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        // Shimmer (skeleton loading)
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // Breathing ring for biometric displays
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },

        // Blink cursor
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },

        // Spin for loading
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },

      animation: {
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "pulse-green-fast": "pulse-green 1s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        "fill-up": "fill-up 0.8s ease-out forwards",
        "count-up": "count-up 0.4s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-out forwards",
        "slide-up-delay-1": "slide-up 0.3s ease-out 0.1s forwards",
        "slide-up-delay-2": "slide-up 0.3s ease-out 0.2s forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "fade-in": "fade-in 0.2s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        breathe: "breathe 4s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },

      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-in-expo": "cubic-bezier(0.7, 0, 0.84, 0)",
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
      },

      screens: {
        xs: "380px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },

      backdropBlur: {
        xs: "2px",
        "4xl": "72px",
      },

      gridTemplateColumns: {
        "auto-fill-card": "repeat(auto-fill, minmax(280px, 1fr))",
        "auto-fill-sm": "repeat(auto-fill, minmax(200px, 1fr))",
      },
    },
  },

  plugins: [
    forms({
      strategy: "class",
    }),
  ],
};

export default config;
