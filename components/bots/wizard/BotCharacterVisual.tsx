'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { BotAvatarOption } from './types'
import BotWizard3DVisual from './BotWizard3DVisual'
import ChannelIcon from '../../ui/ChannelIcon'
import { Sparkles, Zap, Shield, Brain } from 'lucide-react'

export type BotMood = 'idle' | 'greeting' | 'thinking' | 'typing' | 'celebrating' | 'error'

interface BotCharacterVisualProps {
  avatar: BotAvatarOption
  step: number
  botName?: string
  mood?: BotMood
  selectedChannels?: Array<{ id: number; type: string; page_name?: string }>
  isRTL?: boolean
  className?: string
}

export default function BotCharacterVisual({
  avatar,
  step,
  botName = '',
  mood = 'idle',
  selectedChannels = [],
  isRTL = false,
  className = '',
}: BotCharacterVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const botImageWrapperRef = useRef<HTMLDivElement>(null)
  const nameBadgeRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const floatingBadgesRef = useRef<HTMLDivElement>(null)

  // Floating GSAP loop
  useEffect(() => {
    const el = botImageWrapperRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Continuous smooth floating animation
    const floatTween = gsap.to(el, {
      y: -14,
      rotation: isRTL ? -1.0 : 1.0,
      duration: 3.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    return () => {
      floatTween.kill()
    }
  }, [isRTL])

  // Reaction to botName changes
  useEffect(() => {
    if (!nameBadgeRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    gsap.fromTo(
      nameBadgeRef.current,
      { scale: 0.94, opacity: 0.6 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
    )
  }, [botName])

  // Reaction to mood changes
  useEffect(() => {
    const el = botImageWrapperRef.current
    const halo = haloRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    if (mood === 'celebrating') {
      gsap.timeline()
        .to(el, { scale: 1.08, duration: 0.25, ease: 'power2.out' })
        .to(el, { scale: 1.0, duration: 0.45, ease: 'elastic.out(1, 0.3)' })

      if (halo) {
        gsap.to(halo, {
          scale: 1.35,
          opacity: 0.9,
          duration: 0.5,
          yoyo: true,
          repeat: 3,
          ease: 'power2.inOut',
        })
      }
    } else if (mood === 'thinking') {
      gsap.to(el, { scale: 0.98, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    } else if (mood === 'typing') {
      gsap.to(el, { y: -6, duration: 0.3, yoyo: true, repeat: 5, ease: 'power1.inOut' })
    }
  }, [mood])

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center p-6 lg:p-8 select-none ${className}`}
    >
      {/* 3D WebGL Background Scene */}
      <BotWizard3DVisual
        avatar={avatar}
        step={step}
        isRTL={isRTL}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* Radiant Glowing Halo */}
      <div
        ref={haloRef}
        className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl opacity-40 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${avatar.glowColor} 0%, rgba(139, 92, 246, 0.2) 60%, transparent 80%)`,
        }}
      />

      {/* Main Bot Illustration Wrapper */}
      <div
        ref={botImageWrapperRef}
        className="relative z-10 flex flex-col items-center justify-center max-w-[360px] md:max-w-[420px] 2xl:max-w-[480px] transition-all duration-300"
      >
        {/* Soft Glass Pedestal Reflection beneath the bot */}
        <div
          className="absolute -bottom-6 h-10 w-48 rounded-[100%] blur-md opacity-45 transition-all duration-500"
          style={{ background: avatar.themeColor }}
        />

        {/* The Mandatory Bot Illustration PNG */}
        <div className="relative h-[320px] sm:h-[400px] md:h-[460px] 2xl:h-[520px] w-full flex items-center justify-center filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)]">
          <Image
            src={avatar.image}
            alt={isRTL ? avatar.nameAr : avatar.nameEn}
            fill
            sizes="(max-width: 768px) 340px, 480px"
            priority
            className="object-contain"
          />
        </div>

        {/* Orbiting Channel Badges in Step 2 */}
        {step === 2 && selectedChannels.length > 0 && (
          <div
            ref={floatingBadgesRef}
            className="pointer-events-none absolute -inset-6 z-20 flex items-center justify-between"
          >
            {selectedChannels.slice(0, 4).map((ch, idx) => {
              const offsets = [
                'top-4 start-0 -rotate-6',
                'top-1/3 end-0 rotate-6',
                'bottom-12 start-4 rotate-3',
                'bottom-8 end-4 -rotate-3',
              ]
              return (
                <div
                  key={ch.id}
                  className={`absolute ${offsets[idx % offsets.length]} flex items-center gap-2 rounded-2xl border border-white/15 bg-surface-elevated/85 px-3 py-1.5 shadow-xl backdrop-blur-md animate-pulse`}
                  style={{ animationDuration: `${2.5 + idx * 0.4}s` }}
                >
                  <ChannelIcon type={ch.type as any} size={18} />
                  <span className="text-xs font-semibold text-text-primary">
                    {ch.page_name || ch.type}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Floating Holographic Knowledge Indicator in Step 3 */}
        {step === 3 && (
          <div className="pointer-events-none absolute -top-4 start-4 z-20 flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-surface-elevated/90 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
            <Brain size={16} className="text-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-200">
              {isRTL ? 'قاعدة المعرفة الحية' : 'Live Knowledge Grounding'}
            </span>
          </div>
        )}

        {/* Live Identity Badge beneath the Bot */}
        <div
          ref={nameBadgeRef}
          className="relative z-20 -mt-2 flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-surface-elevated/75 px-5 py-2.5 shadow-2xl backdrop-blur-xl transition-all"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full animate-ping"
              style={{ backgroundColor: avatar.themeColor }}
            />
            <span className="text-sm font-bold tracking-wide text-text-primary">
              {botName.trim() || (isRTL ? avatar.nameAr : avatar.nameEn)}
            </span>
          </div>
          <p className="text-[11px] font-medium text-text-tertiary">
            {isRTL ? avatar.titleAr : avatar.titleEn}
          </p>
        </div>
      </div>
    </div>
  )
}
