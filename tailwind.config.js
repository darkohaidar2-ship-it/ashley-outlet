/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kurdish: ['Rabar', 'Noto Sans Arabic', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ashley: {
          red: '#c0392b',
          dark: '#1e293b',
          light: '#f8fafc',
          accent: '#e74c3c'
        }
      }
    },
  },
  plugins: [],
}
