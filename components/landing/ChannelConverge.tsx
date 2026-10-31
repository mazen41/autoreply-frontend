'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

type ChannelConvergeProps = {
  isRTL: boolean
  reduceMotion: boolean
}

// Five channel sources, arranged around an arc, each with its brand colour,
// converging on a single path toward the core. The idea: every channel a
// customer uses becomes one stream the business actually works from.
const CHANNELS = [
  { id: 'ig', label: 'IG', color: '#E4405F', angle: -52 },
  { id: 'fb', label: 'f', color: '#1877F2', angle: -26 },
  { id: 'wa', label: 'WA', color: '#25D366', angle: 0 },
  { id: 'gm', label: 'G', color: '#EA4335', angle: 26 },
  { id: 'tg', label: 'TG', color: '#2AABEE', angle: 52 },
]

const W = 640
const H = 520
const CORE = { x: W / 2, y: H - 108 }
const RADIUS = 300

function sourcePoint(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CORE.x + RADIUS * Math.cos(rad),
    y: CORE.y + RADIUS * Math.sin(rad) + 70,
  }
}

function curvePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2
  const midY = from.y - (from.y - to.y) * 0.62
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
}

export default function ChannelConverge({ isRTL, reduceMotion }: ChannelConvergeProps) {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!rootRef.current) return

    const ctx = gsap.context(() => {
      const root = rootRef.current!

      if (reduceMotion) {
        gsap.set('.cc-path', { opacity: 0.5 })
        gsap.set('.cc-node', { opacity: 1, scale: 1 })
        gsap.set('.cc-core', { opacity: 1, scale: 1 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.set('.cc-core', { scale: 0, opacity: 0 })
        .set('.cc-node', { scale: 0, opacity: 0 })
        .set('.cc-path', { opacity: 0 })
        .to('.cc-core', { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)' })
        .to('.cc-node', { scale: 1, opacity: 1, duration: 0.5, stagger: 0.08 }, '-=0.3')
        .to('.cc-path', { opacity: 0.55, duration: 0.6, stagger: 0.06 }, '-=0.3')

      // Continuous particle streams: small dots travel each path into the core.
      CHANNELS.forEach((ch, i) => {
        const pathEl = root.querySelector<SVGPathElement>(`#cc-path-${ch.id}`)
        const dots = root.querySelectorAll<SVGCircleElement>(`.cc-dot-${ch.id}`)
        if (!pathEl || !dots.length) return

        dots.forEach((dot, dIdx) => {
          gsap.to(dot, {
            motionPath: {
              path: pathEl,
              align: pathEl,
              alignOrigin: [0.5, 0.5],
            },
            duration: 2.4 + i * 0.15,
            repeat: -1,
            delay: dIdx * (2.4 / dots.length) + i * 0.3,
            ease: 'power1.in',
          })
        })
      })

      // Core pulse — the unified stream breathing.
      gsap.to('.cc-core-ring', {
        scale: 1.18,
        opacity: 0,
        duration: 2.2,
        repeat: -1,
        ease: 'power1.out',
        stagger: { each: 0.7, repeat: -1 },
      })

      // Slow ambient float on the whole rig.
      gsap.to('.cc-rig', {
        y: -10,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [reduceMotion])

  return (
    <svg
      ref={rootRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto max-w-[640px] mx-auto"
      role="img"
      aria-label="Channels converging into one unified conversation stream"
    >
      <defs>
        <radialGradient id="cc-core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D9FF" />
          <stop offset="55%" stopColor="#1769FF" />
          <stop offset="100%" stopColor="#713CFF" />
        </radialGradient>
        <filter id="cc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="cc-rig" style={{ transform: isRTL ? 'scaleX(-1)' : undefined, transformOrigin: 'center' }}>
        {CHANNELS.map((ch) => {
          const from = sourcePoint(ch.angle)
          const d = curvePath(from, CORE)
          return (
            <g key={ch.id}>
              <path id={`cc-path-${ch.id}`} className="cc-path" d={d} fill="none" stroke={ch.color} strokeWidth={1.4} strokeLinecap="round" />
              {[0, 1, 2].map((n) => (
                <circle key={n} className={`cc-dot-${ch.id}`} r={3.2} fill={ch.color} filter="url(#cc-glow)" />
              ))}
              <g className="cc-node" style={{ transformOrigin: `${from.x}px ${from.y}px` }}>
                <circle cx={from.x} cy={from.y} r={22} fill="var(--surface)" stroke={ch.color} strokeWidth={1.5} />
                <text
                  x={from.x}
                  y={from.y + 5}
                  textAnchor="middle"
                  fontSize={ch.id === 'fb' ? 20 : 12}
                  fontWeight={800}
                  fill={ch.color}
                  style={{ transform: isRTL ? `scaleX(-1)` : undefined, transformOrigin: `${from.x}px ${from.y}px` }}
                >
                  {ch.label}
                </text>
              </g>
            </g>
          )
        })}

        <g style={{ transformOrigin: `${CORE.x}px ${CORE.y}px` }}>
          <circle className="cc-core-ring" cx={CORE.x} cy={CORE.y} r={44} fill="none" stroke="#00D9FF" strokeWidth={1.5} style={{ transformOrigin: `${CORE.x}px ${CORE.y}px` }} />
          <circle className="cc-core-ring" cx={CORE.x} cy={CORE.y} r={44} fill="none" stroke="#713CFF" strokeWidth={1.5} style={{ transformOrigin: `${CORE.x}px ${CORE.y}px` }} />
          <g className="cc-core" style={{ transformOrigin: `${CORE.x}px ${CORE.y}px` }}>
            <circle cx={CORE.x} cy={CORE.y} r={38} fill="url(#cc-core-grad)" filter="url(#cc-glow)" />
            <circle cx={CORE.x} cy={CORE.y} r={38} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          </g>
        </g>
      </g>
    </svg>
  )
}
