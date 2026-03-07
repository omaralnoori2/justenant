import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // JusTenant Brand Colors
        'brand-blue': '#2DB5DA',
        'brand-blue-light': '#9ed4ea',
        'brand-blue-lighter': '#c3e3f2',
        'brand-blue-lightest': '#e2f1f9',
        'brand-gray': '#939598',
        'brand-gray-light': '#b1b1b4',
        'brand-gray-lighter': '#cfcfd1',
        'brand-dark': '#303036',
        brand: {
          DEFAULT: '#2DB5DA',
          light: '#9ed4ea',
          lighter: '#c3e3f2',
          lightest: '#e2f1f9',
          dark: '#303036',
        },
      },
      fontFamily: {
        'proxima-nova': [
          'Proxima Nova',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
