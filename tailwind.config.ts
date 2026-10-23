import type { Config } from "tailwindcss";

// Tokens from replica/design/tokens.md — MProfit's layout, our own palette.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "#f6f4ee", // warm cream background
        surface: "#ffffff",
        sidebar: { DEFAULT: "#242a33", hover: "#313a46", text: "#cbd2dc" },
        brand: { DEFAULT: "#2f5d50", dark: "#244a40", soft: "#e7f0ec" },
        gain: "#1f9d6b",
        loss: "#d1495b",
        ink: "#1c2430",
        muted: "#6b7280",
        line: "#e7e4dc",
      },
      fontFamily: {
        serif: ["Georgia", "'Times New Roman'", "serif"],
      },
      borderRadius: { xl: "0.9rem" },
    },
  },
  plugins: [],
};
export default config;
