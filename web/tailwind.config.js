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
        // Neutral backgrounds — professional gray scale
        cream: {
          50:  '#FFFFFF',
          100: '#F8F9FA',  // main page background
          200: '#EAECF0',  // borders, dividers, hover states
          300: '#D0D5DD',  // stronger borders
          400: '#98A2B3',
          500: '#667085',
        },
        // Cool slate text
        ink: {
          50:  '#F8F9FB',
          100: '#EAEDF2',
          200: '#C8CFD8',
          300: '#9AA3B0',
          400: '#667384',
          500: '#475467',
          600: '#344054',
          700: '#1D2939',
          800: '#101828',
          900: '#0A0F1C',
          950: '#050810',
        },
        // Brand blue — primary action color
        terra: {
          50:  '#EEF0FF',
          100: '#DADDFF',
          200: '#BABFFF',
          300: '#8E95FF',
          400: '#6470FA',
          500: '#4B60EE',  // main CTA
          600: '#3549D4',  // hover
          700: '#2739B0',
          800: '#1C2B8A',
          900: '#131D62',
        },
        // Amber-gold secondary accent — pairs with blue
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Primary brand blue — shorthand alias for terra-500
        brand: '#4B60EE',
        // Cool secondary muted tones
        warm: {
          50:  '#F7F8FE',
          100: '#EDF0FB',
          200: '#D5DAF5',
          300: '#B5BCE6',
          400: '#8F99D4',
          500: '#6C77BE',
          600: '#4F5A9E',
          700: '#3B4480',
          800: '#2A3063',
          900: '#1C204A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        'warm':    '0 4px 12px 0 rgba(16, 24, 40, 0.08), 0 1px 3px 0 rgba(16, 24, 40, 0.04)',
        'warm-md': '0 8px 24px 0 rgba(16, 24, 40, 0.10), 0 2px 6px 0 rgba(16, 24, 40, 0.04)',
        'warm-lg': '0 16px 40px 0 rgba(16, 24, 40, 0.12), 0 4px 10px 0 rgba(16, 24, 40, 0.06)',
        'brand':   '0 4px 14px 0 rgba(75, 96, 238, 0.28)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
