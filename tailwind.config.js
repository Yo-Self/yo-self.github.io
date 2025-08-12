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
    },
  },
  plugins: [],
  safelist: [
    'bg-primary',
    'text-primary',
  ],
}; 