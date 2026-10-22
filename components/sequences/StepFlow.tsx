'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  GitBranch,
  MessageSquare,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react'
import Select from '../ui/Select'
import { useLang } from '../../lib/LangContext'
import Input from '../ui/Input'
import MessageEditor from './MessageEditor'
import ConditionEditor from './ConditionEditor'
import {
  CHANNELS,
  ChannelType,
  DelayUnit,
  NUMBER_INPUT_CLASS,
  SequenceStepUI,
  StepType,
  summarizeStep,
} from './types'

const TYPE_META: Record<StepType, { label: string; icon: React.ElementType; tone: string; bg: string; hint: string }> = {
  message: { label: 'Message', icon: MessageSquare, tone: 'text-info', bg: 'bg-info/10 border-info/20', hint: 'Send a message' },
  delay: { label: 'Wait', icon: Clock, tone: 'text-brand', bg: 'bg-brand/10 border-brand/20', hint: 'Pause before the next step' },
  condition: { label: 'Condition', icon: GitBranch, tone: 'text-success', bg: 'bg-success/10 border-success/20', hint: 'Branch or stop based on a check' },
  action: { label: 'Action', icon: Zap, tone: 'text-warning', bg: 'bg-warning/10 border-warning/20', hint: 'Tag the contact or stop' },
}

const DELAY_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

const ACTION_OPTIONS = [
  { value: 'stop_sequence', label: 'Stop the sequence' },
  { value: 'add_tag', label: 'Add a tag' },
  { value: 'remove_tag', label: 'Remove a tag' },
]

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded-md text-text-tertiary transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        danger ? 'hover:text-error hover:bg-error/10' : 'hover:text-text-primary hover:bg-surface'
      }`}
    >
      {children}
    </button>
  )
}

function InsertPoint({
  isLast,
  isEmpty,
  open,
  onToggle,
  onPick,
}: {
  isLast?: boolean
  isEmpty?: boolean
  open: boolean
  onToggle: () => void
  onPick: (type: StepType) => void
}) {
  return (
    <div className="flex flex-col items-center">
      {!isEmpty && <div className="w-px h-3 bg-border" />}
      {open ? (
        <div className="w-full grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-elevated p-2 shadow-sm">
          {(Object.keys(TYPE_META) as StepType[]).map((t) => {
            const m = TYPE_META[t]
            const Icon = m.icon
            return (
              <button
                key={t}
                type="button"
                onClick={() => onPick(t)}
                className="flex items-center gap-2.5 rounded-lg p-2 text-left hover:bg-surface transition-colors"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${m.bg} ${m.tone}`}>
                  <Icon size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-text-primary">{m.label}</span>
                  <span className="block truncate text-[11px] text-text-tertiary">{m.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : isLast ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-text-secondary hover:border-brand/50 hover:text-brand transition-colors"
        >
          <Plus size={14} /> Add step
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Insert step here"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-tertiary hover:border-brand hover:text-brand transition-colors"
        >
          <Plus size={12} />
        </button>
      )}
      {!isLast && <div className="w-px h-3 bg-border" />}
    </div>
  )
}

function DelayRow({
  step,
  error,
  onUpdate,
  onDelete,
}: {
  step: SequenceStepUI
  error?: string
  onUpdate: (updates: Partial<SequenceStepUI>) => void
  onDelete: () => void
}) {
  const { isRTL } = useLang()
  return (
    <div
      id={`step-${step.id}`}
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-dashed px-3 py-2 bg-brand/5 ${
        error ? 'border-error/60' : 'border-brand/30'
      }`}
    >
      <Clock size={14} className="text-brand shrink-0" />
      <span className="text-xs font-semibold text-text-secondary">Wait</span>
      <input
        type="number"
        min={1}
        value={step.delay_hours || ''}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          onUpdate({ delay_hours: Number.isNaN(n) ? 0 : n })
        }}
        className={`${NUMBER_INPUT_CLASS} !h-8 !w-16`}
        aria-label="Wait duration"
      />
      <div className="w-28">
        <Select
          dir={isRTL ? 'rtl' : 'ltr'}
          size="sm"
          value={step.delay_unit || 'hours'}
          onValueChange={(value) => onUpdate({ delay_unit: value as DelayUnit })}
          options={DELAY_UNITS}
        />
      </div>
      <span className="hidden sm:inline text-xs text-text-tertiary">then continue</span>
      {error && <span className="text-xs font-medium text-error">{error}</span>}
      <div className="ml-auto">
        <IconBtn title="Remove wait" onClick={onDelete} danger>
          <Trash2 size={13} />
        </IconBtn>
      </div>
    </div>
  )
}

function StepCard({
  step,
  index,
  total,
  open,
  onToggle,
  channels,
  allSteps,
  error,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
}: {
  step: SequenceStepUI
  index: number
  total: number
  open: boolean
  onToggle: () => void
  channels: ChannelType[]
  allSteps: SequenceStepUI[]
  error?: string
  onUpdate: (updates: Partial<SequenceStepUI>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const { isRTL } = useLang()
  const meta = TYPE_META[step.step_type]
  const Icon = meta.icon
  const channelsList = (channels.length ? channels : (['whatsapp'] as ChannelType[])).map((c) => ({
    value: c,
    label: CHANNELS.find((x) => x.id === c)?.label || c,
  }))

  return (
    <div
      id={`step-${step.id}`}
      className={`group rounded-2xl border bg-surface-elevated transition-colors ${
        error ? 'border-error/50' : open ? 'border-brand/40' : 'border-border hover:border-border-hover'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        className="flex cursor-pointer items-center gap-3 p-3"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.bg} ${meta.tone}`}>
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
            Step {index + 1} · {meta.label}
          </p>
          <p className="truncate text-sm text-text-primary">{summarizeStep(step)}</p>
        </div>
        {error && !open && <AlertCircle size={15} className="shrink-0 text-error" />}
        <div
          className={`flex items-center gap-0.5 transition-opacity ${
            open ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <IconBtn title="Move up" onClick={() => onMove(-1)} disabled={index === 0}>
            <ChevronUp size={14} />
          </IconBtn>
          <IconBtn title="Move down" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ChevronDown size={14} />
          </IconBtn>
          <IconBtn title="Duplicate" onClick={onDuplicate}>
            <Copy size={13} />
          </IconBtn>
          <IconBtn title="Delete" onClick={onDelete} danger>
            <Trash2 size={13} />
          </IconBtn>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
          {step.step_type === 'message' && (
            <MessageEditor
              value={step.message || ''}
              onChange={(v) => onUpdate({ message: v })}
              channels={channels.length ? channels : ['whatsapp']}
              error={error}
            />
          )}

          {step.step_type === 'condition' && (
            <ConditionEditor
              step={step}
              allSteps={allSteps}
              channelsList={channelsList}
              onChange={onUpdate}
              error={error}
            />
          )}

          {step.step_type === 'action' && (
            <div className="space-y-3">
              <Select
                dir={isRTL ? 'rtl' : 'ltr'}
                label="What should happen?"
                value={step.config?.action_type || 'stop_sequence'}
                onValueChange={(action_type) => {
                  const config: Record<string, any> = { ...(step.config || {}), action_type }
                  if (action_type === 'stop_sequence') delete config.tag
                  onUpdate({ config })
                }}
                options={ACTION_OPTIONS}
              />
              {(step.config?.action_type === 'add_tag' || step.config?.action_type === 'remove_tag') && (
                <Input
                  label="Tag name"
                  value={step.config?.tag || ''}
                  onChange={(e) => onUpdate({ config: { ...(step.config || {}), tag: e.target.value } })}
                  placeholder="e.g. VIP, Interested"
                  error={error}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export interface StepFlowProps {
  steps: SequenceStepUI[]
  openId: string | null
  onOpen: (id: string | null) => void
  channels: ChannelType[]
  errors: Record<string, string>
  onUpdate: (id: string, updates: Partial<SequenceStepUI>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onInsert: (index: number, type: StepType) => void
}

export default function StepFlow({
  steps,
  openId,
  onOpen,
  channels,
  errors,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onInsert,
}: StepFlowProps) {
  const [menuAt, setMenuAt] = useState<number | null>(null)

  const pick = (index: number, type: StepType) => {
    onInsert(index, type)
    setMenuAt(null)
  }

  return (
    <div className="flex flex-col items-stretch">
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <InsertPoint
            open={menuAt === i}
            onToggle={() => setMenuAt(menuAt === i ? null : i)}
            onPick={(t) => pick(i, t)}
          />
          {step.step_type === 'delay' ? (
            <DelayRow
              step={step}
              error={errors[step.id]}
              onUpdate={(u) => onUpdate(step.id, u)}
              onDelete={() => onDelete(step.id)}
            />
          ) : (
            <StepCard
              step={step}
              index={i}
              total={steps.length}
              open={openId === step.id}
              onToggle={() => onOpen(openId === step.id ? null : step.id)}
              channels={channels}
              allSteps={steps}
              error={errors[step.id]}
              onUpdate={(u) => onUpdate(step.id, u)}
              onDelete={() => onDelete(step.id)}
              onDuplicate={() => onDuplicate(step.id)}
              onMove={(dir) => onMove(step.id, dir)}
            />
          )}
        </React.Fragment>
      ))}
      <InsertPoint
        isLast
        isEmpty={steps.length === 0}
        open={menuAt === steps.length}
        onToggle={() => setMenuAt(menuAt === steps.length ? null : steps.length)}
        onPick={(t) => pick(steps.length, t)}
      />
    </div>
  )
}
