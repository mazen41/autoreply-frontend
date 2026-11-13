'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

export default function FinalCtaSection() {
  const { isRTL } = useLang()
  const { user } = useAuth()

  const copy = isRTL
    ? {
        badge: 'ابدأ الأتمتة خلال 3 دقائق',
        headline: 'توقف عن إدارة محادثاتك يدوياً.',
        supporting:
          'اجمع قنوات المراسلة، ذكاءك الاصطناعي، وسير عمل متجرك في منصة موحدة واحدة مع نذير أوتوريبلاي.',
        cta: user ? 'الانتقال إلى لوحة التحكم' : 'ابدأ تجربتك المجانية اليوم',
        trust1: 'تجربة مجانية كاملة 14 يوماً',
        trust2: 'بدون الحاجة لبطاقة ائتمانية',
        trust3: 'إلغاء في أي وقت بدون التزامات',
      }
    : {
        badge: 'Ready to Deploy in Under 3 Minutes',
        headline: 'Stop Managing Conversations Manually.',
        supporting:
          'Bring your messaging channels, AI assistant, and store workflows together with Naz AutoReply.',
        cta: user ? 'Go to Dashboard' : 'Get Started Today',
        trust1: '14-Day Full Business Trial',
        trust2: 'No Credit Card Required',
        trust3: 'Cancel Anytime With Zero Friction',
      }

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-12 sm:px-6 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-[36px] border border-brand/30 px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20 lg:py-24"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--brand) 12%, var(--surface)) 0%, var(--surface-elevated) 50%, color-mix(in srgb, var(--brand-violet) 14%, var(--surface)) 100%)',
          }}
        >
          {/* Ambient Lighting Orbs */}
          <div
            className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-[100px]"
            style={{ background: 'rgba(23, 105, 255, 0.25)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full blur-[100px]"
            style={{ background: 'rgba(113, 60, 255, 0.25)' }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl">
            {/* Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand shadow-sm">
              <Sparkles size={14} />
              <span>{copy.badge}</span>
            </div>

            {/* Headline */}
            <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              {copy.headline}
            </h2>

            {/* Supporting Text */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              {copy.supporting}
            </p>

            {/* CTA Button */}
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="group relative inline-flex min-h-12 items-center gap-2.5 overflow-hidden rounded-2xl px-8 py-4 text-base font-black text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30"
                style={{
                  background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                  boxShadow: '0 10px 30px -4px rgba(23, 105, 255, 0.5)',
                }}
              >
                <span>{copy.cta}</span>
                <ArrowRight
                  size={18}
                  className={`transition-transform group-hover:translate-x-1 ${
                    isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''
                  }`}
                />
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-text-secondary">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-success" />
                <span>{copy.trust1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-brand" />
                <span>{copy.trust2}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={15} className="text-brand-violet" />
                <span>{copy.trust3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
