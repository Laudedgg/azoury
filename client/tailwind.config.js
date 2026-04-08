/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: '#4EECD3',
          'accent-hover': '#3BD4BC',
          base: '#0B1E1E',
          surface: '#0F2A2A',
          elevated: '#143535',
          primary: '#E8F5F3',
          secondary: '#8AABA6',
          muted: '#5A7A75',
          border: '#1A3F3F',
          success: '#4EEC90',
          warning: '#ECD34E',
          error: '#EC4E6F',
        },
        chart: {
          1: '#4EECD3',
          2: '#4EEC90',
          3: '#4EB8EC',
          4: '#B84EEC',
          5: '#ECD34E',
          6: '#EC8A4E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'mesh-move': 'meshMove 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        meshMove: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(5%, 5%) scale(1.05)' },
          '50%': { transform: 'translate(-3%, 8%) scale(0.95)' },
          '75%': { transform: 'translate(7%, -3%) scale(1.02)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
