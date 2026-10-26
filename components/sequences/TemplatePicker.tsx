'use client'

import React from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { SequenceTemplate, TEMPLATES, TRIGGERS } from './types'
import { useLang } from '../../lib/LangContext'

interface Props {
  onPick: (template: SequenceTemplate | null) => void
}

export default function TemplatePicker({ onPick }: Props) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{L('How do you want to start?', 'كيف تريد أن تبدأ؟')}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {L('Pick a ready-made sequence and just edit the text — you can change everything afterwards.', 'اختر تسلسلًا جاهزًا وعدّل نصه، ويمكنك تغيير كل شيء لاحقًا.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const trigger = TRIGGERS.find((x) => x.id === t.trigger)
          const steps = t.build()
          const messages = steps.filter((s) => s.step_type === 'message').length
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-start transition-colors hover:border-brand/50"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{t.emoji}</span>
                <ArrowRight size={16} className="text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{isRTL ? ({ 'Welcome new customers': 'الترحيب بالعملاء الجدد', 'Post-purchase thank you': 'شكر العميل بعد الشراء', 'No-reply follow-up': 'متابعة عدم الرد' }[t.name] || t.name) : t.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{isRTL ? ({ 'Greet new customers and introduce your business.': 'رحّب بالعملاء الجدد وعرّفهم بنشاطك.', 'Thank customers after an order is placed.': 'اشكر العملاء بعد تقديم الطلب.', 'Follow up when a customer does not reply.': 'تابع مع العميل عندما لا يرد.' }[t.description] || t.description) : t.description}</p>
              </div>
              <p className="text-[11px] text-text-tertiary">
                {trigger?.icon} {isRTL ? ({ 'Manual enrollment': 'تسجيل يدوي', 'New customer': 'عميل جديد', 'Contact tagged': 'إضافة وسم للعميل', 'No reply': 'عدم الرد', 'Order placed': 'تقديم طلب' }[trigger?.label || ''] || trigger?.label) : trigger?.label} · {messages} {isRTL ? 'رسائل' : `message${messages === 1 ? '' : 's'}`}
              </p>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPick(null)}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border p-4 text-start transition-colors hover:border-brand/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary">
            <Plus size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">{L('Start from scratch', 'البدء من الصفر')}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{L('One empty message — build it your way.', 'رسالة فارغة واحدة — أنشئ التسلسل بالطريقة التي تناسبك.')}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
