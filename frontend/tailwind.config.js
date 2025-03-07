/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c8ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#0077ff',  // Azul PRF
          600: '#005ecc',
          700: '#004499',
          800: '#002b66',
          900: '#001233',
        },
        secondary: {
          50: '#fffde6',
          100: '#fffbcc',
          200: '#fff799',
          300: '#fff466',
          400: '#fff033',
          500: '#ffec00',  // Amarelo sinalização
          600: '#ccbd00',
          700: '#998e00',
          800: '#665f00',
          900: '#332f00',
        },
        asphalt: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',  // Cinza asfalto
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
        },
        danger: '#ff4444',
        warning: '#ffbb33',
        success: '#00C851',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'road-pattern': "url('/images/road-pattern.png')",
      },
    },
  },
  plugins: [],
};