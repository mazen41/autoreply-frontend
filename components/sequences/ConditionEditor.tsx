'use client'

import React, { useMemo, useState } from 'react'
import Select, { SelectGroup, SelectOption } from '../ui/Select'
import Input from '../ui/Input'
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

function operatorOptions(type: string): SelectOption[] {
  if (type === 'customer_tag')
    return [
      { value: 'has_tag', label: 'Has tag' },
      { value: 'does_not_have_tag', label: 'Does not have tag' },
    ]
  if (type === 'ai_confidence' || type === 'order_total')
    return [
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' },
      { value: 'equals', label: 'Equals' },
    ]
  if (type === 'message_text')
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
      { value: 'equals', label: 'Equals' },
    ]
  return [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
  ]
}

export default function ConditionEditor({ step, allSteps, channelsList, onChange, error }: Props) {
  const config = step.condition_config || {}
  const type: string = config.type || 'customer_replied'
  const opt = conditionOption(type)
  const [showAll, setShowAll] = useState(() => !opt?.common)

  const update = (patch: Record<string, any>) => onChange({ condition_config: { ...config, ...patch } })

  const groups = useMemo<SelectGroup[]>(() => {
    const toOpt = (o: (typeof CONDITION_OPTIONS)[number]): SelectOption => ({ value: o.value, label: o.label })
    const result: SelectGroup[] = [{ label: 'Most used', options: CONDITION_OPTIONS.filter((o) => o.common).map(toOpt) }]
    if (showAll) {
      const byGroup = new Map<string, SelectOption[]>()
      CONDITION_OPTIONS.filter((o) => !o.common).forEach((o) => {
        byGroup.set(o.group, [...(byGroup.get(o.group) || []), toOpt(o)])
      })
      byGroup.forEach((options, label) => result.push({ label, options }))
    }
    return result
  }, [showAll])

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
      { value: '', label: 'Pick a step…' },
      ...list.map((s) => ({ value: String(s.step_order), label: `Step ${s.step_order}: ${summarizeStep(s).slice(0, 40)}` })),
    ]
  }

  const routeOptions: SelectOption[] = [
    { value: 'continue', label: 'Continue to next step' },
    { value: 'stop', label: 'Stop the sequence' },
    { value: 'jump', label: 'Jump to a later step' },
  ]

  const renderRoute = (label: string, route: 'on_true' | 'on_false', key: 'true_step_order' | 'false_step_order') => {
    const value = config[route] || (route === 'on_true' ? 'continue' : 'stop')
    return (
      <div className="space-y-2">
        <Select
          label={label}
          size="sm"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            const next = { ...config, [route]: v }
            if (v !== 'jump') delete next[key]
            onChange({ condition_config: next })
          }}
          options={routeOptions}
        />
        {value === 'jump' && (
          <Select
            size="sm"
            value={config[key] ? String(config[key]) : ''}
            onChange={(e) => update({ [key]: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            options={jumpOptions(config[key])}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Select label="Check whether…" value={type} onChange={(e) => handleTypeChange(e.target.value)} options={groups} />
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] font-medium text-brand hover:underline"
        >
          {showAll ? 'Show only the most used' : 'Show all conditions'}
        </button>
      </div>

      {opt?.needsField && (
        <Input
          label="Field name"
          value={config.field || ''}
          onChange={(e) => update({ field: e.target.value })}
          placeholder="e.g. city"
        />
      )}

      {opt?.needsValue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type !== 'channel' && type !== 'day_of_week' && (
            <Select
              label="Comparison"
              size="sm"
              value={config.operator || operatorOptions(type)[0].value}
              onChange={(e) => update({ operator: e.target.value })}
              options={operatorOptions(type)}
            />
          )}
          {type === 'channel' ? (
            <Select
              label="Channel"
              size="sm"
              value={config.value || channelsList[0]?.value || 'whatsapp'}
              onChange={(e) => update({ value: e.target.value })}
              options={channelsList}
            />
          ) : type === 'day_of_week' ? (
            <Select
              label="Day"
              size="sm"
              value={config.value || 'Monday'}
              onChange={(e) => update({ value: e.target.value })}
              options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
            />
          ) : (
            <Input
              label="Value"
              type={type === 'ai_confidence' || type === 'order_total' ? 'number' : 'text'}
              value={config.value ?? ''}
              onChange={(e) => update({ value: e.target.value })}
              placeholder={CONDITION_VALUE_HINTS[type] || 'Value…'}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
        {renderRoute('If yes', 'on_true', 'true_step_order')}
        {renderRoute('Otherwise', 'on_false', 'false_step_order')}
      </div>

      {error && (
        <p className="text-xs font-medium text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
