/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette extracted from the Brain Food logo SVG
        // Primary: #d85162 (deep rose/berry), derived from logo fill colors
        brand: {
          50:  "#fff8f9",
          100: "#ffe8ec",
          200: "#ffd0d9",
          300: "#f2c3cc",  // SVG light blush
          400: "#e7879c",  // SVG medium rose
          500: "#d85162",  // SVG deep rose — primary brand color
          600: "#c13353",
          700: "#9e2346",
          800: "#7a1a36",
          900: "#4f0e22",
          950: "#1d1a1a",  // SVG near-black
        },
        accent: {
          400: "#f5c97a",
          500: "#e9a84c",
          600: "#c4832a",
        },
        surface: {
          50:  "#FFFFFF",
          100: "#FAF7F8",
          200: "#F2EBEC",
          300: "#E8DEE0",
          400: "#D9CCCF",
        },
        // Dark backgrounds — warm charcoal from logo outline color (#1d1a1a)
        navy: {
          DEFAULT: "#1d1a1a",
          light: "#2d2426",
          dark: "#111010",
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        heading: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        drama:   ['"Cormorant Garamond"', "Georgia", "serif"],
        mono:    ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "3rem",
        "5xl": "4rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
