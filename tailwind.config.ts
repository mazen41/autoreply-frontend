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
        background: '#0A0A0A',
        surface: '#0F0F0F',
        border: 'rgba(255,255,255,0.06)',
        divider: 'rgba(255,255,255,0.04)',
        accent: '#3B82F6',
        'accent-hover': '#2563EB',
        'accent-subtle': 'rgba(59,130,246,0.1)',
        'accent-focus': 'rgba(59,130,246,0.5)',
        'text-primary': '#E8E8E8',
        'text-secondary': '#A0A0A0',
        'text-tertiary': '#6B6B6B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
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
