'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  Link2,
  BookOpen,
  Bot,
  Activity,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  ShoppingBag,
} from 'lucide-react'

export default function HowItWorksSection() {
  const { isRTL } = useLang()
  const reducedMotion = useHydratedReducedMotion()

  const steps = [
    {
      num: '01',
      titleEn: 'Connect Your Channels',
      titleAr: 'اربط قنواتك ومنصاتك',
      descEn: 'Connect WhatsApp, Instagram, Telegram, Salla, or Shopify in under 60 seconds with official authorization.',
      descAr: 'اربط واتساب، إنستغرام، تلغرام، أو متاجرك في سلة وشوبيفاي خلال 60 ثانية بربط سحابي رسمي.',
      icon: Link2,
      accent: 'var(--brand)',
      tagEn: '1-Click Connect',
      tagAr: 'ربط بنقرة واحدة',
      details: [
        isRTL ? 'ربط رسمي بدون أكواد برمجية' : 'No coding required',
        isRTL ? 'دعم كامل للمراسلة والمتاجر' : 'Social & commerce channels',
      ],
    },
    {
      num: '02',
      titleEn: 'Train Your AI Assistant',
      titleAr: 'درّب مساعدك الذكي',
      descEn: 'Upload your business policies, FAQs, price lists, or catalog. The AI learns your exact brand tone.',
      descAr: 'أضف سياسات نشاطك التجاري، الأسئلة الشائعة، وكتالوج الأسعار. يتعلم الذكاء الاصطناعي أسلوبك بدقة.',
      icon: BookOpen,
      accent: 'var(--brand-cyan)',
      tagEn: 'Business Knowledge',
      tagAr: 'معرفة نشاطك التجاري',
      details: [
        isRTL ? 'رفع ملفات PDF وExcel' : 'PDF & Excel file upload',
        isRTL ? 'تحديد نبرة الرد والحدود' : 'Custom tone & guardrails',
      ],
    },
    {
      num: '03',
      titleEn: 'Automate Conversations',
      titleAr: 'أطلق الردود المؤتمتة',
      descEn: 'AI handles customer inquiries 24/7, answers questions, checks live order statuses, and recommends products.',
      descAr: 'يجيب الذكاء الاصطناعي 24/7، يتحقق من حالة الطلبات لحظياً، ويرشح المنتجات المناسبة لعملائك.',
      icon: Bot,
      accent: 'var(--brand-violet)',
      tagEn: 'Autonomous Engine',
      tagAr: 'رد ذاتي متواصل',
      details: [
        isRTL ? 'استعلام الطلبات من المتجر' : 'Live order lookup from store',
        isRTL ? 'تصعيد فوري للمحادثات المعقدة' : 'Smart human escalation',
      ],
    },
    {
      num: '04',
      titleEn: 'Monitor Everything',
      titleAr: 'تابع وقس الأداء',
      descEn: 'Inspect every interaction, track customer satisfaction (CSAT), and jump into any conversation anytime.',
      descAr: 'شاهد كل محادثة في صندوق وارد موحد، تابع مؤشرات الرضا (CSAT)، وتدخل في أي محادثة متى أردت.',
      icon: Activity,
      accent: 'var(--brand-magenta)',
      tagEn: 'Unified Command',
      tagAr: 'لوحة قيادة شاملة',
      details: [
        isRTL ? 'صندوق بريد وارد مشترك' : 'Unified omnichannel inbox',
        isRTL ? 'تحليلات المبيعات وأوقات الرد' : 'CSAT & response analytics',
      ],
    },
  ]

  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
            <Zap size={13} />
            <span>{isRTL ? 'بساطة فائقة في البدء' : 'How Naz AutoReply Works'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? '4 خطوات بسيطة لتحويل خدمة عملائك ومبيعاتك' : 'From Connection to Full Automation in 4 Simple Steps'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'صممنا المنصة لتكون جاهزة للعمل خلال دقائق بدون أي تعقيد برمجي وبأعلى معايير الأمان.'
              : 'Deploy an enterprise-grade autonomous communication system tailored to your store in minutes.'}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated/90 p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                {/* Step Number Backdrop */}
                <div
                  className="pointer-events-none absolute -bottom-6 -right-4 text-7xl font-black text-text-tertiary/10 select-none"
                  aria-hidden="true"
                >
                  {step.num}
                </div>

                <div>
                  {/* Top: Icon + Badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-xs transition-transform group-hover:scale-105"
                      style={{ color: step.accent }}
                    >
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-bold text-text-secondary">
                      {isRTL ? step.tagAr : step.tagEn}
                    </span>
                  </div>

                  {/* Step Title & Description */}
                  <h3 className="text-xl font-black tracking-tight text-text-primary">
                    {isRTL ? step.titleAr : step.titleEn}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {isRTL ? step.descAr : step.descEn}
                  </p>
                </div>

                {/* Sub-features list */}
                <div className="mt-6 border-t border-border pt-4 space-y-2">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <CheckCircle2 size={13} className="shrink-0 text-success" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
