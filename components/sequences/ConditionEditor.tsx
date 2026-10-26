'use client'

import React, { useMemo, useState } from 'react'
import Select, { SelectGroup, SelectOption } from '../ui/Select'
import Input from '../ui/Input'
import { useLang } from '../../lib/LangContext'
import {
  CONDITION_OPTIONS,
  CONDITION_VALUE_HINTS,
  DAYS_OF_WEEK,
  SequenceStepUI,
  conditionOption,
  summarizeStep,
} from './types'

interface Props {
  step: SequenceStepUI
  allSteps: SequenceStepUI[]
  channelsList: { value: string; label: string }[]
  onChange: (updates: Partial<SequenceStepUI>) => void
  error?: string
}

function operatorOptions(type: string, isRTL = false): SelectOption[] {
  const L = (en: string, ar: string) => isRTL ? ar : en
  if (type === 'customer_tag')
    return [
      { value: 'has_tag', label: L('Has tag', 'لديه الوسم') },
      { value: 'does_not_have_tag', label: L('Does not have tag', 'ليس لديه الوسم') },
    ]
  if (type === 'ai_confidence' || type === 'order_total')
    return [
      { value: 'greater_than', label: L('Greater than', 'أكبر من') },
      { value: 'less_than', label: L('Less than', 'أقل من') },
      { value: 'equals', label: L('Equals', 'يساوي') },
    ]
  if (type === 'message_text')
    return [
      { value: 'contains', label: L('Contains', 'يحتوي على') },
      { value: 'does_not_contain', label: L('Does not contain', 'لا يحتوي على') },
      { value: 'equals', label: L('Equals', 'يساوي') },
    ]
  return [
    { value: 'equals', label: L('Equals', 'يساوي') },
    { value: 'not_equals', label: L('Does not equal', 'لا يساوي') },
    { value: 'contains', label: L('Contains', 'يحتوي على') },
  ]
}

export default function ConditionEditor({ step, allSteps, channelsList, onChange, error }: Props) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const config = step.condition_config || {}
  const type: string = config.type || 'customer_replied'
  const opt = conditionOption(type)
  const [showAll, setShowAll] = useState(() => !opt?.common)

  const update = (patch: Record<string, any>) => onChange({ condition_config: { ...config, ...patch } })

  const groups = useMemo<SelectGroup[]>(() => {
    const labels: Record<string, string> = { customer_replied: 'رد العميل', customer_tag: 'لدى العميل وسم', has_order: 'لدى العميل طلب', order_status: 'حالة الطلب', channel: 'القناة', within_business_hours: 'خلال ساعات العمل', conversation_status: 'حالة المحادثة', last_message_from_customer: 'آخر رسالة من العميل', last_message_from_ai: 'آخر رسالة من الذكاء الاصطناعي', is_escalated: 'تم التصعيد', is_not_escalated: 'لم يتم التصعيد', customer_field: 'حقل العميل', customer_exists: 'العميل موجود', message_text: 'نص الرسالة', message_language: 'لغة الرسالة', message_intent: 'نية الرسالة', ai_confidence: 'ثقة الذكاء الاصطناعي', ai_intent: 'نية الذكاء الاصطناعي', needs_escalation: 'يحتاج إلى تصعيد', does_not_have_order: 'ليس لدى العميل طلب', order_total: 'إجمالي الطلب', product_exists: 'المنتج موجود', outside_business_hours: 'خارج ساعات العمل', day_of_week: 'يوم الأسبوع', time_of_day: 'وقت اليوم' }
    const toOpt = (o: (typeof CONDITION_OPTIONS)[number]): SelectOption => ({ value: o.value, label: isRTL ? (labels[o.value] || o.label) : o.label })
    const result: SelectGroup[] = [{ label: L('Most used', 'الأكثر استخدامًا'), options: CONDITION_OPTIONS.filter((o) => o.common).map(toOpt) }]
    if (showAll) {
      const byGroup = new Map<string, SelectOption[]>()
      CONDITION_OPTIONS.filter((o) => !o.common).forEach((o) => {
        byGroup.set(o.group, [...(byGroup.get(o.group) || []), toOpt(o)])
      })
      const groupLabels: Record<string, string> = { Conversation: 'المحادثة', Customer: 'العميل', Orders: 'الطلبات', Channel: 'القناة', Schedule: 'الجدولة', 'Message content': 'محتوى الرسالة', AI: 'الذكاء الاصطناعي' }
      byGroup.forEach((options, label) => result.push({ label: isRTL ? (groupLabels[label] || label) : label, options }))
    }
    return result
  }, [showAll, isRTL])

  const handleTypeChange = (newType: string) => {
    let operator = 'equals'
    if (newType === 'customer_tag') operator = 'has_tag'
    if (newType === 'ai_confidence' || newType === 'order_total') operator = 'greater_than'
    if (newType === 'message_text') operator = 'contains'
    const next: Record<string, any> = { ...config, type: newType, operator }
    delete next.value
    delete next.field
    if (newType === 'channel') next.value = channelsList[0]?.value || 'whatsapp'
    if (newType === 'day_of_week') next.value = 'Monday'
    onChange({ condition_config: next })
  }

  const jumpOptions = (current?: number): SelectOption[] => {
    const later = allSteps.filter((s) => s.step_order > step.step_order)
    const list = [...later]
    if (current) {
      const existing = allSteps.find((s) => s.step_order === Number(current))
      if (existing && !list.includes(existing)) list.unshift(existing)
    }
    return [
      { value: '', label: L('Pick a step…', 'اختر خطوة…') },
      ...list.map((s) => ({ value: String(s.step_order), label: `${L('Step', 'الخطوة')} ${s.step_order}: ${summarizeStep(s).slice(0, 40)}` })),
    ]
  }

  const routeOptions: SelectOption[] = [
    { value: 'continue', label: L('Continue to next step', 'الانتقال إلى الخطوة التالية') },
    { value: 'stop', label: L('Stop the sequence', 'إيقاف التسلسل') },
    { value: 'jump', label: L('Jump to a later step', 'الانتقال إلى خطوة لاحقة') },
  ]

  const renderRoute = (label: string, route: 'on_true' | 'on_false', key: 'true_step_order' | 'false_step_order') => {
    const value = config[route] || (route === 'on_true' ? 'continue' : 'stop')
    return (
      <div className="space-y-2">
        <Select
          dir={isRTL ? 'rtl' : 'ltr'}
          label={label}
          size="sm"
          value={value}
          onValueChange={(v) => {
            const next = { ...config, [route]: v }
            if (v !== 'jump') delete next[key]
            onChange({ condition_config: next })
          }}
          options={routeOptions}
        />
        {value === 'jump' && (
          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            size="sm"
            value={config[key] ? String(config[key]) : ''}
            onValueChange={(value) => update({ [key]: value ? parseInt(value, 10) : undefined })}
            options={jumpOptions(config[key])}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Check whether…', 'تحقّق مما إذا كان…')} value={type} onValueChange={handleTypeChange} options={groups} />
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] font-medium text-brand hover:underline"
        >
          {showAll ? L('Show only the most used', 'عرض الأكثر استخدامًا فقط') : L('Show all conditions', 'عرض جميع الشروط')}
        </button>
      </div>

      {opt?.needsField && (
        <Input
          label={L('Field name', 'اسم الحقل')}
          value={config.field || ''}
          onChange={(e) => update({ field: e.target.value })}
          placeholder={L('e.g. city', 'مثال: المدينة')}
        />
      )}

      {opt?.needsValue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type !== 'channel' && type !== 'day_of_week' && (
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              label={L('Comparison', 'المقارنة')}
              size="sm"
              value={config.operator || operatorOptions(type)[0].value}
              onValueChange={(value) => update({ operator: value })}
              options={operatorOptions(type, isRTL)}
            />
          )}
          {type === 'channel' ? (
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              label={L('Channel', 'القناة')}
              size="sm"
              value={config.value || channelsList[0]?.value || 'whatsapp'}
              onValueChange={(value) => update({ value })}
              options={channelsList}
            />
          ) : type === 'day_of_week' ? (
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              label={L('Day', 'اليوم')}
              size="sm"
              value={config.value || 'Monday'}
              onValueChange={(value) => update({ value })}
              options={DAYS_OF_WEEK.map((d) => ({ value: d, label: isRTL ? ({ Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت', Sunday: 'الأحد' }[d] || d) : d }))}
            />
          ) : (
            <Input
              label={L('Value', 'القيمة')}
              type={type === 'ai_confidence' || type === 'order_total' ? 'number' : 'text'}
              value={config.value ?? ''}
              onChange={(e) => update({ value: e.target.value })}
              placeholder={CONDITION_VALUE_HINTS[type] || L('Value…', 'القيمة…')}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
        {renderRoute(L('If yes', 'إذا كانت الإجابة نعم'), 'on_true', 'true_step_order')}
        {renderRoute(L('Otherwise', 'وإلا'), 'on_false', 'false_step_order')}
      </div>

      {error && (
        <p className="text-xs font-medium text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
