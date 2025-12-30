/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F7F9F7',
          100: '#EEF2ED',
          200: '#DCE5DA',
          300: '#C1D4BC',
          400: '#A8B5A0',
          500: '#8FAB87',
          600: '#7A9172',
          700: '#5F7259',
          800: '#4A5240',
          900: '#363D30',
        },
        terracotta: {
          50: '#FBF5F2',
          100: '#F7EBE5',
          200: '#EFD7CB',
          300: '#E4BAA4',
          400: '#D49D80',
          500: '#C17B6B',
          600: '#A15A4A',
          700: '#7E4538',
          800: '#5D3329',
          900: '#3F231E',
        },
        cream: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F5F1E8',
          300: '#EDE7DB',
          400: '#E3DACB',
          500: '#D4C7B5',
        },
        forest: {
          50: '#F5F7F5',
          100: '#E8EDE8',
          200: '#D1DCD1',
          300: '#B0C4B0',
          400: '#8A9A8A',
          500: '#657565',
          600: '#3E4E42',
          700: '#2C4A3E',
          800: '#1E3330',
          900: '#142621',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
