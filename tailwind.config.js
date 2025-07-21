/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nicsan-blue': '#004E98',
        'nicsan-red': '#D7263D',
      }
    },
  },
  plugins: [],
}