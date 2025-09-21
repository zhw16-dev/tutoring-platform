/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sage-green': '#A8C6A2',
        'sage-green-light': '#D4E7D1',
        'forest-green': '#2E4C3C',
        'golden-yellow': '#F5E6A3',
        'golden-yellow-light': '#FAF0D1',
        'golden-yellow-dark': '#E6D280',
        'cream': '#FFFDF5',
      },
      fontFamily: {
        'serif': ['Lora', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(46, 76, 60, 0.08), 0 1px 3px rgba(46, 76, 60, 0.06)',
        'modal': '0 10px 25px rgba(46, 76, 60, 0.15), 0 4px 6px rgba(46, 76, 60, 0.1)',
      },
      animation: {
        'pulse-sage': 'pulse-sage 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-sage': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '.7',
          },
        },
      },
    },
  },
  plugins: [],
}