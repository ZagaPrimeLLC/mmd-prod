import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // palette carried over from the community-navigator build
        navy:  { DEFAULT: '#1e3a8a', dark: '#1e40af', deep: '#172554' },
        // deep: gold that passes WCAG AA (5.0:1) as text on white; DEFAULT/dark are for fills
        gold:  { DEFAULT: '#fbbf24', dark: '#f59e0b', deep: '#b45309' },
        steel: '#336699',
        cream: '#F8F8F6',
      },
    },
  },
  plugins: [],
} satisfies Config;
