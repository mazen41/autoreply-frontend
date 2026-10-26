'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AlertCircle, ArrowLeft, Settings2, X, Zap } from 'lucide-react'
import { useLang } from '../../lib/LangContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import { useSequences, Sequence } from '../../hooks/useSequences'
import StepFlow from './StepFlow'
import SettingsPanel from './SettingsPanel'
import TemplatePicker from './TemplatePicker'
import {
  CHANNELS,
  ChannelType,
  DelayUnit,
  NUMBER_INPUT_CLASS,
  SequenceStepUI,
  SequenceTemplate,
  StepType,
  TRIGGERS,
  TriggerType,
  buildStep,
  newId,
  renumberSteps,
  validateSequence,
  withOrder,
} from './types'

interface Props {
  /** When provided, the editor loads and updates this sequence. */
  sequenceId?: number
}

const LIST_URL = '/dashboard/sequences'

export default function SequenceEditor({ sequenceId }: Props) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const router = useRouter()
  const isEditing = typeof sequenceId === 'number' && !Number.isNaN(sequenceId)
  const { createSequence, updateSequence, activateSequence, fetchSequence } = useSequences()

  const [stage, setStage] = useState<'pick' | 'edit'>(isEditing ? 'edit' : 'pick')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(isEditing ? 'loading' : 'ready')
  const [loadNonce, setLoadNonce] = useState(0)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('manual')
  const [triggerTag, setTriggerTag] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [noReplyValue, setNoReplyValue] = useState(24)
  const [noReplyUnit, setNoReplyUnit] = useState<DelayUnit>('hours')
  // Require an explicit channel choice so a new sequence can never silently
  // target WhatsApp just because the editor was opened.
  const [channels, setChannels] = useState<ChannelType[]>([])
  const [allowReentry, setAllowReentry] = useState(false)
  const [stopOnReply, setStopOnReply] = useState(false)
  const [steps, setSteps] = useState<SequenceStepUI[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  const [status, setStatus] = useState<Sequence['status']>('draft')
  const [enrolled, setEnrolled] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'activate' | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ─── Load existing sequence (edit mode) ──────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return
    let cancelled = false
    setLoadState('loading')
    ;(async () => {
      const seq = await fetchSequence(sequenceId as number)
      if (cancelled) return
      if (!seq) {
        setLoadState('error')
        return
      }
      setName(seq.name || '')
      setDescription(seq.description || '')
      setStatus(seq.status)
      setEnrolled(seq.active_enrollments ?? seq.total_enrollments ?? 0)

      const type = (seq.trigger_type as TriggerType) || 'manual'
      setTriggerType(type)
      const tc = seq.trigger_config || {}
      setTriggerTag(Array.isArray(tc.tags) ? tc.tags[0] || '' : '')
      setMinOrderValue(tc.min_order_value != null ? String(tc.min_order_value) : '')
      if (tc.delay_value != null) {
        setNoReplyValue(Number(tc.delay_value))
        setNoReplyUnit((tc.delay_unit as DelayUnit) || 'hours')
      } else if (tc.hours != null) {
        // Legacy format: fractional hours
        const h = Number(tc.hours)
        if (h > 0 && h < 1) {
          setNoReplyValue(Math.max(1, Math.round(h * 60)))
          setNoReplyUnit('minutes')
        } else {
          setNoReplyValue(h || 24)
          setNoReplyUnit('hours')
        }
      }

      const s = seq.settings || {}
      const configuredChannels = Array.isArray(s.target_channels) ? s.target_channels : s.channels
      const savedChannels: ChannelType[] = Array.isArray(configuredChannels) && configuredChannels.length ? configuredChannels : []
      setChannels(savedChannels.length ? savedChannels : seq.channel ? [seq.channel as ChannelType] : ['whatsapp'])
      setAllowReentry(!!s.allow_reentry)
      setStopOnReply(!!s.stop_on_reply)

      const loaded: SequenceStepUI[] = (seq.steps || [])
        .slice()
        .sort((a, b) => a.step_order - b.step_order)
        .map((st) => ({
          id: newId(),
          step_type: st.step_type,
          step_order: st.step_order,
          message: st.message || '',
          config: st.config || {},
          delay_hours: st.delay_hours,
          delay_unit: (st.delay_unit as DelayUnit) || 'hours',
          condition_config: st.condition_config || {},
          is_active: st.is_active,
        }))
      setSteps(withOrder(loaded))
      setLoadState('ready')
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, sequenceId, loadNonce])

  // ─── Dirty tracking ──────────────────────────────────────────────────────────
  const snapshot = useMemo(
    () =>
      JSON.stringify({
        name, description, triggerType, triggerTag, minOrderValue, noReplyValue, noReplyUnit,
        channels, allowReentry, stopOnReply, steps,
      }),
    [name, description, triggerType, triggerTag, minOrderValue, noReplyValue, noReplyUnit, channels, allowReentry, stopOnReply, steps]
  )
  const ready = stage === 'edit' && loadState === 'ready'
  const baselineRef = useRef<string | null>(null)
  useEffect(() => {
    if (ready && baselineRef.current === null) baselineRef.current = snapshot
  }, [ready, snapshot])
  const dirty = ready && baselineRef.current !== null && baselineRef.current !== snapshot

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ─── Step handlers ───────────────────────────────────────────────────────────
  const updateStep = useCallback((id: string, updates: Partial<SequenceStepUI>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const insertStep = useCallback((index: number, type: StepType) => {
    const step = buildStep(type)
    setSteps((prev) => {
      const next = [...prev]
      next.splice(index, 0, step)
      return renumberSteps(prev, next)
    })
    setOpenId(type === 'delay' ? null : step.id)
  }, [])

  const deleteStep = useCallback((id: string) => {
    setSteps((prev) => renumberSteps(prev, prev.filter((s) => s.id !== id)))
    setOpenId((cur) => (cur === id ? null : cur))
  }, [])

  const duplicateStep = useCallback((id: string) => {
    const copyId = newId()
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id)
      if (i < 0) return prev
      const copy: SequenceStepUI = JSON.parse(JSON.stringify(prev[i]))
      copy.id = copyId
      const next = [...prev]
      next.splice(i + 1, 0, copy)
      return renumberSteps(prev, next)
    })
    setOpenId(copyId)
  }, [])

  const moveStep = useCallback((id: string, dir: -1 | 1) => {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return renumberSteps(prev, next)
    })
  }, [])

  // ─── Templates ───────────────────────────────────────────────────────────────
  const applyTemplate = (t: SequenceTemplate | null) => {
    if (t) {
      const built = withOrder(t.build())
      setName(t.name)
      setTriggerType(t.trigger)
      if (t.noReply) {
        setNoReplyValue(t.noReply.value)
        setNoReplyUnit(t.noReply.unit)
      }
      setStopOnReply(!!t.stopOnReply)
      setSteps(built)
      setOpenId(built.find((s) => s.step_type === 'message')?.id ?? null)
    } else {
      const first = buildStep('message')
      setSteps(withOrder([first]))
      setOpenId(first.id)
    }
    setStage('edit')
  }

  // ─── Validation & saving ─────────────────────────────────────────────────────
  const validation = useMemo(
    () => validateSequence({ name, triggerType, triggerTag, noReplyValue, steps }),
    [name, triggerType, triggerTag, noReplyValue, steps]
  )
  const showErrors = attempted && validation.count > 0

  const buildTriggerConfig = (): Record<string, any> | undefined => {
    if (triggerType === 'no_reply') return { delay_value: noReplyValue, delay_unit: noReplyUnit }
    if (triggerType === 'tag_added') return { tags: [triggerTag.trim()] }
    if (triggerType === 'order_created') {
      return minOrderValue.trim() !== '' ? { min_order_value: Number(minOrderValue) } : {}
    }
    return undefined
  }

  const save = async (activate: boolean) => {
    setAttempted(true)
    setApiError(null)

    if (validation.count > 0) {
      const firstStepErr = steps.find((s) => validation.steps[s.id])
      if (firstStepErr) setOpenId(firstStepErr.id)
      const target = validation.firstTarget
      setTimeout(() => {
        document.getElementById(target || '')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 60)
      return
    }
    if (channels.length === 0) {
      setApiError('Select at least one channel before saving this sequence.')
      return
    }

    setSaving(activate ? 'activate' : 'draft')
    try {
      const ordered = withOrder(steps)
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_type: triggerType,
        trigger_config: buildTriggerConfig(),
        channel: channels.find((c) => ['whatsapp', 'telegram', 'email'].includes(c)) || undefined,
        settings: { target_channels: channels, allow_reentry: allowReentry, stop_on_reply: stopOnReply },
        steps: ordered,
      }

      const saved = isEditing ? await updateSequence(sequenceId as number, payload) : await createSequence(payload)
      if (!saved) throw new Error('The sequence could not be saved. Please review it and try again.')
      baselineRef.current = snapshot

      if (activate) {
        try {
          const activated = await activateSequence(saved.id)
          if (!activated) throw new Error('Activation failed')
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Activation failed'
          toast.error(`Saved, but couldn't activate: ${msg}`)
          if (!isEditing) router.replace(`${LIST_URL}/${saved.id}/edit`)
          return
        }
      }

      toast.success(activate ? 'Sequence saved and activated' : isEditing ? 'Changes saved' : 'Saved as draft')
      router.push(LIST_URL)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to save sequence')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(null)
    }
  }

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm(L('You have unsaved changes. Leave without saving?', 'لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟'))) e.preventDefault()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const backLink = (
    <Link
      href={LIST_URL}
      onClick={confirmLeave}
      className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
    >
      <ArrowLeft size={15} className={isRTL ? 'rotate-180' : ''} /> {L('Sequences', 'التسلسلات')}
    </Link>
  )

  if (stage === 'pick') {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
          {backLink}
          <TemplatePicker onPick={applyTemplate} />
        </div>
      </div>
    )
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-4 px-4 py-8 sm:px-6">
        <div className="h-6 w-40 rounded bg-border/60" />
        <div className="h-32 rounded-2xl bg-border/40" />
        <div className="h-20 rounded-2xl bg-border/40" />
        <div className="h-20 rounded-2xl bg-border/40" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-error" size={32} />
        <p className="text-sm text-text-secondary">{L('We couldn’t load this sequence.', 'تعذر تحميل هذا التسلسل.')}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLoadNonce((n) => n + 1)}>
            {L('Try again', 'أعد المحاولة')}
          </Button>
          <Link href={LIST_URL}>
            <Button variant="ghost" size="sm">{L('Back to sequences', 'العودة إلى التسلسلات')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const triggerMeta = TRIGGERS.find((t) => t.id === triggerType)
  const isLive = isEditing && status === 'active'
  const statusBadge =
    status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'outline'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--background)] pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-border bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {backLink}
            <span className="hidden text-text-tertiary sm:inline">/</span>
            <h1 className="hidden truncate text-sm font-bold text-text-primary sm:block">
              {isEditing ? name || L('Edit sequence', 'تعديل التسلسل') : L('New sequence', 'تسلسل جديد')}
            </h1>
            {isEditing && (
              <Badge variant={statusBadge as any} size="sm" dot>
                {isRTL ? (({ active: 'نشط', paused: 'متوقف مؤقتًا', draft: 'مسودة' } as Record<string, string>)[status] || status) : status}
              </Badge>
            )}
            {dirty && <span className="text-xs font-medium text-warning">{L('Unsaved changes', 'تغييرات غير محفوظة')}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isLive ? (
              <Button size="sm" onClick={() => save(false)} loading={saving === 'draft'} disabled={!!saving}>
                {L('Save changes', 'حفظ التغييرات')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => save(false)}
                  loading={saving === 'draft'}
                  disabled={!!saving}
                >
                  {isEditing ? L('Save', 'حفظ') : L('Save draft', 'حفظ كمسودة')}
                </Button>
                <Button size="sm" onClick={() => save(true)} loading={saving === 'activate'} disabled={!!saving}>
                  {isEditing ? L('Save & activate', 'حفظ وتفعيل') : L('Activate', 'تفعيل')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6 sm:px-6">
        {apiError && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            <span>{apiError}</span>
            <button type="button" onClick={() => setApiError(null)} aria-label={L('Dismiss', 'إغلاق')}>
              <X size={14} />
            </button>
          </div>
        )}

        {isLive && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-secondary">
            {L(`This sequence is live${enrolled > 0 ? ` with ${enrolled} contact${enrolled === 1 ? '' : 's'} enrolled` : ''}. Saving updates the live flow, so review your changes carefully.`, `هذا التسلسل يعمل الآن${enrolled > 0 ? ` ويضم ${enrolled} جهة اتصال` : ''}. يؤدي الحفظ إلى تحديثه مباشرة، لذا راجع التغييرات بعناية.`)}
          </div>
        )}

        {showErrors && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm">
            <p className="font-semibold text-error">
              {L(`Fix ${validation.count} ${validation.count === 1 ? 'issue' : 'issues'} to save`, `أصلح ${validation.count} مشكلة قبل الحفظ`)}
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs text-text-secondary">
              {validation.messages.slice(0, 5).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <section className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5">
              <Input
                id="field-name"
                label={L('Sequence name', 'اسم التسلسل')}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={L('e.g. Welcome new customers', 'مثال: الترحيب بالعملاء الجدد')}
                error={attempted ? validation.name : undefined}
              />

              <div id="field-trigger" className="space-y-3">
                <Select
                  dir={isRTL ? 'rtl' : 'ltr'}
                  label={L('Starts when', 'يبدأ عند')}
                  value={triggerType}
                  onValueChange={(value) => setTriggerType(value as TriggerType)}
                  options={TRIGGERS.map((t) => ({
                    value: t.id,
                    label: isRTL ? ({ manual: 'تسجيل يدوي', new_user: 'عميل جديد', tag_added: 'إضافة وسم للعميل', no_reply: 'عدم الرد', order_created: 'تقديم طلب' }[t.id] || t.label) : t.label,
                    description: isRTL ? ({ manual: 'تسجل جهات الاتصال بنفسك', new_user: 'عند بدء محادثة جديدة', tag_added: 'عند إضافة وسم محدد', no_reply: 'عندما لا يرد العميل لفترة', order_created: 'عند إنشاء طلب جديد' }[t.id] || t.desc) : t.desc,
                    icon: <span>{t.icon}</span>,
                  }))}
                />

                {triggerType === 'no_reply' && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                    <span>{L('Customer hasn’t replied for', 'لم يرد العميل منذ')}</span>
                    <input
                      type="number"
                      min={1}
                      value={noReplyValue || ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        setNoReplyValue(Number.isNaN(n) ? 0 : n)
                      }}
                      className={NUMBER_INPUT_CLASS}
                      aria-label={L('No-reply duration', 'مدة عدم الرد')}
                    />
                    <div className="w-28">
                      <Select
                        dir={isRTL ? 'rtl' : 'ltr'}
                        size="sm"
                        value={noReplyUnit}
                        onValueChange={(value) => setNoReplyUnit(value as DelayUnit)}
                        options={[
                          { value: 'minutes', label: L('Minutes', 'دقائق') },
                          { value: 'hours', label: L('Hours', 'ساعات') },
                          { value: 'days', label: L('Days', 'أيام') },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {triggerType === 'tag_added' && (
                  <Input
                    label={L('Tag name', 'اسم الوسم')}
                    value={triggerTag}
                    onChange={(e) => setTriggerTag(e.target.value)}
                    placeholder={L('e.g. VIP, Interested', 'مثال: مميز، مهتم')}
                  />
                )}

                {triggerType === 'order_created' && (
                  <Input
                    label={L('Minimum order value (optional)', 'الحد الأدنى لقيمة الطلب (اختياري)')}
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder={L('Leave empty for all orders', 'اتركه فارغًا لتطبيقه على كل الطلبات')}
                  />
                )}

                {attempted && validation.trigger && (
                  <p className="text-xs font-medium text-error" role="alert">
                    {validation.trigger}
                  </p>
                )}
              </div>
            </section>

            {/* Mobile settings toggle */}
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm font-medium text-text-primary lg:hidden"
            >
              <span className="flex items-center gap-2">
                <Settings2 size={15} /> {L('Settings', 'الإعدادات')}
              </span>
              <span className="text-xs text-text-tertiary">
                {channels.map((c) => CHANNELS.find((x) => x.id === c)?.label).join(', ')}
              </span>
            </button>
            {settingsOpen && (
              <div className="lg:hidden">
                <SettingsPanel
                  channels={channels}
                  onChannelsChange={setChannels}
                  description={description}
                  onDescriptionChange={setDescription}
                  stopOnReply={stopOnReply}
                  onStopOnReplyChange={setStopOnReply}
                  allowReentry={allowReentry}
                  onAllowReentryChange={setAllowReentry}
                  triggerType={triggerType}
                />
              </div>
            )}

            <section id="field-steps" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary">{L('What happens next', 'ماذا سيحدث بعد ذلك')}</h2>
                <span className="text-xs text-text-tertiary">
                  {steps.length} {isRTL ? 'خطوات' : `step${steps.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">
                <Zap size={13} />
                <span>
                  {L('Starts when:', 'يبدأ عند:')} {isRTL ? ({ manual: 'تسجيل يدوي', new_user: 'عميل جديد', tag_added: 'إضافة وسم للعميل', no_reply: 'عدم الرد', order_created: 'تقديم طلب' }[triggerType] || triggerMeta?.label) : triggerMeta?.label}
                </span>
              </div>

              <StepFlow
                steps={steps}
                openId={openId}
                onOpen={setOpenId}
                channels={channels}
                errors={attempted ? validation.steps : {}}
                onUpdate={updateStep}
                onDelete={deleteStep}
                onDuplicate={duplicateStep}
                onMove={moveStep}
                onInsert={insertStep}
              />

              {attempted && validation.stepsGeneral && (
                <p className="text-xs font-medium text-error" role="alert">
                  {validation.stepsGeneral}
                </p>
              )}
            </section>
          </div>

          {/* Desktop settings */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <SettingsPanel
                channels={channels}
                onChannelsChange={setChannels}
                description={description}
                onDescriptionChange={setDescription}
                stopOnReply={stopOnReply}
                onStopOnReplyChange={setStopOnReply}
                allowReentry={allowReentry}
                onAllowReentryChange={setAllowReentry}
                triggerType={triggerType}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
