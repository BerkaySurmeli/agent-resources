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
        // Warm cream backgrounds — the foundation of the Anthropic aesthetic
        cream: {
          50:  '#FDFCF9',
          100: '#FAF7F2',
          200: '#F5EDE0',
          300: '#EDDFCC',
          400: '#E2CEB6',
          500: '#D4B99A',
        },
        // Warm charcoal text
        ink: {
          50:  '#F5F3F0',
          100: '#E8E3DD',
          200: '#C9BFB5',
          300: '#A8998C',
          400: '#857567',
          500: '#6B5E52',
          600: '#54473C',
          700: '#3D332A',
          800: '#2A221A',
          900: '#1C1510',
          950: '#100D09',
        },
        // Terracotta / coral — primary action color
        terra: {
          50:  '#FDF2EE',
          100: '#FAE0D6',
          200: '#F4BBA8',
          300: '#EB9078',
          400: '#DF6B50',
          500: '#CC5132',  // main CTA
          600: '#B5442A',
          700: '#943823',
          800: '#732D1D',
          900: '#522019',
        },
        // Soft slate for secondary elements
        warm: {
          50:  '#F9F7F5',
          100: '#F2EEE9',
          200: '#E5DDD4',
          300: '#D1C5BA',
          400: '#B8A99A',
          500: '#9E8D7E',
          600: '#7F6F62',
          700: '#635649',
          800: '#463D35',
          900: '#2E2820',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(60, 40, 20, 0.08)',
        'warm':    '0 4px 12px 0 rgba(60, 40, 20, 0.10), 0 1px 3px 0 rgba(60, 40, 20, 0.06)',
        'warm-md': '0 8px 24px 0 rgba(60, 40, 20, 0.12), 0 2px 6px 0 rgba(60, 40, 20, 0.06)',
        'warm-lg': '0 16px 40px 0 rgba(60, 40, 20, 0.14), 0 4px 10px 0 rgba(60, 40, 20, 0.08)',
        'terra':   '0 4px 14px 0 rgba(204, 81, 50, 0.30)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
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
