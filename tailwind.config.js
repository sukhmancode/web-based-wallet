/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,ts,tsx,jsx}"],
  theme: {
    extend: {
      fontFamily : {
        sans: ['Manrope', 'sans-serif'], // Replace
      },
      colors:{
        blue:{
          700:"#cbd5e1"
        },black:{
          700:"#1f2937"
        }
      }
    },
  },
  plugins: [],
}