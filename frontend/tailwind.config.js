/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "IBM Plex Arabic", "Noto Naskh Arabic", "Cairo", "Tajawal", "Segoe UI", "Tahoma", "Arial", "system-ui", "sans-serif"],
        arabic: ["IBM Plex Arabic", "Noto Naskh Arabic", "Cairo", "Tajawal", "Segoe UI", "Tahoma", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
