import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "scan-line": "scan-line 4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        "in": "in 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "zoom-in": "zoom-in 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "spin": "spin 2s linear infinite",
        "spin-reverse": "spin-reverse 2s linear infinite",
        "spin-slow": "spin 3s linear infinite",
        "pulse": "pulse 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "scan-line": {
          "0%": { top: "0%", opacity: "0.8" },
          "45%": { top: "100%", opacity: "1" },
          "50%": { top: "100%", opacity: "0.8" },
          "95%": { top: "0%", opacity: "1" },
          "100%": { top: "0%", opacity: "0.8" }
        },
        "in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "zoom-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" }
        },
        "pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" }
        }
      },
      colors: {
        primary: "rgba(88, 101, 242, 1)",
        secondary: "rgba(45, 136, 255, 0.8)",
        accent: "#6EE7B7",
      }
    },
  },
  plugins: [],
};
export default config;
