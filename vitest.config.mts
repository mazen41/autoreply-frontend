import { defineConfig } from 'vitest/config'

// React picks its production build when NODE_ENV=production, and that build has no
// act() for @testing-library/react. Tests must always run with the development build.
if (process.env.NODE_ENV === 'production') {
  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
