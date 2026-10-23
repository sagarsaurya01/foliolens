import type { Config } from "tailwindcss";

// Placeholder brand tokens — own colours, not MProfit's. replica-brand finalises.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0f766e", dark: "#115e59", soft: "#ecfdf5" }, // teal
        gain: "#1f9d6b",
        loss: "#dc2626",
        ink: "#111827",
        muted: "#6b7280",
        line: "#e5e7eb",
      },
      borderRadius: { xl: "0.9rem" },
    },
  },
  plugins: [],
};
export default config;
