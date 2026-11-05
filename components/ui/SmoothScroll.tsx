'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ReactLenis, type LenisRef } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useHydratedReducedMotion()
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    if (reducedMotion) return

    const lenis = lenisRef.current?.lenis
    if (!lenis) return

    const refresh = () => ScrollTrigger.refresh()
    lenis?.on('scroll', ScrollTrigger.update)
    window.addEventListener('load', refresh, { once: true })
    requestAnimationFrame(refresh)

    return () => {
      window.removeEventListener('load', refresh)
      lenis?.off('scroll', ScrollTrigger.update)
    }
  }, [reducedMotion])

  if (reducedMotion) return <>{children}</>

  return (
    <ReactLenis root options={{ autoRaf: true, anchors: true }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
