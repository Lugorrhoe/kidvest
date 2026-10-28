/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Noto Emoji'],
      },
      colors: {
        ink: { 50: '#f6f7f9', 100: '#eceef2', 200: '#d9dde4', 300: '#b6bdc9', 400: '#8a93a3', 500: '#646d7e', 600: '#4a5262', 700: '#363c49', 800: '#22262f', 900: '#14171d' },
        gain: '#0f9d58',
        loss: '#e5484d',
      },
      boxShadow: { card: '0 1px 2px rgba(20,23,29,.04), 0 4px 16px rgba(20,23,29,.06)' },
    },
  },
  plugins: [],
};
