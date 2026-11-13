'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  Bot,
  User,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Truck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

interface Scenario {
  id: string
  titleEn: string
  titleAr: string
  channel: string
  channelIcon: string
  channelColor: string
  customerMessageEn: string
  customerMessageAr: string
  customerTime: string
  aiProcessingStepsEn: string[]
  aiProcessingStepsAr: string[]
  aiResponseEn: string
  aiResponseAr: string
  actionCard?: {
    typeEn: string
    typeAr: string
    titleEn: string
    titleAr: string
    detailEn: string
    detailAr: string
    tagEn: string
    tagAr: string
  }
}

const SCENARIOS: Scenario[] = [
  {
    id: 'order',
    titleEn: 'Live Order Tracking',
    titleAr: 'تتبع الطلب لحظياً',
    channel: 'WhatsApp',
    channelIcon: '/icons/whatsapp.svg',
    channelColor: '#25D366',
    customerMessageEn: 'Hi! Could you check where my order #8492 is? Ordered yesterday to Riyadh.',
    customerMessageAr: 'السلام عليكم، وين وصل طلبي رقم #8492؟ طلبته أمس للرياض.',
    customerTime: '11:15 AM',
    aiProcessingStepsEn: [
      'Intent: Order Status Query',
      'API Call: Salla/Shopify Orders Endpoint',
      'Status: Out for Delivery (SMSA Express #910283)',
    ],
    aiProcessingStepsAr: [
      'الهدف: الاستعلام عن حالة الطلب',
      'استدعاء فوري: واجهة متجر سلة / شوبيفاي',
      'النتيجة: خرج للتوصيل عبر سمسا (#910283)',
    ],
    aiResponseEn:
      'Hello Faisal! Your order #8492 is already out for delivery with SMSA Express today 🚚 Estimated arrival: between 2:00 PM and 5:00 PM.',
    aiResponseAr:
      'أهلاً بك أستاذ فيصل! طلبك رقم #8492 تم شحنه وهو حالياً في مرحلة التوصيل مع سمسا إكسبريس 🚚 موعد التسليم المتوقع اليوم بين 2:00 و 5:00 عصراً.',
    actionCard: {
      typeEn: 'Store Integration Action',
      typeAr: 'إجراء متجر إلكتروني',
      titleEn: 'SMSA Tracking: #910283-SA',
      titleAr: 'تتبع سمسا: #910283-SA',
      detailEn: 'Carrier status: Courier assigned & dispatched to destination address.',
      detailAr: 'حالة الشحنة: تم إسناد الشحنة لمندوب التوصيل في الرياض.',
      tagEn: 'Live Synced',
      tagAr: 'محدث فورياً',
    },
  },
  {
    id: 'policy',
    titleEn: 'Store Policy & Returns',
    titleAr: 'سياسة الاستبدال والاسترجاع',
    channel: 'Instagram DM',
    channelIcon: '/icons/instagram.svg',
    channelColor: '#E4405F',
    customerMessageEn: 'Do you offer returns if the perfume fragrance does not suit me?',
    customerMessageAr: 'لو سمحت إذا العطر ما ناسبني أقدر استرجعه؟ وايش شروطكم؟',
    customerTime: '01:22 PM',
    aiProcessingStepsEn: [
      'Intent: Return & Refund Policy Query',
      'Knowledge Base: Indexed "Return-Policy-2026.pdf"',
      'Rule: 7 days free returns with complimentary sample spray',
    ],
    aiProcessingStepsAr: [
      'الهدف: استعلام عن شروط الاسترجاع',
      'قاعدة المعرفة: مستند "سياسة-الاسترجاع.pdf"',
      'الشرط: استرجاع مجاني خلال 7 أيام مع عينة تجربة مرفقة',
    ],
    aiResponseEn:
      'Absolutely! We include a free 2ml discovery sample with every perfume. As long as the main bottle remains sealed, you can return it within 7 days with zero return fees!',
    aiResponseAr:
      'أكيد يسعدنا خدمتك! نرفق مع كل عطر عينة تجربة مجانية (2 مل)؛ طالما العبوة الأساسية مغلفة يمكنك طلب الاسترجاع مجاناً بالكامل خلال 7 أيام من الاستلام 🌸',
    actionCard: {
      typeEn: 'Verified Knowledge Base Match',
      typeAr: 'مرجع قاعدة المعرفة المعتمد',
      titleEn: 'Policy Doc: Returns & Guarantee v2.4',
      titleAr: 'المستند: سياسة الضمان والاسترجاع',
      detailEn: 'Confidence score: 99.2% • Human escalation: Not needed',
      detailAr: 'مستوى الثقة: 99.2% • التدخل البشري: غير مطلوب',
      tagEn: 'Direct Citation',
      tagAr: 'اقتباس مباشر',
    },
  },
  {
    id: 'booking',
    titleEn: 'Appointment Booking',
    titleAr: 'حجز المواعيد والاستشارات',
    channel: 'Telegram Bot',
    channelIcon: '/icons/telegram.svg',
    channelColor: '#2AABEE',
    customerMessageEn: 'Are there any consultation slots available for skin diagnosis tomorrow afternoon?',
    customerMessageAr: 'مرحباً، هل عندكم موعد فحص استشاري متاح بكرة بعد العصر؟',
    customerTime: '04:40 PM',
    aiProcessingStepsEn: [
      'Intent: Booking & Availability Lookup',
      'Calendar Sync: Clinic Appointment Engine',
      'Found: 2 slots open at 4:30 PM and 6:00 PM',
    ],
    aiProcessingStepsAr: [
      'الهدف: الاستعلام عن توفر موعد استشارة',
      'مزامنة التقويم: نظام مواعيد العيادة',
      'النتيجة: خانتان متاحتان غداً 4:30 و 6:00 مساءً',
    ],
    aiResponseEn:
      'Yes, Dr. Sarah has 2 slots open tomorrow: 4:30 PM and 6:00 PM. Shall I reserve the 4:30 PM slot for you?',
    aiResponseAr:
      'نعم متوفر غداً موعدان متاحان مع الدكتورة سارة: الساعة 4:30 عصراً أو 6:00 مساءً. هل ترغب بحجز موعد 4:30 عصراً لك مباشرة؟',
    actionCard: {
      typeEn: 'Calendar Slot Reservation',
      typeAr: 'حجز موعد تقويم معتمد',
      titleEn: 'Slot: Tomorrow 4:30 PM (Clinic Center)',
      titleAr: 'الموعد: غداً 4:30 عصراً (فرع العيادة)',
      detailEn: 'Auto-hold: 10 minutes pending customer confirmation.',
      detailAr: 'حجز مؤقت لمدة 10 دقائق بانتظار تأكيد العميل.',
      tagEn: 'Slot Available',
      tagAr: 'خانة متاحة',
    },
  },
]

export default function ProductDemoSection() {
  const { isRTL } = useLang()
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0])
  const reducedMotion = useHydratedReducedMotion()

  return (
    <section id="demo" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-violet/20 bg-brand-violet/10 px-3.5 py-1 text-xs font-bold text-brand-violet">
            <Sparkles size={13} />
            <span>{isRTL ? 'عرض تفاعلي مباشر' : 'Interactive Product Experience'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? 'شاهد الذكاء الاصطناعي أثناء العمل الحقيقي' : 'See Autonomous Communication in Real Action'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'اختر سيناريو لتجربة كيف يفهم نذير قصد العميل، يرجع للبيانات المعتمدة، وينفذ الإجراء المناسب في ثوانٍ.'
              : 'Switch scenarios below to inspect how Naz understands queries, pulls live context, and triggers business actions.'}
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-xs font-bold transition-all sm:text-sm ${
                  isSelected
                    ? 'border-brand bg-surface-elevated text-brand shadow-md shadow-brand/10'
                    : 'border-border bg-surface-elevated/60 text-text-secondary hover:border-brand/40 hover:text-text-primary'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-surface p-0.5">
                  <Image src={sc.channelIcon} alt={sc.channel} width={16} height={16} />
                </span>
                <span>{isRTL ? sc.titleAr : sc.titleEn}</span>
              </button>
            )
          })}
        </div>

        {/* Interactive Chat Console Window */}
        <div className="mt-12 mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 shadow-2xl backdrop-blur-xl">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface-secondary/60 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Image src={selectedScenario.channelIcon} alt="" width={16} height={16} />
                <span className="text-xs font-bold text-text-primary">{selectedScenario.channel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-bold text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span>{isRTL ? 'معالجة مباشرة' : 'Live Autonomous Session'}</span>
            </div>
          </div>

          {/* Conversation Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedScenario.id}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 space-y-6"
            >
              {/* 1. Customer Message */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-tertiary">
                  <User size={18} />
                </div>
                <div className="max-w-[85%] rounded-3xl rounded-tl-sm border border-border bg-surface-secondary/70 p-4 shadow-2xs">
                  <div className="mb-1 flex items-center justify-between gap-4 text-[10px] text-text-tertiary">
                    <span className="font-bold text-text-secondary">{isRTL ? 'العميل' : 'Customer'}</span>
                    <span>{selectedScenario.customerTime}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-text-primary">
                    {isRTL ? selectedScenario.customerMessageAr : selectedScenario.customerMessageEn}
                  </p>
                </div>
              </div>

              {/* 2. AI Reasoning / Step Breakdown (Visible Inspection) */}
              <div className="my-2 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-xs">
                <div className="mb-2.5 flex items-center gap-2 font-bold text-brand">
                  <Sparkles size={14} />
                  <span>{isRTL ? 'خطوات التحليل اللحظي للمساعد' : 'Autonomous AI Chain of Reasoning'}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(isRTL ? selectedScenario.aiProcessingStepsAr : selectedScenario.aiProcessingStepsEn).map(
                    (step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-brand/10 bg-surface-elevated/70 p-2 text-text-secondary"
                      >
                        <CheckCircle2 size={13} className="shrink-0 text-brand-cyan" />
                        <span className="truncate text-[11px] font-semibold">{step}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 3. AI Generated Response */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-[90%] rounded-3xl rounded-tr-sm bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/80">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Bot size={15} />
                      <span>{isRTL ? 'نذير - الرد الذكي المعتمد' : 'Naz Autonomous AI'}</span>
                    </div>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">99.4% Match</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white">
                    {isRTL ? selectedScenario.aiResponseAr : selectedScenario.aiResponseEn}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                  <Bot size={18} />
                </div>
              </div>

              {/* 4. Action Card / Verification Context */}
              {selectedScenario.actionCard && (
                <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      {isRTL ? selectedScenario.actionCard.typeAr : selectedScenario.actionCard.typeEn}
                    </span>
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                      {isRTL ? selectedScenario.actionCard.tagAr : selectedScenario.actionCard.tagEn}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-text-primary">
                      {isRTL ? selectedScenario.actionCard.titleAr : selectedScenario.actionCard.titleEn}
                    </h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      {isRTL ? selectedScenario.actionCard.detailAr : selectedScenario.actionCard.detailEn}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer note */}
          <div className="border-t border-border bg-surface-secondary/40 px-6 py-3 text-center text-[11px] text-text-tertiary">
            {isRTL
              ? 'مثال توضيحي تفاعلي — تعتمد الردود الفعلية على مستندات متجرك وقواعد العمل التي تحددها.'
              : 'Interactive demonstration — live responses strictly adhere to your uploaded store documents and custom guardrails.'}
          </div>
        </div>
      </div>
    </section>
  )
}
