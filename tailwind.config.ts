import type { Config } from 'tailwindcss';

// MMD palette, drawn from the agency's shield logo. Token names are kept from the
// first build so every page picks up the refined values.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shield blue / hover / ink (headings, dark sections)
        navy:  { DEFAULT: '#2B4190', dark: '#22357A', deep: '#16224A' },
        // crest gold: DEFAULT/dark for fills, deep for text on light backgrounds (5.9:1)
        gold:  { DEFAULT: '#D4A53A', dark: '#B8892A', deep: '#8A5A12', soft: '#F6EBCF', crest: '#F0C018' },
        steel: '#3E5C9A',
        // paper is the page ground; cream and haze are one and two tone steps from it
        paper: '#F2F4F8',
        cream: '#E9EDF4',
        haze: '#DCE3EE',
        // soft ink for secondary text (7.4:1 on paper)
        soft: '#4A5675',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      keyframes: {
        'mmd-rise': { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'mmd-rise': 'mmd-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
