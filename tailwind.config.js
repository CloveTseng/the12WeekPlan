/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09'
        },
        morandi: {
          cream: '#F2F0EB', // 米白
          beige: '#DDC8B0', // 杏色
          brown: '#A4907C', // 棕色
          clay: '#B8A492', // 陶土
          pink: '#D9A9A9', // 髒粉
          rose: '#D29C9C', // 玫瑰
          blue: '#9FB8AD', // 霧藍
          ocean: '#87A8B3', // 海藍
          green: '#A9BFA8', // 豆綠
          sage: '#8F9E8B' // 鼠尾草
        }
      }
    }
  },
  plugins: []
}
