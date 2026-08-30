'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

// ─── Lightweight visibility hook (IntersectionObserver, no framer-motion) ────
function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Count-up (only starts when visible) ─────────────────────────────────────
function CountUp({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const { ref, visible } = useVisible(0.3)
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const t0 = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, to, duration])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ─── Fade-in wrapper (CSS only, no framer-motion) ─────────────────────────────
function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const { ref, visible } = useVisible(0.1)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Thin animated progress bar ───────────────────────────────────────────────
function Bar({ pct, delay = 0, color = 'var(--accent)' }: { pct: number; delay?: number; color?: string }) {
  const { ref, visible } = useVisible(0.2)
  return (
    <div ref={ref} className="h-1.5 rounded-full w-full" style={{ background: 'var(--border)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: visible ? `${pct}%` : '0%',
          background: color,
          transition: `width 1.2s ease ${delay}ms`,
        }}
      />
    </div>
  )
}

// ─── Static section label ─────────────────────────────────────────────────────
function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <FadeIn className="flex items-center justify-center gap-2 mb-10">
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>{icon}</span>
        <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>{text}</span>
      </div>
    </FadeIn>
  )
}

// ─── AI Core (pure CSS, no JS animation) ─────────────────────────────────────
function AICore({ size = 120 }: { size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {/* Orbit rings – CSS animation only */}
      <div className="absolute rounded-full os-orbit-cw" style={{
        width: s * 0.93, height: s * 0.93,
        border: '1px solid var(--border)',
        borderTop: '1px solid var(--accent)',
      }} />
      <div className="absolute rounded-full os-orbit-ccw" style={{
        width: s * 0.72, height: s * 0.72,
        border: '1px solid var(--border)',
        borderBottom: '1px solid var(--accent)',
      }} />
      {/* Core */}
      <div className="relative flex items-center justify-center rounded-full os-core-glow" style={{
        width: s * 0.52, height: s * 0.52,
        background: 'var(--surface)',
        border: '2px solid var(--border)',
      }}>
        <span style={{ fontSize: s * 0.2, color: 'var(--accent)' }}>✦</span>
      </div>
    </div>
  )
}

// ─── SCREEN 01 — CORE / HERO ─────────────────────────────────────────────────
function ScreenCore({ isRTL }: { isRTL: boolean }) {
  const metrics = [
    { labelAr: 'محادثة نشطة',    labelEn: 'Active Convos',   to: 247,  suffix: '' },
    { labelAr: 'رد اليوم',        labelEn: 'Replies Today',   to: 3842, suffix: '+' },
    { labelAr: 'عميل محتمل',      labelEn: 'Leads Generated', to: 128,  suffix: '' },
    { labelAr: 'ثانية للرد',     labelEn: 'Avg Response',    to: 8,    suffix: 's' },
  ]

  return (
    <section className="relative flex flex-col items-center justify-center py-28 px-4 text-center">
      {/* Status pill */}
      <FadeIn>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <span className="os-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'نظام الذكاء الاصطناعي — مشغّل' : 'AI OPERATING SYSTEM — ONLINE'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>v4.1.0</span>
        </div>
      </FadeIn>

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 w-full max-w-2xl">
        {metrics.map((m, i) => (
          <FadeIn key={i} delay={i * 80}>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-black mb-1" style={{ color: 'var(--accent)', letterSpacing: '-0.04em' }}>
                <CountUp to={m.to} suffix={m.suffix} />
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? m.labelAr : m.labelEn}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Core visual */}
      <FadeIn delay={100} className="mb-10">
        <AICore size={180} />
      </FadeIn>

      {/* Headline */}
      <FadeIn delay={150} className="max-w-3xl">
        <h2 className="font-black leading-tight mb-4"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 4.2rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
          {isRTL ? 'ندير مراسلاتك ومبيعاتك بذكاء.' : 'Manage Your Messages And Sales With AI.'}
        </h2>
        <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          {isRTL
            ? 'منصة ذكاء اصطناعي تتولى الردود، تبني العلاقات، وتحول الرسائل إلى عملاء — تلقائياً.'
            : 'An AI that handles replies, builds relationships, and converts messages into customers — automatically.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary px-8 py-3.5 rounded-xl font-bold text-base" style={{ textAlign: 'center' }}>
            {isRTL ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
          </Link>
          <Link href="/pricing" className="btn-secondary px-7 py-3.5 rounded-xl font-bold text-base" style={{ textAlign: 'center' }}>
            {isRTL ? 'عرض الأسعار' : 'View Pricing'}
          </Link>
        </div>
      </FadeIn>
    </section>
  )
}

// ─── SCREEN 02 — UNIFIED INBOX ─────────────────────────────────────────────
function ScreenInbox({ isRTL }: { isRTL: boolean }) {
  const channels = [
    { icon: '💬', label: 'WhatsApp',  stat: '340 ردود اليوم',   statEn: '340 replies today' },
    { icon: '📸', label: 'Instagram', stat: '128 تعليق رُدّ',   statEn: '128 comments replied' },
    { icon: '📧', label: 'Email',     stat: '56 بريد معالج',    statEn: '56 emails handled' },
    { icon: '🌐', label: 'Website',   stat: '89 محادثة مباشرة', statEn: '89 live chats' },
  ]
  const messages = [
    { icon: '💬', name: 'Ahmed K.',  platform: 'WhatsApp',  msgAr: 'هل التوصيل متاح؟',         msgEn: 'Is delivery available?',   status: 'AI ✓', ok: true },
    { icon: '📸', name: 'سارة م.',  platform: 'Instagram', msgAr: 'ما هي ساعات العمل؟',        msgEn: 'What are the hours?',      status: '⏳',   ok: false },
    { icon: '📧', name: 'Nora H.',   platform: 'Email',     msgAr: 'حجز طاولة لـ 4 أشخاص',    msgEn: 'Table for 4 please',       status: 'AI ✓', ok: true },
    { icon: '🌐', name: 'خالد ع.',   platform: 'Website',   msgAr: 'كم سعر الباقة؟',            msgEn: 'Business plan price?',     status: '⚡',   ok: true },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionLabel icon="●" text={isRTL ? 'الصندوق الموحد' : 'UNIFIED INBOX'} />

        <FadeIn className="text-center mb-14">
          <h2 className="font-black mb-3"
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'رسائل تتحول إلى نتائج.' : 'Messages become outcomes.'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? 'كل قناة تتدفق في نظام واحد. الذكاء الاصطناعي يرد، يصنّف، ويتابع.' : 'Every channel flows into one system. AI replies, classifies, and follows up.'}
          </p>
        </FadeIn>

        {/* Channels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {channels.map((ch, i) => (
            <FadeIn key={i} delay={i * 70}>
              <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-2">{ch.icon}</div>
                <div className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{ch.label}</div>
                <div className="text-[11px]" style={{ color: 'var(--accent)' }}>{isRTL ? ch.stat : ch.statEn}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Live feed */}
        <div className="space-y-2">
          {messages.map((m, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                    <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{m.platform}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {isRTL ? m.msgAr : m.msgEn}
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                  style={{ background: m.ok ? 'var(--accent-subtle)' : 'var(--surface-elevated)', color: m.ok ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {m.status}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SCREEN 03 — CAPABILITIES ─────────────────────────────────────────────────
function ScreenBrain({ isRTL }: { isRTL: boolean }) {
  const caps = [
    { icon: '🎯', ar: 'تأهيل العملاء',     en: 'Lead Qualification' },
    { icon: '💬', ar: 'دعم العملاء',        en: 'Customer Support' },
    { icon: '⭐', ar: 'استرداد التقييمات',  en: 'Review Recovery' },
    { icon: '✍️', ar: 'توليد المحتوى',      en: 'Content Generation' },
    { icon: '💰', ar: 'أتمتة المبيعات',     en: 'Sales Automation' },
    { icon: '📥', ar: 'الوارد الموحد',       en: 'Unified Inbox' },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionLabel icon="⬡" text={isRTL ? 'شبكة القدرات' : 'CAPABILITY NETWORK'} />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <FadeIn>
            <h2 className="font-black mb-4"
              style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              {isRTL ? 'عقل متصل بكل شيء.' : 'A brain connected to everything.'}
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL
                ? 'ست قدرات أساسية تعمل معاً لتحويل مراسلاتك إلى محرك نمو.'
                : 'Six core capabilities working together to turn your messages into a growth engine.'}
            </p>
            <div className="flex justify-center lg:justify-start">
              <AICore size={140} />
            </div>
          </FadeIn>

          {/* Right grid */}
          <div className="grid grid-cols-2 gap-3">
            {caps.map((c, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isRTL ? c.ar : c.en}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SCREEN 04 — AUTOMATION ───────────────────────────────────────────────────
function ScreenAutomation({ isRTL }: { isRTL: boolean }) {
  const steps = [
    { icon: '💬', ar: 'رسالة واردة',  en: 'Message In' },
    { icon: '🧠', ar: 'الذكاء يحلل', en: 'AI Analyzes' },
    { icon: '⚡', ar: 'إجراء تلقائي', en: 'Auto Action' },
    { icon: '🎯', ar: 'نتيجة محققة',  en: 'Result Achieved' },
  ]
  const automations = [
    { icon: '🌙', ar: 'الرد بعد الدوام',    en: 'After-Hours Reply',    descAr: 'يرد على كل رسالة خارج ساعات العمل فوراً', descEn: 'Instantly replies outside business hours', badgeAr: '100% ردود', badgeEn: '100% coverage' },
    { icon: '⭐', ar: 'استرداد التقييمات', en: 'Review Recovery',       descAr: 'يكتشف عدم الرضا قبل التقييم السلبي',     descEn: 'Detects dissatisfaction before a bad review', badgeAr: '−60% سلبي', badgeEn: '−60% bad reviews' },
    { icon: '💰', ar: 'أتمتة المبيعات',    en: 'Sales Automation',      descAr: 'يحول الاستفسارات إلى مبيعات بمسار منظم',  descEn: 'Converts inquiries into sales with a structured funnel', badgeAr: '+35% تحويل', badgeEn: '+35% conversion' },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionLabel icon="◈" text={isRTL ? 'شبكة الأتمتة' : 'AUTOMATION NETWORK'} />

        <FadeIn className="text-center mb-14">
          <h2 className="font-black mb-3"
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'الرسالة تصل. الذكاء يعمل.' : 'Message in. Magic out.'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? 'مسارات تلقائية تعمل في الخلفية بدون تدخل.' : 'Automated workflows running silently — without you.'}
          </p>
        </FadeIn>

        {/* Flow steps */}
        <div className="flex items-center justify-between gap-2 mb-14 max-w-2xl mx-auto">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <FadeIn delay={i * 80} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}>
                  {s.icon}
                </div>
                <span className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? s.ar : s.en}
                </span>
              </FadeIn>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 h-px w-8" style={{ background: 'var(--border)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Automation cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {automations.map((a, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                    {a.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {isRTL ? a.badgeAr : a.badgeEn}
                  </span>
                </div>
                <h3 className="text-sm font-black mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? a.ar : a.en}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {isRTL ? a.descAr : a.descEn}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SCREEN 05 — BUSINESS IMPACT ─────────────────────────────────────────────
function ScreenImpact({ isRTL }: { isRTL: boolean }) {
  const stats = [
    { icon: '⚡', before: '48h',  after: '8s',   to: 8,  suffix: 's',  ar: 'وقت الرد',       en: 'Response Time' },
    { icon: '⭐', before: '3.1',  after: '4.8',  to: 48, suffix: '',   ar: 'تقييم جوجل',     en: 'Google Rating',  div: 10 },
    { icon: '💰', before: '12%',  after: '41%',  to: 41, suffix: '%',  ar: 'معدل التحويل',   en: 'Conversion Rate' },
    { icon: '✅', before: '60%',  after: '100%', to: 100, suffix: '%', ar: 'تغطية الردود',   en: 'Reply Coverage' },
  ]
  const bars = [
    { ar: 'رضا العملاء',  en: 'Customer Satisfaction', pct: 94 },
    { ar: 'سرعة الرد',    en: 'Response Speed',         pct: 98 },
    { ar: 'معدل التحويل', en: 'Conversion Rate',        pct: 41 },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionLabel icon="◉" text={isRTL ? 'التأثير على الأعمال' : 'BUSINESS IMPACT'} />

        <FadeIn className="text-center mb-14">
          <h2 className="font-black mb-3"
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'الأعمال تتحول أمام عينيك.' : 'Watch your business transform.'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? 'أرقام حقيقية من عملاء حقيقيين.' : 'Real numbers from real customers.'}
          </p>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  {isRTL ? 'قبل' : 'Before'} <span style={{ color: 'var(--text-secondary)' }}>{s.before}</span>
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent)', letterSpacing: '-0.04em' }}>
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? s.ar : s.en}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Progress bars */}
        <FadeIn delay={200}>
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-bold text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'متوسط النتائج بعد 30 يوم' : 'Average results after 30 days'}
            </div>
            {bars.map((b, i) => (
              <div key={i} className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: 'var(--text-secondary)' }}>{isRTL ? b.ar : b.en}</span>
                  <span style={{ color: 'var(--accent)' }}>{b.pct}%</span>
                </div>
                <Bar pct={b.pct} delay={i * 150} />
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── SCREEN 06 — PRICING / DEPLOY ─────────────────────────────────────────────
function ScreenDeploy({ isRTL }: { isRTL: boolean }) {
  const [annual, setAnnual] = useState(false)

  const plans = [
    { nameAr: 'تجريبي', nameEn: 'Starter',    price: 0,   priceA: 0,   featAr: ['50 رد/شهر', 'قناة واحدة', 'لوحة أساسية'],                 featEn: ['50 replies/mo', '1 channel', 'Basic dashboard'] },
    { nameAr: 'أساسي',  nameEn: 'Basic',       price: 49,  priceA: 39,  featAr: ['500 رد/شهر', 'قناتان', 'تقارير أسبوعية'],                   featEn: ['500 replies/mo', '2 channels', 'Weekly reports'] },
    { nameAr: 'أعمال',  nameEn: 'Business',    price: 99,  priceA: 79,  popular: true, featAr: ['ردود غير محدودة', 'كل القنوات', 'ذكاء متقدم', 'دعم 24/7'], featEn: ['Unlimited replies', 'All channels', 'Advanced AI', '24/7 support'] },
    { nameAr: 'مؤسسات', nameEn: 'Enterprise',  price: 249, priceA: 199, featAr: ['كل شيء في أعمال', 'خادم مخصص', 'SLA مضمون'],               featEn: ['Everything in Business', 'Dedicated server', 'Guaranteed SLA'] },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionLabel icon="⬡" text={isRTL ? 'اختر خطتك' : 'CHOOSE YOUR PLAN'} />

        <FadeIn className="text-center mb-8">
          <h2 className="font-black mb-3"
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'اختر مستوى التفعيل.' : 'Choose your activation tier.'}
          </h2>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-4 mt-4">
            <span className="text-sm" style={{ color: !annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {isRTL ? 'شهري' : 'Monthly'}
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-11 h-6 rounded-full transition-colors duration-300"
              style={{ background: annual ? 'var(--accent)' : 'var(--border)' }}
            >
              <span className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300"
                style={{ background: '#fff', left: annual ? 24 : 4 }} />
            </button>
            <span className="text-sm flex items-center gap-2" style={{ color: annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {isRTL ? 'سنوي' : 'Annual'}
              {annual && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                {isRTL ? 'وفر 20%' : 'Save 20%'}
              </span>}
            </span>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div
                className="rounded-2xl p-5 flex flex-col h-full relative"
                style={{
                  background: p.popular ? 'var(--surface-elevated)' : 'var(--surface)',
                  border: p.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                  boxShadow: p.popular ? '0 0 30px var(--accent-subtle)' : 'none',
                }}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: 'var(--accent)', color: '#fff' }}>
                      {isRTL ? 'الأكثر طلباً' : 'Most Popular'}
                    </span>
                  </div>
                )}
                <h3 className="text-base font-black mb-1" style={{ color: p.popular ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {isRTL ? p.nameAr : p.nameEn}
                </h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                    ${annual ? p.priceA : p.price}
                  </span>
                  <span className="text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>/{isRTL ? 'شهر' : 'mo'}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {(isRTL ? p.featAr : p.featEn).map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className="block text-center py-2.5 rounded-xl text-sm font-bold"
                  style={p.popular
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface-elevated)' }
                  }>
                  {isRTL ? 'ابدأ الآن' : 'Get Started'}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Trust row */}
        <FadeIn delay={300} className="flex items-center justify-center gap-6 mt-10">
          {[
            { icon: '🔒', ar: 'بدون بطاقة ائتمان', en: 'No credit card' },
            { icon: '✓',  ar: '14 يوم مجاني',      en: '14-day free trial' },
            { icon: '⚡', ar: 'إلغاء في أي وقت',   en: 'Cancel anytime' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
              {isRTL ? item.ar : item.en}
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <div className="flex-shrink-0 mx-4 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 11 }}>✦</span>
      </div>
      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function OSCanvas() {
  const { isRTL } = useLang()

  return (
    <div>
      <style>{`
        .os-orbit-cw  { animation: os-cw  12s linear infinite; }
        .os-orbit-ccw { animation: os-ccw 10s linear infinite; }
        .os-core-glow { animation: os-glow 3s ease-in-out infinite; }
        .os-pulse-dot { animation: os-pulse 2s ease-in-out infinite; }

        @keyframes os-cw   { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes os-ccw  { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes os-glow { 0%,100% { box-shadow: 0 0 12px var(--accent-subtle); } 50% { box-shadow: 0 0 28px var(--accent-subtle); } }
        @keyframes os-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      <ScreenCore isRTL={isRTL} />
      <Divider />
      <ScreenInbox isRTL={isRTL} />
      <Divider />
      <ScreenBrain isRTL={isRTL} />
      <Divider />
      <ScreenAutomation isRTL={isRTL} />
      <Divider />
      <ScreenImpact isRTL={isRTL} />
      <Divider />
      <ScreenDeploy isRTL={isRTL} />
    </div>
  )
}
