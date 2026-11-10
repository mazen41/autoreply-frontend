'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import AuthLeftPanel from './AuthLeftPanel'
import LanguageToggle from './LanguageToggle'
import SmoothScroll from '../ui/SmoothScroll'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'

export default function AuthPageLayout({ mode, children }: { mode: 'login' | 'register'; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useHydratedReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const context = gsap.context(() => {
      gsap.fromTo('.auth-page-content',
        { opacity: 0, y: 18, filter: 'blur(5px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out', clearProps: 'filter' },
      )
    }, rootRef)
    return () => context.revert()
  }, [reducedMotion])

  return (
    <SmoothScroll>
      <main ref={rootRef} className="relative min-h-screen overflow-x-clip" style={{ background: 'var(--background)' }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 85% 10%, var(--accent-subtle), transparent 36%), radial-gradient(ellipse at 12% 88%, var(--ai-subtle), transparent 34%)' }} />
        <LanguageToggle className="absolute top-5 z-30" style={{ insetInlineEnd: '1.25rem' }} />
        <div className="relative mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(360px,0.88fr)_minmax(460px,1.12fr)]">
          <div className="hidden min-h-screen lg:block">
            <AuthLeftPanel mode={mode} />
          </div>
          <section className="auth-page-content relative flex min-h-screen items-center justify-center px-4 py-20 sm:px-8 lg:px-12">
            <div className="relative z-10 w-full max-w-[470px]">{children}</div>
          </section>
        </div>
      </main>
    </SmoothScroll>
  )
}
