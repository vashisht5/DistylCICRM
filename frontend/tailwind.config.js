/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0eeff',
          100: '#e4e0ff',
          200: '#ccc4ff',
          300: '#aa9dff',
          400: '#8471ff',
          500: '#5D4EE7',
          600: '#4f3dd4',
          700: '#422fb9',
          800: '#372896',
          900: '#2f2479',
          950: '#1c1552',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
