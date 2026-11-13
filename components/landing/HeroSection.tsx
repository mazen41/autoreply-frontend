'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Bot,
  Zap,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageCircle,
} from 'lucide-react'

// Dynamically lazy-load Three.js canvas to preserve initial bundle and avoid SSR issues
const Hero3DCanvas = dynamic(() => import('./Hero3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center">
      <div className="h-28 w-28 animate-pulse rounded-full border border-brand/20 bg-brand/5" />
    </div>
  ),
})

export default function HeroSection() {
  const { isRTL } = useLang()
  const { user } = useAuth()
  const reducedMotion = useHydratedReducedMotion()
  const heroRootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reducedMotion || !heroRootRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-animate-reveal',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      )
    }, heroRootRef)

    return () => ctx.revert()
  }, [reducedMotion])

  const copy = isRTL
    ? {
        badge: 'الجيل الجديد من أتمتة المحادثات الذكية',
        headline1: 'كل محادثة.',
        headlineHighlight: 'ذكاء اصطناعي واحد.',
        description:
          'أتمت محادثات عملائك عبر جميع قنوات المراسلة مع ردود ذكية، وسير عمل آلي متكامل، ومزامنة فورية مع متجرك الإلكتروني — من منصة موحدة واحدة.',
        primaryCta: user ? 'فتح لوحة التحكم' : 'ابدأ الأتمتة الآن',
        secondaryCta: 'استكشف المنصة',
        trustStat1: 'رد فوري 24/7',
        trustStat2: 'دقة فائقة في الفهم',
        trustStat3: 'ربط سحابي رسمي',
      }
    : {
        badge: 'Next-Gen Autonomous Conversational AI',
        headline1: 'Every Conversation.',
        headlineHighlight: 'One Intelligent AI.',
        description:
          'Automate customer conversations across your messaging channels with AI-powered replies, intelligent workflows, and business integrations — all managed from one platform.',
        primaryCta: user ? 'Go to Dashboard' : 'Start Automating',
        secondaryCta: 'Explore the Platform',
        trustStat1: 'Instant 24/7 Autonomous Replies',
        trustStat2: 'Domain-Trained Accuracy',
        trustStat3: 'Official Cloud APIs & Sync',
      }

  return (
    <section
      ref={heroRootRef}
      className="relative isolate min-h-[92svh] overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:flex lg:items-center lg:pb-24 lg:pt-36"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-[15%] left-1/2 h-[600px] w-[950px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(23, 105, 255, 0.18), rgba(0, 217, 255, 0.08) 50%, transparent 80%)',
          }}
        />
        <div
          className="absolute -bottom-[20%] right-[10%] h-[500px] w-[500px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(113, 60, 255, 0.14), transparent 70%)',
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          {/* Left Column: Hero Copy & Value Proposition */}
          <div className={`text-start ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}>
            {/* Status Pill */}
            <div className="hero-animate-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-surface-elevated/85 px-4 py-1.5 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <Sparkles size={13} className="text-brand" />
              <span className="text-xs font-bold text-text-primary">{copy.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-animate-reveal text-balance text-4xl font-black leading-[1.08] tracking-tight text-text-primary sm:text-6xl lg:text-[4.15rem]">
              <span>{copy.headline1}</span>{' '}
              <span
                className="inline-block bg-gradient-to-r from-brand via-brand-cyan to-brand-violet bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {copy.headlineHighlight}
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="hero-animate-reveal mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg sm:leading-8">
              {copy.description}
            </p>

            {/* CTAs */}
            <div className="hero-animate-reveal mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-brand/25"
                style={{
                  background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                  boxShadow: '0 8px 26px -4px rgba(23, 105, 255, 0.45)',
                }}
              >
                <span>{copy.primaryCta}</span>
                <ArrowRight
                  size={16}
                  className={`transition-transform group-hover:translate-x-1 ${
                    isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''
                  }`}
                />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-surface-elevated px-6 py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:border-brand/40 hover:bg-surface-hover"
              >
                <span>{copy.secondaryCta}</span>
                <ArrowUpRight size={15} className="text-brand" />
              </a>
            </div>

            {/* Key Confidence Metrics Bar */}
            <div className="hero-animate-reveal mt-10 grid grid-cols-3 gap-3 border-t border-border/80 pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-success" />
                <span className="text-xs font-semibold text-text-secondary">{copy.trustStat1}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-brand" />
                <span className="text-xs font-semibold text-text-secondary">{copy.trustStat2}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="shrink-0 text-brand-violet" />
                <span className="text-xs font-semibold text-text-secondary">{copy.trustStat3}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Three.js Interactive AI Node + Floating Live Badges */}
          <div className="relative flex items-center justify-center">
            {/* The 3D Intelligence Engine Canvas */}
            <div className="relative w-full max-w-[560px]">
              <Hero3DCanvas isRTL={isRTL} />

              {/* Floating Live Indicator Badges around 3D core */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, x: -16, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -left-2 top-10 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border/80 bg-surface-elevated/90 p-3 shadow-xl backdrop-blur-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <MessageCircle size={16} />
                </div>
                <div className="text-start">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {isRTL ? 'رد آلي فوري' : 'Omnichannel Influx'}
                  </span>
                  <span className="block text-xs font-black text-text-primary">
                    {isRTL ? 'واتساب، إنستغرام، تيك توك' : 'WhatsApp & IG Live'}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, x: 16, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -right-2 bottom-12 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border/80 bg-surface-elevated/90 p-3 shadow-xl backdrop-blur-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <ShoppingBag size={16} />
                </div>
                <div className="text-start">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {isRTL ? 'مزامنة المتجر الفورية' : 'Live Store Sync'}
                  </span>
                  <span className="block text-xs font-black text-text-primary">
                    {isRTL ? 'سلة، شوبيفاي، ووكومرس' : 'Salla & Shopify Orders'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
