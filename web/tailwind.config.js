/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: "#eef2ff", 500: "#6366f1", 600: "#4f46e5" } },
      container: { center: true, padding: "1rem" },
    },
  },
  plugins: [],
};
