import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0712",
        surface: "#160f24",
        "surface-hover": "#1e1533",
        border: "#2a2044",
        primary: "#8b5cf6",
        "primary-hover": "#7c3aed",
        income: "#22c55e",
        expense: "#f43f5e",
        muted: "#a394c4",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139, 92, 246, 0.18), 0 8px 28px -6px rgba(139, 92, 246, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
