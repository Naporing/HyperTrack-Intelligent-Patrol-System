/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 电杆类型颜色规范（严格按照CLAUDE.md要求）
        'iron-pole': '#EF4444',      // 红色
        'concrete-pole': '#3B82F6',  // 蓝色
        'gantry-pole': '#10B981',    // 绿色
      },
      layout: {
        '70': '70%',
        '30': '30%',
      }
    },
  },
  plugins: [],
}

