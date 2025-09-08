/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/*.js",
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A5E090',
        secondary: '#4CAF50',
      }
    },
  },
  plugins: [],
}
