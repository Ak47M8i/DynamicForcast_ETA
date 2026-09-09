/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          navy: '#0b2545',
          blue: '#134074',
          accent: '#1d8cf8',
          yellow: '#f59e0b',
          crimson: '#dc2626',
          slate: '#0f172a',
          card: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
