/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'win95-teal': '#008080',
        'win95-gray': '#c0c0c0',
        'win95-dark-gray': '#808080',
        'win95-blue': '#000080',
        'terminal-black': '#0C0C0C',
        'terminal-green': '#00FF00',
      },
      fontFamily: {
        'system': ['MS Sans Serif', 'Tahoma', 'sans-serif'],
        'terminal': ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
