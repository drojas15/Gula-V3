/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',    // green-50
          100: '#dcfce7',   // green-100
          200: '#bbf7d0',   // green-200
          300: '#86efac',   // green-300
          400: '#4ade80',   // green-400
          500: '#10b981',   // green-500 - PRIMARY
          600: '#059669',   // green-600 - HOVER
          700: '#047857',   // green-700
          800: '#065f46',   // green-800
          900: '#064e3b',   // green-900
        },
        background: '#fafaf9', // stone-50
      },
    },
  },
  plugins: [],
};

