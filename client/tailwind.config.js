/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#17202a', mint: '#d7f5e9', coral: '#ff8066', paper: '#f7f8f5' },
      fontFamily: { display: ['"Space Grotesk"', 'sans-serif'], body: ['"DM Sans"', 'sans-serif'] }
    }
  },
  plugins: []
};