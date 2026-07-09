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
        // Dark mode colors
        background: '#0A0A0F',
        surface: '#111118',
        border: '#1E1E2E',
        primary: '#6C63FF',
        'text-primary': '#F0F0FF',
        'text-secondary': '#8888AA',
        success: '#00D68F',
        warning: '#FFB800',
        danger: '#FF4D6D',
        // Light mode colors (used with dark: prefix)
        light: {
          background: '#F4F4FF',
          surface: '#FFFFFF',
          border: '#E0E0F0',
          'text-primary': '#0A0A1A',
          'text-secondary': '#555577',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
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
        'nebula': 'nebula 20s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        nebula: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
