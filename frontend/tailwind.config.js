/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "IBM Plex Arabic", "Noto Naskh Arabic", "system-ui", "sans-serif"],
        arabic: ["IBM Plex Arabic", "Noto Naskh Arabic", "serif"],
      },
      colors: {
        ink: "#172033",
        sand: "#f7f3ec",
        copper: "#b77245",
        parchment: "#fbf7ef",
      },
      boxShadow: {
        glow: "0 20px 70px rgba(183, 114, 69, 0.22)",
        card: "0 24px 60px rgba(23, 32, 51, 0.08)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
