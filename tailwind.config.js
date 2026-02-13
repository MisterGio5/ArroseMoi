/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f1f1b',
        forest: '#0d3d2b',
        moss: '#2b7a4b',
        leaf: '#7bcf93',
        sun: '#f3c969',
        sky: '#d6f1f3',
        cream: '#f8f5ea',
        card: '#ffffff',
      },
      fontFamily: {
        serif: ['Fraunces', 'Times New Roman', 'serif'],
        sans: ['Space Grotesk', 'Trebuchet MS', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #eff8f1 0%, #d3efe9 40%, #f7f1df 100%)',
      },
      boxShadow: {
        'custom': '0 18px 40px rgba(15, 31, 27, 0.15)',
        'card': '0 16px 30px rgba(15, 31, 27, 0.1)',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
