import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#c2652a",
        "primary-container": "#e08850",
        "primary-fixed": "#fbe8d8",
        "primary-fixed-dim": "#f0a878",
        "on-primary": "#ffffff",
        "on-primary-container": "#fbe8d8",
        "on-primary-fixed": "#401a08",
        "on-primary-fixed-variant": "#8a4518",
        "inverse-primary": "#f0a878",

        secondary: "#78706a",
        "secondary-container": "#eae2da",
        "secondary-fixed": "#eae2da",
        "secondary-fixed-dim": "#cec6be",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#605850",

        tertiary: "#8c3c3c",
        "tertiary-container": "#d47070",
        "tertiary-fixed": "#fce0e0",
        "tertiary-fixed-dim": "#e8a0a0",
        "on-tertiary": "#ffffff",

        background: "#faf5ee",
        surface: "#faf5ee",
        "surface-bright": "#faf5ee",
        "surface-dim": "#dcd6cc",
        "surface-variant": "#ece6dc",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f0e8",
        "surface-container": "#f2ece4",
        "surface-container-high": "#ece6dc",
        "surface-container-highest": "#e6e0d6",
        "inverse-surface": "#3a302a",
        "inverse-on-surface": "#faf5ee",

        "on-surface": "#3a302a",
        "on-surface-variant": "#605850",
        "on-background": "#3a302a",

        outline: "#9a9088",
        "outline-variant": "#d8d0c8",

        error: "#c0392b",
        "error-container": "#fce4e0",
        "on-error": "#ffffff",

        text: {
          main: "#3a302a",
          muted: "#605850",
        },
      },
      fontFamily: {
        display: ["'EB Garamond'", "serif"],
        headline: ["'EB Garamond'", "serif"],
        body: ["'Manrope'", "sans-serif"],
        sans: ["'Manrope'", "sans-serif"],
        label: ["'Manrope'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(194, 101, 42, 0.25)" },
          "100%": { boxShadow: "0 0 30px rgba(194, 101, 42, 0.55)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
