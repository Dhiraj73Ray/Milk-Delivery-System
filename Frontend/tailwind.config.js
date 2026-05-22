/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
      }
    },
  },
  plugins: [],
}