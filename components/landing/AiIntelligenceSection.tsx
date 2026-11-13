'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  Cpu,
  Brain,
  Shield,
  FileCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  Lock,
  Workflow,
} from 'lucide-react'

export default function AiIntelligenceSection() {
  const { isRTL } = useLang()
  const reducedMotion = useHydratedReducedMotion()

  const pillars = [
    {
      icon: Brain,
      titleEn: 'Grounding in Real Business Data',
      titleAr: 'تأصيل الردود في بياناتك المعتمدة',
      descEn: 'The assistant only answers based on your verified FAQs, uploaded PDFs, price lists, and store catalog — eliminating hallucinations.',
      descAr: 'يجيب المساعد فقط استناداً إلى الأسئلة الشائعة، ملفات PDF المرفوعة، وكتالوج متجرك — لمنع أي تخمين أو معلومات غير صحيحة.',
    },
    {
      icon: Sliders,
      titleEn: 'Custom Persona & Behavioral Guardrails',
      titleAr: 'تخصيص كامل للشخصية والضوابط',
      descEn: 'Choose your desired tone (friendly, formal, Saudi conversational, concise) and define explicit boundary rules for sensitive topics.',
      descAr: 'اختر نبرة الرد المناسبة لعلامتك (ودود، رسمي، سعودي دارج، موجز) وحدد بدقة حدود الأسعار والخصومات والسياسات.',
    },
    {
      icon: Cpu,
      titleEn: 'Multi-Model Fallback Architecture',
      titleAr: 'بنية تشغيل سحابية متعددة النماذج',
      descEn: 'Runs on state-of-the-art models from OpenAI, Anthropic, and Google Gemini with automatic failover for 99.9% uptime.',
      descAr: 'يعمل عبر أقوى نماذج الذكاء العالمية مع تحويل تلقائي فوري لحماية تجربة عملائك من أي انقطاع في مزودات الخدمة.',
    },
    {
      icon: Shield,
      titleEn: 'Automated Confidence & Human Escalation',
      titleAr: 'مؤشر ثقة وتحويل ذكي لفريقك',
      descEn: 'When inquiry confidence drops below your designated threshold or if a customer requests human support, the conversation routes to your team.',
      descAr: 'إذا انخفض مؤشر الثقة عن الحد الذي حددته أو طلب العميل التحدث مع موظف، يتم إشعار فريقك فوراً للتدخل.',
    },
  ]

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute -left-32 top-1/2 -z-10 h-[500px] w-[700px] -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(113, 60, 255, 0.12), rgba(0, 217, 255, 0.06), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-violet/20 bg-brand-violet/10 px-3.5 py-1 text-xs font-bold text-brand-violet">
            <Cpu size={13} />
            <span>{isRTL ? 'هندسة الذكاء الاصطناعي الموثوق' : 'Verified AI Intelligence'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? 'ذكاء اصطناعي فاهم لنشاطك، دقيق وموثوق 100%' : 'Smart, Safe & Truly Trained on Your Business'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'لا نعتمد على ردود عامة. نذير مصمم ليلتزم تماماً بسياساتك ومعلوماتك الحقيقية ليمنح عملاءك تجربة تسوق احترافية.'
              : 'Never generic. Naz grounds every response in your actual company documents, maintaining your brand voice with absolute fidelity.'}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, index) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.titleEn}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated/85 p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-brand shadow-xs transition-transform group-hover:scale-105">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-text-primary">
                    {isRTL ? p.titleAr : p.titleEn}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {isRTL ? p.descAr : p.descEn}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 border-t border-border pt-4 text-xs font-bold text-success">
                  <CheckCircle2 size={13} />
                  <span>{isRTL ? 'محمي بالضوابط الأمنية' : 'Enterprise Safeguards'}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
