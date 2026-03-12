/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#12121a',
        'surface-hover': '#1a1a24',
      },
    },
  },
  plugins: [],
};
