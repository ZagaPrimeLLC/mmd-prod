import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#264D80', deep: '#1E3F6B', mid: '#2F5A94', light: '#3565A4' },
        gold:  { DEFAULT: '#D8B752', bright: '#F5C544' },
        tint:  '#E8EEF6',
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
