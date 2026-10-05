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
        // These resolve to CSS variables defined in app/globals.css,
        // which swap value based on the `dark` class on <html>.
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-card': 'var(--surface-card)',
        'surface-overlay': 'var(--surface-overlay)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-subtle': 'var(--border-subtle)',
        'border-hover': 'var(--border-hover)',
        divider: 'var(--divider)',
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        'brand-dark': 'var(--brand-dark)',
        'brand-primary': 'var(--brand-primary)',
        'brand-text': 'var(--brand-text)',
        accent: 'var(--accent)',
        'accent-end': 'var(--accent-end)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle': 'var(--accent-subtle)',
        'accent-focus': 'var(--accent-focus)',
        'ai-accent': 'var(--ai-accent)',
        'ai-subtle': 'var(--ai-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        success: 'var(--success)',
        'success-subtle': 'var(--success-subtle)',
        warning: 'var(--warning)',
        'warning-subtle': 'var(--warning-subtle)',
        error: 'var(--error)',
        'error-subtle': 'var(--error-subtle)',
        info: 'var(--info)',
        'info-subtle': 'var(--info-subtle)',
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
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
