/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        "hex-dark": "#0a0a1a",
        "hex-purple": "#7c4dff",
        "hex-blue": "#0d47a1",
        "hex-gold": "#ffd700",
        "hex-cyan": "#00e5ff",
        "hex-card": "#1a1a2e",
        "hex-border": "#2a2a4a",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        "noto-sans": ["Noto Sans SC", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "card-glow": "card-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(124, 77, 255, 0.5), 0 0 20px rgba(124, 77, 255, 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(124, 77, 255, 0.8), 0 0 40px rgba(124, 77, 255, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "card-glow": {
          "0%, 100%": { borderColor: "rgba(124, 77, 255, 0.3)" },
          "50%": { borderColor: "rgba(124, 77, 255, 0.8)" },
        },
      },
      backgroundImage: {
        "hex-gradient": "linear-gradient(135deg, #7c4dff 0%, #0d47a1 50%, #00e5ff 100%)",
        "gold-gradient": "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
        "card-gradient": "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      },
    },
  },
  plugins: [],
};
