'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import AuthLeftPanel from './AuthLeftPanel'
import LanguageToggle from './LanguageToggle'
import DarkModeToggle from '../DarkModeToggle'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import { useLang } from '../../lib/LangContext'

export default function AuthPageLayout({ mode, children }: { mode: 'login' | 'register'; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useHydratedReducedMotion()
  const { isRTL } = useLang()

  useEffect(() => {
    if (reducedMotion || !rootRef.current) return
    const context = gsap.context(() => {
      gsap.fromTo(
        '.auth-page-content',
        { opacity: 0, y: 16, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', clearProps: 'filter' }
      )
    }, rootRef)
    return () => context.revert()
  }, [reducedMotion])

  return (
    <main
      ref={rootRef}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ background: 'var(--background)' }}
    >
      {/* Subtle Brand Ambient Gradients */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 85% 12%, rgba(0, 217, 255, 0.05), transparent 70%),
            radial-gradient(ellipse 50% 60% at 15% 85%, rgba(113, 60, 255, 0.06), transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(23, 105, 255, 0.03), transparent 80%)
          `,
        }}
      />

      {/* Global Controls: Language & Theme Toggle */}
      <header className="fixed top-4 z-40 flex items-center gap-2 px-4 sm:px-6" style={{ [isRTL ? 'left' : 'right']: '1rem' }}>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/85 p-1 shadow-sm backdrop-blur-md">
          <LanguageToggle />
          <div className="h-4 w-[1px] bg-border" />
          <DarkModeToggle />
        </div>
      </header>

      {/* Layout Grid: Left Showcase + Right Form */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(420px,1fr)_minmax(480px,1.15fr)]">
        <div className="hidden min-h-screen lg:block">
          <AuthLeftPanel mode={mode} />
        </div>
        <section className="auth-page-content relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-8 lg:px-12">
          <div className="relative z-10 w-full max-w-[500px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
