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
    const update = (time: number) => lenis?.raf(time * 1000)
    const refresh = () => ScrollTrigger.refresh()
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenis?.on('scroll', ScrollTrigger.update)
    window.addEventListener('load', refresh, { once: true })

    return () => {
      gsap.ticker.remove(update)
      window.removeEventListener('load', refresh)
      lenis?.off('scroll', ScrollTrigger.update)
    }
  }, [reducedMotion])

  if (reducedMotion) return <>{children}</>

  return (
    <ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
