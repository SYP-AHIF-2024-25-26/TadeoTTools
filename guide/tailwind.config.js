/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'informatic-blue': '#0059A7',
        'media-technology-blue': '#70B4D9',
        'electronics-red': '#CE1223',
        'medicin-technology-yellow': '#f1a102',
        'neutral-green': '#80c076',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animated')],
};
