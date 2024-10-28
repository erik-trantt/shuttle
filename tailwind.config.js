/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      display: ["Fira Sans", "Helvetica", "sans-serif"],
      heading: ["Fira Sans Condensed", "Georgia", "serif"],
    },
    extend: {},
  },
  plugins: [],
};
