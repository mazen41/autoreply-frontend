'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  ShoppingBag,
  Share2,
  Calendar,
  Headphones,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function UseCasesSection() {
  const { isRTL } = useLang()
  const reducedMotion = useHydratedReducedMotion()

  const useCases = [
    {
      id: 'ecommerce',
      icon: ShoppingBag,
      color: '#00B4D8',
      titleEn: 'E-Commerce & Online Stores',
      titleAr: 'المتاجر الإلكترونية والتجزئة',
      descEn: 'Connect Salla, Shopify, or WooCommerce. Automate inquiries regarding stock availability, order tracking, returns, and payment links.',
      descAr: 'اربط متاجرك في سلة، شوبيفاي، أو ووكومرس. أتمت أسئلة توفر المقاسات والمخزون، تتبع الشحنات، وسياسات الاستبدال.',
      benefits: [
        isRTL ? 'استعلام فوري عن حالة الطلب' : 'Real-time order lookup',
        isRTL ? 'مشاركة روابط الدفع المباشرة' : 'Instant checkout link generation',
        isRTL ? 'تقليل تذاكر السؤال عن التوصيل' : 'Drastic drop in "where is my order" queries',
      ],
    },
    {
      id: 'social-creators',
      icon: Share2,
      color: '#E4405F',
      titleEn: 'High-Volume Social Brands',
      titleAr: 'العلامات التجارية عبر السوشيال ميديا',
      descEn: 'Capture customers in Instagram DMs, TikTok video comments, and Facebook messages before they click away or go to a competitor.',
      descAr: 'تفاعل فوري في رسائل إنستغرام الخاصة، وتعليقات تيك توك وماسنجر لتحويل المتابعين إلى مشترين قبل مغادرتهم.',
      benefits: [
        isRTL ? 'الرد الفوري على تعليقات المنشورات' : 'Instant reply to post comments',
        isRTL ? 'توجيه المتابعين لصفحة الشراء' : 'Automated traffic routing to products',
        isRTL ? 'استجابة لحظية في ثوانٍ معدودة' : 'Zero delay during viral marketing campaigns',
      ],
    },
    {
      id: 'appointment-services',
      icon: Calendar,
      color: '#95BF47',
      titleEn: 'Clinics & Appointment Services',
      titleAr: 'العيادات والخدمات بالحجز المسبق',
      descEn: 'Answer questions about available specialists, clinic locations, service fees, prep instructions, and booking slots.',
      descAr: 'الإجابة عن الأطباء المتاحين، مواقع الفروع، أسعار الكشوفات والخدمات، وتفاصيل حجز المواعيد المؤكدة.',
      benefits: [
        isRTL ? 'تأهيل المريض أو العميل قبل الحجز' : 'Pre-qualification before booking',
        isRTL ? 'إرسال تعليمات التحضير والاستقبال' : 'Automated pre-visit preparation tips',
        isRTL ? 'تقليل التخلف عن المواعيد' : 'Reduced no-shows via automated reminders',
      ],
    },
    {
      id: 'support-teams',
      icon: Headphones,
      color: '#8B5CF6',
      titleEn: 'Customer Support & Operations',
      titleAr: 'فرق خدمة العملاء والعمليات',
      descEn: 'Empower human agents by resolving routine repetitive inquiries autonomously, with seamless escalation for edge cases.',
      descAr: 'تفريغ موظفي الدعم للتركيز على المشكلات المعقدة بينما يتولى نذير الرد على 80% من الأسئلة المتكررة.',
      benefits: [
        isRTL ? 'تحويل ذكي للعميل للموظف المختص' : 'Seamless escalation to human agents',
        isRTL ? 'توحيد كافة القنوات في مكان واحد' : 'Single workspace across all channels',
        isRTL ? 'تقارير فورية لرضا العملاء (CSAT)' : 'Built-in CSAT rating collection',
      ],
    },
  ]

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
            <TrendingUp size={13} />
            <span>{isRTL ? 'حلول مفصلة حسب نشاطك' : 'Tailored Business Solutions'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? 'مصمم ليناسب طريقة عمل نشاطك التجاري' : 'Built for the Demands of Modern Commerce'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'سواء كنت تدير متجراً سريع النمو أو عيادة تستقبل مئات الاستفسارات اليومية، يقدم نذير التجربة المثالية لعملائك.'
              : 'Whether you run a high-growth retail store, a busy healthcare clinic, or a social-first brand, Naz scales with your volume.'}
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((uc, index) => {
            const Icon = uc.icon
            return (
              <motion.div
                key={uc.id}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated/85 p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                <div>
                  <div
                    className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-xs transition-transform group-hover:scale-105"
                    style={{ color: uc.color }}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  <h3 className="text-lg font-black tracking-tight text-text-primary">
                    {isRTL ? uc.titleAr : uc.titleEn}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {isRTL ? uc.descAr : uc.descEn}
                  </p>
                </div>

                <div className="mt-6 border-t border-border pt-4 space-y-2">
                  {uc.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <CheckCircle2 size={13} className="shrink-0 text-success" />
                      <span>{b}</span>
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
