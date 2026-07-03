/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flixon: {
          bg: '#0a0a0a',
          surface: '#141414',
          card: '#1a1a1a',
          'card-hover': '#222222',
          border: '#262626',
          violet: '#7C3AED',
          'violet-light': '#8B5CF6',
          'violet-dark': '#6D28D9',
          muted: '#a1a1aa'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.5)',
        glow: '0 0 30px rgba(124,58,237,0.45)'
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
