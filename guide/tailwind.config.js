/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Nachtband (leo-projects): night blue from htl-leonding.at is the frame, never content.
        night: {
          950: '#021422',
          900: '#04243d',
          800: '#0a3556',
          200: '#b9cadb',
          100: '#dde7f0',
        },
        // Orange only for action (700), selection and focus (600).
        accent: colors.orange,
        canvas: '#f9fafb',
        // Logo division colours (countdown digits); stops use the admin-configured colours.
        'informatic-blue': '#0059A7',
        'media-technology-blue': '#70B4D9',
        'electronics-red': '#CE1223',
        'medicin-technology-yellow': '#f1a102',
      },
      fontFamily: {
        sans: [
          '"Manrope Variable"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      keyframes: {
        'grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        // The one motion moment: the tour band grows in once per visit.
        'grow-x': 'grow-x 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animated')],
};
