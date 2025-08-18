/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4', // cyan-500 do Tailwind, visível no light e acessível
      },
      animation: {
        'fade-in-0': 'fade-in-0 0.2s ease-out',
        'zoom-in-95': 'zoom-in-95 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'fade-in-left': 'fade-in-left 0.5s ease-out',
        'fade-in-right': 'fade-in-right 0.5s ease-out',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'fade-in-0': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95) translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
        },
        'zoom-in-95': {
          '0%': {
            transform: 'scale(0.95)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        'slide-in-from-top': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'bounce-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'slide-left': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(-30px) scale(0.98)', opacity: '0.8' }
        },
        'slide-right': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(30px) scale(0.98)', opacity: '0.8' }
        },
        'fade-in-center': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'ferris-left': {
          '0%': { transform: 'rotateY(0deg) translateZ(0px) scale(1)', opacity: '1' },
          '50%': { transform: 'rotateY(-90deg) translateZ(50px) scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'rotateY(-180deg) translateZ(100px) scale(0.8)', opacity: '0.6' }
        },
        'ferris-right': {
          '0%': { transform: 'rotateY(0deg) translateZ(0px) scale(1)', opacity: '1' },
          '50%': { transform: 'rotateY(90deg) translateZ(50px) scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'rotateY(180deg) translateZ(100px) scale(0.8)', opacity: '0.6' }
        },
        'ferris-center': {
          '0%': { transform: 'rotateY(0deg) translateZ(0px) scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'rotateY(0deg) translateZ(0px) scale(1)', opacity: '1' }
        },
      },
      backgroundColor: {
        'dark': '#0a0a0a',
        'dark-secondary': '#1f1f1f',
      },
      textColor: {
        'dark': '#ededed',
        'dark-secondary': '#d1d5db',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-primary',
    'text-primary',
    'font-normal',
    'font-large',
    'font-extra-large',
    'dark',
    'bg-dark',
    'text-dark',
    'bg-dark-secondary',
    'text-dark-secondary',
    'animate-fade-in-up',
    'animate-fade-in-down',
    'animate-fade-in-left',
    'animate-fade-in-right',
    'animate-bounce-in',
    'animate-slide-up',
    'animate-scale-in',
    'animate-slide-left',
    'animate-slide-right',
    'animate-fade-in-center',
    'animate-ferris-left',
    'animate-ferris-right',
    'animate-ferris-center',
  ],
}; 