/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./frontend/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "./rules.html",
    "./shortcuts.html",
    "./layersview.html"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      animation: {
        tilt: 'tilt 10s infinite linear',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(0.5deg)',
          },
          '75%': {
            transform: 'rotate(-0.5deg)',
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: .5,
          },
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ['group-hover'],
    },
  },
}

