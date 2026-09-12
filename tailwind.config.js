/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        'base': ['1.0625rem', { lineHeight: '1.625rem' }],
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }],
        '3xl': ['2rem', { lineHeight: '2.375rem' }],
      },
      backdropBlur: {
        'xs': '2px',
      },
      colors: {
        // Deep enterprise dark palette
        midnight: {
          950: '#070A0F',
          900: '#0B0F17',
          800: '#111827',
        },
        nightcard: {
          DEFAULT: '#131B2A',
          hover: '#182235',
          border: '#202C3F',
        },
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

