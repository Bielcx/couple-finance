import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0d12",
        surface: "#151821",
        border: "#232735",
        primary: "#6366f1",
        income: "#22c55e",
        expense: "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;
