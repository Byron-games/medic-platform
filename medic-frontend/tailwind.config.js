/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Dark mode palette
        void: '#080C14',
        cyan: { DEFAULT: '#00D9FF', dark: '#00B8D9' },
        charcoal: '#1A2035',
        // Light mode palette
        slate: { light: '#F8FAFC' },
        sky: { accent: '#0EA5E9' },
      },
    },
  },
  plugins: [],
}
