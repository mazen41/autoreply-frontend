'use client'

import React from 'react'
import { FileEdit, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  isRTL: boolean
}

export default function CampaignLifecycleBanner({ isRTL }: Props) {
  const steps = [
    {
      step: '1',
      title: isRTL ? 'مسودة (Draft)' : 'Draft',
      desc: isRTL ? 'الحملة محفوظة ولكن لم ترسل بعد. يمكنك تعديل الرسالة والجمهور.' : 'Saved but not sent. Message and audience can be edited.',
      icon: FileEdit,
      tone: 'text-text-secondary bg-surface-elevated',
    },
    {
      step: '2',
      title: isRTL ? 'مجدولة (Scheduled)' : 'Scheduled',
      desc: isRTL ? 'بانتظار وقت الإطلاق المجدول في منطقتك الزمنية. يمكن الإطلاق مبكراً.' : 'Waiting for scheduled launch time in your timezone.',
      icon: Clock,
      tone: 'text-warning bg-warning/10',
    },
    {
      step: '3',
      title: isRTL ? 'قيد الإرسال (Sending)' : 'Sending',
      desc: isRTL ? 'النظام يرسل الرسائل عبر الحساب المتصل في الخلفية دفعة تلو الأخرى.' : 'System processes eligible recipients through connected sender.',
      icon: Send,
      tone: 'text-brand bg-brand/10',
    },
    {
      step: '4',
      title: isRTL ? 'مكتمل أو فشل (Sent / Failed)' : 'Sent / Failed',
      desc: isRTL ? 'انتهاء الإرسال. يمكنك مراجعة سجلات التسليم وأسباب الفشل إن وجدت.' : 'Finished. Inspect delivery logs and failure reasons per recipient.',
      icon: CheckCircle2,
      tone: 'text-success bg-success/10',
    },
  ]

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
        <span className="font-semibold text-text-primary text-xs">
          {isRTL ? 'دورة حياة الحملة ومراحل الإرسال' : 'Campaign Execution Lifecycle'}
        </span>
        <span className="text-[11px] text-text-tertiary">
          {isRTL
            ? 'تتبع الحالة خطوة بخطوة من الإنشاء حتى اكتمال الوصول'
            : 'Track exact execution state from draft creation to final recipient delivery'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className="relative flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/50 p-2.5"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-text-primary text-[11px]">
                  <span>{item.title}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-tertiary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
