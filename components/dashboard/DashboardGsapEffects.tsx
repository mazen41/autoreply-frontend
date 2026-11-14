'use client'

import React, { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'

interface GsapStaggerGroupProps {
  children: ReactNode
  className?: string
  stagger?: number
  duration?: number
}

export function GsapStaggerGroup({
  children,
  className = '',
  stagger = 0.08,
  duration = 0.5,
}: GsapStaggerGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useHydratedReducedMotion()

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.children || [],
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [reducedMotion, duration, stagger])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.2,
  className = '',
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useHydratedReducedMotion()

  useEffect(() => {
    if (!nodeRef.current) return

    if (reducedMotion) {
      nodeRef.current.textContent = `${prefix}${value.toLocaleString()}${suffix}`
      return
    }

    const obj = { val: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: value,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          if (nodeRef.current) {
            nodeRef.current.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`
          }
        },
      })
    })

    return () => ctx.revert()
  }, [value, duration, prefix, suffix, reducedMotion])

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  )
}
