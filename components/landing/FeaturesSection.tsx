'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  Inbox,
  Bot,
  Database,
  ShoppingBag,
  CalendarCheck,
  Truck,
  Workflow,
  Cpu,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function FeaturesSection() {
  const { isRTL } = useLang()
  const reducedMotion = useHydratedReducedMotion()

  const features = [
    {
      id: 'inbox',
      icon: Inbox,
      color: 'var(--brand)',
      titleEn: 'Omnichannel Inbox',
      titleAr: 'صندوق وارد موحد شامل',
      descEn: 'Bring WhatsApp, Instagram, TikTok, Telegram, and Facebook conversations into one clean, collaborative interface.',
      descAr: 'اجمع محادثات واتساب، إنستغرام، تيك توك، وتلغرام في صندوق وارد مركزي واحد لفريقك بالكامل.',
    },
    {
      id: 'ai-replies',
      icon: Bot,
      color: 'var(--brand-violet)',
      titleEn: 'Context-Aware AI Replies',
      titleAr: 'ردود ذكاء اصطناعي فاهمة للسياق',
      descEn: 'Generate accurate, friendly responses aligned with your business personality and trained on your store policies.',
      descAr: 'توليد ردود دقيقة ومحببة تناسب شخصية علامتك التجارية ومستندة إلى قواعد عملك المحددة.',
    },
    {
      id: 'knowledge',
      icon: Database,
      color: 'var(--brand-cyan)',
      titleEn: 'Dynamic Knowledge Base',
      titleAr: 'قاعدة معرفة ديناميكية متطورة',
      descEn: 'Upload PDFs, Excel sheets, FAQs, and pricing tables. The AI references your verified data before answering.',
      descAr: 'ارفع ملفات PDF، جداول Excel، والأسئلة الشائعة. يرجع الذكاء الاصطناعي لمعلوماتك المعتمدة فقط.',
    },
    {
      id: 'orders',
      icon: ShoppingBag,
      color: '#00B4D8',
      titleEn: 'Live Order Management',
      titleAr: 'استعلام ومتابعة الطلبات لحظياً',
      descEn: 'Customers can ask "Where is my order?" and get immediate live updates via Salla, Shopify, and WooCommerce sync.',
      descAr: 'يستطيع العميل السؤال عن حالة طلبه والحصول على التحديث فوراً بفضل التكامل المباشر مع متاجرك.',
    },
    {
      id: 'appointments',
      icon: CalendarCheck,
      color: '#95BF47',
      titleEn: 'Appointment Assistance',
      titleAr: 'مساعد حجز المواعيد والاستشارات',
      descEn: 'Handle booking queries, qualification questions, working hours, and clinic/service schedules effortlessly.',
      descAr: 'إدارة استفسارات الحجوزات، تأهيل العملاء، وتوضيح مواعيد العمل للعيادات ومكاتب الخدمات.',
    },
    {
      id: 'shipping',
      icon: Truck,
      color: '#F59E0B',
      titleEn: 'Shipping & Delivery Tracking',
      titleAr: 'تتبع الشحنات والتوصيل السريع',
      descEn: 'Provide instant answers on delivery windows, shipping rates, carrier tracking links, and pickup points.',
      descAr: 'إجابات فورية عن أوقات التوصيل، تكاليف الشحن، وروابط تتبع الشحنات المباشرة لدى شركات النقل.',
    },
    {
      id: 'automation',
      icon: Workflow,
      color: '#8B5CF6',
      titleEn: 'Smart Workflow Automation',
      titleAr: 'سير عمل وأتمتة ذكية متسلسلة',
      descEn: 'Trigger automatic follow-ups, welcome sequences, inactive customer re-engagement, and tagged campaigns.',
      descAr: 'إطلاق رسائل ترحيبية آلية، تسلسلات متابعة ما بعد الطلب، وإعادة تنشيط العملاء المتوقفين.',
    },
    {
      id: 'providers',
      icon: Cpu,
      color: 'var(--brand-magenta)',
      titleEn: 'Multi-LLM Flexibility',
      titleAr: 'مرونة بين أقوى نماذج الذكاء',
      descEn: 'Powered by OpenAI GPT-4o, Anthropic Claude 3.5, and Google Gemini with smart fallback failover.',
      descAr: 'مدعوم بنماذج OpenAI GPT-4o وClaude وGoogle Gemini مع تحويل ذكي وسريع لحماية استمرارية العمل.',
    },
    {
      id: 'realtime',
      icon: Activity,
      color: '#10B981',
      titleEn: 'Real-Time Insights & Analytics',
      titleAr: 'رؤى وتحليلات الأداء الفورية',
      descEn: 'Track response times, automation percentage, resolution rates, and CSAT customer ratings from your dashboard.',
      descAr: 'راقب سرعة الاستجابة، نسبة الردود الذاتية، ومؤشرات رضا العملاء لحظة بلحظة من شاشتك.',
    },
  ]

  return (
    <section id="features" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
            <Sparkles size={13} />
            <span>{isRTL ? 'إمكانيات برمجية شاملة' : 'Core Capabilities'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? 'كل ما تحتاجه لإدارة محادثاتك باحترافية' : 'Everything You Need for Enterprise Autonomous Operations'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'مجموعة أدوات متكاملة مصممة خصيصاً لأصحاب المتاجر الإلكترونية والشركات المتنامية لزيادة المبيعات وتقليل تكلفة خدمة العملاء.'
              : 'A complete suite of conversational AI tools built to boost revenue, slash resolution times, and elevate buyer satisfaction.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.article
                key={feature.id}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated/80 p-7 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                <div>
                  {/* Icon */}
                  <div
                    className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-xs transition-transform group-hover:scale-110"
                    style={{ color: feature.color }}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-black tracking-tight text-text-primary">
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {isRTL ? feature.descAr : feature.descEn}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-text-tertiary">
                  <CheckCircle2 size={13} className="text-success" />
                  <span>{isRTL ? 'ميزة أساسية مفعلة' : 'Production-Ready'}</span>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
