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
        // Cool blue-mist backgrounds
        cream: {
          50:  '#FAFBFF',
          100: '#F4F6FF',  // main page background
          200: '#E4E8FF',  // borders, dividers, hover
          300: '#CBD2FF',  // stronger borders
          400: '#A8B4F8',
          500: '#8596F0',
        },
        // Cool slate-blue text
        ink: {
          50:  '#F4F5FA',
          100: '#E0E3F0',
          200: '#BCC2DC',
          300: '#919CC2',
          400: '#6471A0',
          500: '#4A5380',
          600: '#363D63',
          700: '#262D4D',
          800: '#181E38',
          900: '#0D1123',
          950: '#060810',
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
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(15, 25, 80, 0.08)',
        'warm':    '0 4px 12px 0 rgba(15, 25, 80, 0.10), 0 1px 3px 0 rgba(15, 25, 80, 0.06)',
        'warm-md': '0 8px 24px 0 rgba(15, 25, 80, 0.12), 0 2px 6px 0 rgba(15, 25, 80, 0.06)',
        'warm-lg': '0 16px 40px 0 rgba(15, 25, 80, 0.14), 0 4px 10px 0 rgba(15, 25, 80, 0.08)',
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
