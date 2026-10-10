const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // The one highlighter, as in the GuideApp: primary actions, selection, focus.
        accent: colors.orange,
        canvas: colors.gray[50],
      },
      screens: {
        // Low screens (landscape tablets, phones): less vertical chrome so long
        // answer lists fit. Listed after the width breakpoints, so it wins.
        short: { raw: '(max-height: 700px)' },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
