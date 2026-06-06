import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary':      '#050505',
        'bg-secondary':    '#090909',
        'surface':         '#111111',
        'accent-primary':  '#C6FF00',
        'accent-secondary':'#7DF9FF',
        'text-primary':    '#F5F5F5',
        'text-secondary':  'rgba(255,255,255,0.55)',
        // legacy aliases
        'teal':            '#7DF9FF',
        'magenta':         '#C6FF00',
        'bg-dark':         '#050505',
        'accent':          '#C6FF00',
        'border-dark':     'rgba(255,255,255,0.05)',
      },
      fontFamily: {
        sans:   ['Cairo', 'Inter', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
      },
      fontSize: {
        hero: 'clamp(2.8rem, 6vw, 5.5rem)',
      },
      borderRadius: {
        xl:    '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
