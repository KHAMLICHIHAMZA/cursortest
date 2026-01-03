/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#1D1F23',
          card: '#2C2F36',
          blue: '#3E7BFA',
          text: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
}






