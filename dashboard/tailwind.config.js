/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}" // Ensure it includes your Angular files
  ],
  theme: {
    extend: {
      colors: {
        'htl-orange': '#e8704f',
        'htl-orange-dark': '#b4573d',
      }
    },
  },
  plugins: [],
}
