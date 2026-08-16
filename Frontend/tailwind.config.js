/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070708',
          900: '#0b0b0f',
          850: '#101016',
          800: '#16161e',
          700: '#1f1f2b',
          600: '#2a2a38',
          500: '#3a3a4a',
        },
        brand: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc7c3',
          300: '#ff9d96',
          400: '#ff6b61',
          500: '#ff3b2f',
          600: '#e51d12',
          700: '#bd170e',
          800: '#9a160f',
          900: '#7d1812',
        },
        gold: {
          400: '#f5c451',
          500: '#e6a817',
          600: '#c48a0e',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        kenburns: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '100%': { transform: 'scale(1.12) translateY(-2%)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out both',
        slideUp: 'slideUp 0.5s ease-out both',
        scaleIn: 'scaleIn 0.3s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
        kenburns: 'kenburns 18s ease-out both',
        floatY: 'floatY 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
