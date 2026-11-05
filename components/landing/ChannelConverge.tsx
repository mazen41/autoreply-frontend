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

// Communication channels and commerce stores converge into one workspace.
const CHANNELS = [
  { id: 'ig', label: 'Instagram', color: '#E4405F', angle: -63, icon: '/icons/instagram.svg' },
  { id: 'fb', label: 'Facebook', color: '#1877F2', angle: -45, icon: '/icons/facebook.svg' },
  { id: 'wa', label: 'WhatsApp', color: '#25D366', angle: -27, icon: '/icons/whatsapp.svg' },
  { id: 'gm', label: 'Gmail', color: '#EA4335', angle: -9, icon: null },
  { id: 'tg', label: 'Telegram', color: '#2AABEE', angle: 9, icon: '/icons/telegram.svg' },
  { id: 'salla', label: 'Salla', color: '#00B4D8', angle: 27, icon: '/icons/sllla.svg' },
  { id: 'shopify', label: 'Shopify', color: '#95BF47', angle: 45, icon: '/icons/shopify.svg' },
  { id: 'woo', label: 'WooCommerce', color: '#96588A', angle: 63, icon: '/icons/woocommerce-icon.svg' },
]

const W = 700
const H = 560
const CORE = { x: W / 2, y: H - 105 }
const RADIUS = 330

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
        gsap.set('.cc-path', { opacity: 0.55 })
        gsap.set('.cc-node', { opacity: 1, scale: 1 })
        gsap.set('.cc-core', { opacity: 1, scale: 1 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo('.cc-core', { scale: 0.82, opacity: 0.72 }, { scale: 1, opacity: 1, duration: 0.65, immediateRender: false })
        .fromTo('.cc-node', { scale: 0.84, opacity: 0.72 }, { scale: 1, opacity: 1, duration: 0.48, stagger: 0.07, immediateRender: false }, '-=0.26')
        .fromTo('.cc-path', { opacity: 0.2 }, { opacity: 0.55, duration: 0.6, stagger: 0.06, immediateRender: false }, '-=0.22')

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
      viewBox={`0 70 ${W} ${H - 70}`}
      className="w-full h-auto max-w-[640px] mx-auto"
      role="img"
      aria-label={isRTL ? 'قنوات المراسلة تلتقي في مسار موحد للمحادثات' : 'Messaging channels converging into one conversation stream'}
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

      <g className="cc-rig">
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
                {ch.icon ? (
                  <image href={ch.icon} x={from.x - 11} y={from.y - 11} width={22} height={22} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  <text x={from.x} y={from.y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill={ch.color} style={{ transformOrigin: `${from.x}px ${from.y}px` }}>G</text>
                )}
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
