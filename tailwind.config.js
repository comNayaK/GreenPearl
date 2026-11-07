/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#0a0b10", // deep rich black background
          900: "#12151f", // primary card surface
          850: "#181c2a", // elevated card surface
          800: "#222738", // interactive hover surface
          750: "#2d354d", // standard border
          700: "#3f4a6b", // high-contrast sketch border
          600: "#55638a",
          500: "#7583ab",
        },
        accent: {
          // Signature Mustard Yellow (warm, radiant, lightweight)
          yellow: "#f59e0b",
          yellowLight: "#fbbf24",
          yellowDark: "#d97706",
          mustard: "#f59e0b",
          mustardLight: "#fbbf24",
          // Balanced Pastel Mint Green (success, safe, innocent)
          green: "#4ade80",
          greenLight: "#86efac",
          greenDark: "#22c55e",
          // Balanced Pastel Coral Red (danger, imposter, alert)
          red: "#f87171",
          redLight: "#fca5a5",
          redDark: "#ef4444",
          // Aliases mapped cleanly to yellow, green, red
          lavender: "#f59e0b",
          lavenderLight: "#fbbf24",
          lavenderDark: "#d97706",
          purple: "#f59e0b",
          rose: "#f87171",
          blue: "#7dd3fc",
          sky: "#38bdf8",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "0.75rem",
        lg: "0.5rem",
      },
    },
  },
  plugins: [],
};
