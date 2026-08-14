/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tuctac: {
          light: '#f4f9f6',
          green: '#1e5f37', // Túc Tắc Tea forest green
          dark: '#123e23',
          yellow: '#e6a15c',
          bg: '#fafdfb',
          accent: '#e2efeb',
        }
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
