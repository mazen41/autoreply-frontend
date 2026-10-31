'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText)
}

type HeroHeadlineProps = {
  lineA: string
  lineB: string
  reduceMotion: boolean
}

// The signature entrance: the headline assembles itself word by word,
// each word rising out of a slight blur. Split separately per line so the
// gradient span keeps its own background-clip (SplitText would otherwise
// wrap each word in a plain span that doesn't inherit the gradient fill).
export default function HeroHeadline({ lineA, lineB, reduceMotion }: HeroHeadlineProps) {
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const lineARef = useRef<HTMLSpanElement>(null)
  const lineBRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!h1Ref.current) return
    gsap.set(h1Ref.current, { opacity: 1 })

    if (reduceMotion || !lineARef.current || !lineBRef.current) return

    const splitA = new SplitText(lineARef.current, { type: 'words', wordsClass: 'hh-word' })
    const splitB = new SplitText(lineBRef.current, { type: 'words', wordsClass: 'hh-word' })
    // SplitText wraps each word in its own span; re-apply the gradient fill
    // per word so it still reads as one continuous gradient across the line.
    gsap.set(splitB.words, {
      backgroundImage: 'var(--brand-gradient)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundSize: '400% 100%',
    })
    splitB.words.forEach((w, i) => {
      ;(w as HTMLElement).style.backgroundPosition = `${(i / Math.max(splitB.words.length - 1, 1)) * 100}% 0`
    })
    const words = [...splitA.words, ...splitB.words]

    gsap.set(words, { opacity: 0, y: 34, rotateX: -40, filter: 'blur(6px)' })

    const tl = gsap.timeline({ delay: 0.1 })
    tl.to(words, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      duration: 0.9,
      stagger: 0.07,
      ease: 'power3.out',
    })

    return () => {
      splitA.revert()
      splitB.revert()
    }
  }, [reduceMotion, lineA, lineB])

  return (
    <h1
      ref={h1Ref}
      className="max-w-2xl text-balance text-[clamp(2.65rem,5.8vw,5.5rem)] font-black leading-[1.02] tracking-[-0.055em] opacity-0 [perspective:600px]"
      style={{ color: 'var(--text-primary)' }}
    >
      <span ref={lineARef}>{lineA}</span>
      <br />
      <span ref={lineBRef} style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
        {lineB}
      </span>
    </h1>
  )
}
