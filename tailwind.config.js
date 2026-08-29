/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backdropBlur: {
        'xs': '2px',
      },
      colors: {
        // Saudi official green palette
        primary: {
          50: '#e6f2ec',
          100: '#cce5d9',
          200: '#99cbb3',
          300: '#66b286',
          400: '#33995a',
          500: '#006C35',
          600: '#005c2d',
          700: '#004d26',
          800: '#003d1e',
          900: '#002e17',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'IBM Plex Sans Arabic', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
