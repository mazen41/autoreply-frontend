'use client'

import React, { useState } from 'react'
import {
  Megaphone,
  Zap,
  Mail,
  GitBranch,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  isRTL: boolean
}

export default function MessagingSystemsOrientation({ isRTL }: Props) {
  const [isOpen, setIsOpen] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const systems = [
    {
      id: 'campaigns',
      icon: Megaphone,
      name: isRTL ? 'حملات البث (الحالية)' : 'Campaigns (Current)',
      active: true,
      tag: isRTL ? 'رسالة واحدة لجمهور محدد' : 'One message to an audience',
      description: isRTL
        ? 'إرسال إعلان، عرض ترويجي، أو تنبيه لمرة واحدة إلى مجموعة مستلمين محددين عبر واتساب، انستغرام، أو ماسنجر.'
        : 'Send a one-time announcement, promotional offer, or alert to a filtered audience across WhatsApp, Instagram, or Messenger.',
      example: isRTL ? 'مثال: خصم 20% لعملاء الـ VIP بمناسبة العيد' : 'e.g. Flash 20% weekend discount for VIP customers',
      link: null,
    },
    {
      id: 'proactive',
      icon: Zap,
      name: isRTL ? 'الرسائل الاستباقية' : 'Proactive Messages',
      active: false,
      tag: isRTL ? 'رسائل موجهة أو مبنية على حدث' : 'Targeted or event-triggered',
      description: isRTL
        ? 'متابعة عميل محدد أو إرسال تذكير مخصص لعميل واحد بناءً على حدث معين مثل استعادة السلة المتروكة.'
        : 'Send a targeted follow-up to an individual customer or trigger an automatic notification (e.g. cart recovery).',
      example: isRTL ? 'مثال: تذكير العميل بسلته المتروكة بعد ساعتين' : 'e.g. Abandoned cart reminder sent 2 hours later',
      link: '/dashboard/automations/builder',
    },
    {
      id: 'email',
      icon: Mail,
      name: isRTL ? 'حملات البريد الإلكتروني' : 'Email Marketing',
      active: false,
      tag: isRTL ? 'نشرات وبريد تسويقي جماعي' : 'Bulk newsletters & marketing',
      description: isRTL
        ? 'إرسال رسائل بريدية جماعية مع تتبع الفتح والنقر وإدارة الاشتراكات وطلبات إلغاء الاشتراك تلقائياً.'
        : 'Send marketing newsletters and bulk updates to eligible opt-in email contacts with open & click tracking.',
      example: isRTL ? 'مثال: النشرة البريدية الشهرية للمشتركين' : 'e.g. Monthly product update to subscribed users',
      link: '/dashboard/campaigns?tab=email',
    },
    {
      id: 'sequences',
      icon: GitBranch,
      name: isRTL ? 'المسارات الآلية المتسلسلة' : 'Automated Sequences',
      active: false,
      tag: isRTL ? 'رحلة متعددة الخطوات على فترات' : 'Multi-step customer journeys',
      description: isRTL
        ? 'بناء تسلسل آلي من عدة رسائل مجدولة (اليوم 1، اليوم 3، اليوم 7) يتفاعل تلقائياً مع سلوك العميل.'
        : 'Build automated multi-step drip journeys with scheduled steps (Day 1, Day 3, Day 7) that react to replies.',
      example: isRTL ? 'مثال: مسار تأهيل العميل الجديد عبر 4 رسائل' : 'e.g. 4-step onboarding journey for new signups',
      link: '/dashboard/sequences',
    },
  ]

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/[0.03] p-4 transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <HelpCircle size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-primary">
              {isRTL ? 'دليل أنظمة المراسلة — أي نظام يناسب هدفك اليوم؟' : 'Messaging Systems Guide — Which tool fits your goal?'}
            </h3>
            <p className="text-[11px] text-text-tertiary">
              {isRTL
                ? 'فهم الفرق بين حملات البث، المسارات التتابعية، والرسائل الاستباقية'
                : 'Understand the difference between Campaigns, Sequences, and Proactive messages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-text-secondary hover:bg-surface-elevated"
          >
            <span>{isOpen ? (isRTL ? 'إخفاء' : 'Collapse') : (isRTL ? 'عرض الشرح' : 'Expand')}</span>
            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary"
            title={isRTL ? 'إغلاق الدليل' : 'Dismiss guide'}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-brand/10">
          {systems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between rounded-xl p-3 text-xs transition ${
                  item.active
                    ? 'border border-brand/40 bg-surface shadow-xs'
                    : 'border border-border/60 bg-surface/60 hover:bg-surface'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                      <Icon size={14} className={item.active ? 'text-brand' : 'text-text-tertiary'} />
                      <span>{item.name}</span>
                    </div>
                    {item.active && (
                      <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand">
                        {isRTL ? 'أنت هنا' : 'Active View'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-brand">
                    {item.tag}
                  </div>
                  <p className="mt-1.5 text-[11px] text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2 rounded bg-surface-elevated/70 px-2 py-1 text-[10px] text-text-tertiary italic">
                    {item.example}
                  </div>
                </div>

                {item.link && (
                  <div className="mt-3 pt-2 border-t border-border/40">
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                    >
                      <span>{isRTL ? 'الانتقال إلى الأداة' : 'Go to tool'}</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
