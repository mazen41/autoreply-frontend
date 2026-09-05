'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useSequences, Sequence, SequenceStep } from '../../../../hooks/useSequences'
import {
  Plus, Trash2, Save, Play, ArrowLeft, MessageSquare, Clock, GitBranch,
  Copy, ChevronUp, ChevronDown, Sparkles, Variable, Eye, Check, AlertCircle,
  Zap, Settings, Sliders, ShieldCheck, Tag, ShoppingCart, UserCheck, RefreshCw,
  Mail, Send, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react'

type StepType = 'message' | 'delay' | 'condition' | 'action'
type ChannelType = 'whatsapp' | 'telegram' | 'email' | 'instagram' | 'messenger'

interface SequenceStepUI {
  id: string
  step_type: StepType
  step_order: number
  message?: string
  config?: Record<string, any>
  delay_hours?: number
  delay_unit?: 'minutes' | 'hours' | 'days'
  condition_config?: Record<string, any>
  is_active: boolean
}

const CHANNELS: { id: ChannelType; label: string; color: string; bg: string }[] = [
  { id: 'whatsapp',  label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.1)' },
  { id: 'instagram', label: 'Instagram', color: '#C13584', bg: 'rgba(193,53,132,0.1)' },
  { id: 'messenger', label: 'Messenger', color: '#0084FF', bg: 'rgba(0,132,255,0.1)' },
  { id: 'telegram',  label: 'Telegram',  color: '#2AABEE', bg: 'rgba(42,171,238,0.1)' },
  { id: 'email',     label: 'Email',     color: '#EA4335', bg: 'rgba(234,67,53,0.1)' },
]

const TRIGGERS = [
  { id: 'manual',        label: 'Manual Enrollment',  desc: 'Enroll contacts manually or via bulk actions', icon: '✋' },
  { id: 'new_user',      label: 'New Customer',       desc: 'When a new contact or conversation is created', icon: '👤' },
  { id: 'tag_added',     label: 'Contact Tagged',     desc: 'When a specific tag is attached to a contact', icon: '🏷️' },
  { id: 'no_reply',      label: 'No Reply Timer',     desc: 'When a customer has not replied for X time',  icon: '⏳' },
  { id: 'order_created', label: 'Order Placed',       desc: 'When a new order is completed in store',     icon: '🛒' },
]

const VARIABLES = [
  { tag: '{{customer_name}}', label: 'Customer Name' },
  { tag: '{{business_name}}', label: 'Business Name' },
  { tag: '{{order_number}}', label: 'Order Number' },
  { tag: '{{order_status}}', label: 'Order Status' },
  { tag: '{{product_name}}', label: 'Product Name' },
  { tag: '{{product_price}}', label: 'Price' },
]

export default function SequenceEditorPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = !!params?.id
  const sequenceId = params?.id ? parseInt(String(params.id)) : null

  const {
    createSequence,
    updateSequence,
    fetchSequence,
    activateSequence,
    loading
  } = useSequences()

  const [sequenceName, setSequenceName] = useState('')
  const [sequenceDescription, setSequenceDescription] = useState('')
  const [triggerType, setTriggerType] = useState<string>('manual')
  const [channel, setChannel] = useState<ChannelType>('whatsapp')
  const [noReplyHours, setNoReplyHours] = useState(24)
  const [noReplyUnit, setNoReplyUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [allowReentry, setAllowReentry] = useState(false)
  const [steps, setSteps] = useState<SequenceStepUI[]>([
    { id: '1', step_type: 'message', step_order: 1, is_active: true, message: 'Welcome to our store! How can we help you today?' },
    { id: '2', step_type: 'delay', step_order: 2, is_active: true, delay_hours: 1, delay_unit: 'days' },
    { id: '3', step_type: 'condition', step_order: 3, is_active: true, condition_config: { type: 'customer_replied', on_true: 'stop', on_false: 'continue' } },
    { id: '4', step_type: 'message', step_order: 4, is_active: true, message: 'Just checking in! Did you find what you were looking for?' },
  ])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load existing sequence if editing
  useEffect(() => {
    const loadSequence = async () => {
      if (!sequenceId) return
      setIsLoading(true)
      try {
        const sequence = await fetchSequence(sequenceId)
        if (sequence) {
          setSequenceName(sequence.name)
          setSequenceDescription(sequence.description || '')
          setTriggerType(sequence.trigger_type || 'manual')
          setChannel((sequence.channel || 'whatsapp') as any)

          if (sequence.trigger_type === 'no_reply' && sequence.trigger_config) {
            const cfg = sequence.trigger_config
            if (cfg.delay_value !== undefined && cfg.delay_unit) {
              setNoReplyHours(cfg.delay_value)
              setNoReplyUnit(cfg.delay_unit)
            } else {
              setNoReplyHours(cfg.hours || 24)
              setNoReplyUnit('hours')
            }
          }

          if (sequence.settings) {
            setAllowReentry(sequence.settings.allow_reentry || false)
          }

          const uiSteps = (sequence.steps || []).map((step: SequenceStep) => ({
            id: step.id.toString(),
            step_type: step.step_type as StepType,
            step_order: step.step_order,
            message: step.message || undefined,
            config: step.config || undefined,
            delay_hours: step.delay_hours,
            delay_unit: step.delay_unit as any,
            condition_config: step.condition_config || undefined,
            is_active: step.is_active,
          }))
          if (uiSteps.length > 0) {
            setSteps(uiSteps)
          }
        }
      } catch (error) {
        console.error('Failed to load sequence:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isEditing && sequenceId) {
      loadSequence()
    }
  }, [isEditing, sequenceId, fetchSequence])

  const addStep = useCallback((type: StepType) => {
    const newStep: SequenceStepUI = {
      id: Date.now().toString(),
      step_type: type,
      step_order: steps.length + 1,
      is_active: true,
      delay_hours: type === 'delay' ? 1 : 0,
      delay_unit: 'hours',
      message: type === 'message' ? '' : undefined,
      condition_config: type === 'condition' ? { type: 'customer_replied', on_true: 'stop', on_false: 'continue' } : undefined,
      config: type === 'action' ? { action_type: 'stop_sequence' } : undefined,
    }
    setSteps(prev => [...prev, newStep])
  }, [steps])

  const updateStep = useCallback((stepId: string, updates: Partial<SequenceStepUI>) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [])

  const deleteStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId).map((step, index) => ({
      ...step,
      step_order: index + 1,
    })))
  }, [])

  const duplicateStep = useCallback((stepId: string) => {
    const stepToDuplicate = steps.find(s => s.id === stepId)
    if (!stepToDuplicate) return

    const newStep: SequenceStepUI = {
      ...stepToDuplicate,
      id: Date.now().toString(),
      step_order: steps.length + 1,
    }
    setSteps(prev => [...prev, newStep])
    showToast('Step duplicated')
  }, [steps])

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(s => s.id === stepId)
    if (index === -1) return

    const newSteps = [...steps]
    const [movedStep] = newSteps.splice(index, 1)

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex > newSteps.length) return

    newSteps.splice(newIndex, 0, movedStep)
    setSteps(newSteps.map((step, i) => ({ ...step, step_order: i + 1 })))
  }, [steps])

  const validateSequence = useCallback(() => {
    const errors: string[] = []

    if (!sequenceName.trim()) {
      errors.push('Sequence name is required')
    }

    if (steps.length === 0) {
      errors.push('At least one step is required')
    }

    steps.forEach((step, index) => {
      if (step.step_type === 'message' && !step.message?.trim()) {
        errors.push(`Step ${index + 1}: Message content cannot be empty`)
      }
      if (step.step_type === 'delay' && (step.delay_hours ?? 0) < 0) {
        errors.push(`Step ${index + 1}: Delay duration cannot be negative`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }, [sequenceName, steps])

  const saveSequenceData = async (shouldActivate = false) => {
    if (!validateSequence()) return

    setIsSaving(true)
    try {
      const sequenceData: any = {
        name: sequenceName,
        description: sequenceDescription,
        trigger_type: triggerType,
        channel: channel,
        steps: steps,
        settings: {
          allow_reentry: allowReentry,
        },
      }

      if (triggerType === 'no_reply') {
        sequenceData.trigger_config = {
          delay_value: noReplyHours,
          delay_unit: noReplyUnit,
        }
      }

      let sequence: Sequence | null = null
      if (isEditing && sequenceId) {
        sequence = await updateSequence(sequenceId, sequenceData)
      } else {
        sequence = await createSequence(sequenceData)
      }

      if (sequence && shouldActivate) {
        await activateSequence(sequence.id)
      }

      if (sequence) {
        showToast(shouldActivate ? 'Sequence saved and activated!' : 'Sequence saved as draft')
        setTimeout(() => router.push('/dashboard/sequences'), 600)
      }
    } catch (error: any) {
      console.error('Failed to save sequence:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save sequence'
      setValidationErrors([errorMessage])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sequences"
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[var(--text-primary)]">
                {isEditing ? 'Edit Sequence' : 'Create Sequence'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
                {isEditing ? `ID: #${sequenceId}` : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">
              Build automated time-based message flows & conditions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => saveSequenceData(false)}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            onClick={() => saveSequenceData(true)}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-end)] text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <Play size={15} />
            <span>{isSaving ? 'Activating...' : 'Save & Activate'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── General Configuration Card ── */}
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-[var(--accent)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Sequence Settings</h2>
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">Step 1 of 2</span>
          </div>

          <div className="space-y-5">
            {/* Sequence Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Sequence Name *
              </label>
              <input
                type="text"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="e.g. Welcome New Store Customers"
                className="w-full h-11 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Description (Optional)
              </label>
              <textarea
                value={sequenceDescription}
                onChange={(e) => setSequenceDescription(e.target.value)}
                rows={2}
                placeholder="Briefly describe the goal of this sequence..."
                className="w-full p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all resize-none"
              />
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                Target Channel *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannel(ch.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-xs font-bold ${
                      channel === ch.id
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] shadow-sm'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg mb-1 flex items-center justify-center" style={{ background: ch.bg }}>
                      <span className="w-3 h-3 rounded-full" style={{ background: ch.color }} />
                    </div>
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Trigger Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                Entry Trigger *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRIGGERS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTriggerType(t.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      triggerType === t.id
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${triggerType === t.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                        {t.label}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">{t.desc}</p>
                    </div>
                    {triggerType === t.id && (
                      <CheckCircle2 size={16} className="text-[var(--accent)] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* No Reply Configuration */}
            {triggerType === 'no_reply' && (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Wait Duration Without Customer Reply</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={noReplyHours}
                    onChange={(e) => setNoReplyHours(parseInt(e.target.value) || 1)}
                    className="w-24 h-10 px-3 text-center font-bold bg-[var(--surface)] border border-amber-300 dark:border-amber-700 rounded-lg text-sm text-[var(--text-primary)] outline-none"
                  />
                  <select
                    value={noReplyUnit}
                    onChange={(e) => setNoReplyUnit(e.target.value as any)}
                    className="h-10 px-3 bg-[var(--surface)] border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Allow Re-entry Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--divider)]">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Allow Contact Re-entry</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Contacts can enter this sequence multiple times over time</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowReentry(!allowReentry)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${allowReentry ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowReentry ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* ── Sequence Step Timeline Builder ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Visual Step Timeline</h2>
              <p className="text-xs text-[var(--text-secondary)]">Drag or use arrow buttons to reorder execution steps</p>
            </div>
            <span className="px-3 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full text-xs font-bold text-[var(--text-secondary)]">
              {steps.length} Step{steps.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Trigger Header Node */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Entry Trigger</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {TRIGGERS.find(t => t.id === triggerType)?.label || triggerType}
                  </p>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                Starts Sequence
              </span>
            </div>

            <div className="w-px h-6 bg-[var(--border)] my-1" />
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:border-[var(--accent)]/50 transition-all space-y-4">
                  {/* Step Card Header */}
                  <div className="flex items-center justify-between border-b border-[var(--divider)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] capitalize">
                        {step.step_type} Step
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-tertiary)] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-tertiary)] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => duplicateStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-[var(--text-tertiary)] hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Step Editor Inputs */}
                  {step.step_type === 'message' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Message Content
                      </label>

                      {/* Variable Insertion Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] flex items-center gap-1 mr-1">
                          <Variable size={11} /> Variables:
                        </span>
                        {VARIABLES.map(v => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => updateStep(step.id, { message: (step.message || '') + ' ' + v.tag })}
                            className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        value={step.message || ''}
                        onChange={(e) => updateStep(step.id, { message: e.target.value })}
                        placeholder="Type message content here... Use variables above."
                        className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all resize-none"
                      />

                      {/* Live Channel Preview */}
                      {step.message && (
                        <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] flex items-start gap-3">
                          <Eye size={15} className="text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                              {channel} Live Preview
                            </span>
                            <div className="bg-[var(--surface-elevated)] p-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-primary)] whitespace-pre-wrap max-w-sm">
                              {step.message}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step.step_type === 'delay' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Wait Duration Before Next Step
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={step.delay_hours || 1}
                          onChange={(e) => updateStep(step.id, { delay_hours: parseInt(e.target.value) || 1 })}
                          className="w-28 h-10 px-3 text-center font-bold bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                        <select
                          value={step.delay_unit || 'hours'}
                          onChange={(e) => updateStep(step.id, { delay_unit: e.target.value as any })}
                          className="h-10 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {step.step_type === 'condition' && (
                    <ConditionEditor
                      step={step}
                      updateStep={updateStep}
                      availableSteps={steps}
                    />
                  )}

                  {step.step_type === 'action' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Action Type
                      </label>
                      <select
                        value={step.config?.action_type || 'stop_sequence'}
                        onChange={(e) => updateStep(step.id, { config: { ...step.config, action_type: e.target.value } })}
                        className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-primary)] outline-none"
                      >
                        <option value="stop_sequence">Stop Sequence</option>
                        <option value="add_tag">Add Tag to Contact</option>
                        <option value="remove_tag">Remove Tag from Contact</option>
                      </select>
                    </div>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-px h-6 bg-[var(--border)]" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Add Step Controls */}
          <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => addStep('message')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-bold transition-all border border-blue-500/20"
            >
              <Plus size={14} /> Send Message
            </button>
            <button
              type="button"
              onClick={() => addStep('delay')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 text-xs font-bold transition-all border border-purple-500/20"
            >
              <Clock size={14} /> Add Wait Delay
            </button>
            <button
              type="button"
              onClick={() => addStep('condition')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20"
            >
              <GitBranch size={14} /> Add Condition
            </button>
            <button
              type="button"
              onClick={() => addStep('action')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-bold transition-all border border-amber-500/20"
            >
              <Zap size={14} /> Add Action
            </button>
          </div>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle size={16} /> Please resolve the following issues before saving:
            </div>
            <ul className="list-disc pl-6 space-y-1 text-xs text-red-500">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-[var(--text-primary)] text-[var(--background)] rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-emerald-400" /> {toastMessage}
        </div>
      )}

    </div>
  )
}

function ConditionEditor({ step, updateStep, availableSteps }: { step: any; updateStep: (id: string, data: any) => void; availableSteps: any[] }) {
  const config = step.condition_config || { type: 'customer_replied', operator: 'equals', value: '' }

  const handleTypeChange = (newType: string) => {
    let defaultOp = 'equals'
    if (newType === 'customer_tag') defaultOp = 'has_tag'
    if (newType === 'ai_confidence' || newType === 'order_total') defaultOp = 'greater_than'
    if (newType === 'message_text') defaultOp = 'contains'

    updateStep(step.id, {
      condition_config: {
        ...config,
        type: newType,
        operator: defaultOp,
      }
    })
  }

  const needsValue = ['customer_tag', 'customer_field', 'message_text', 'message_language', 'message_intent', 'ai_confidence', 'ai_intent', 'order_status', 'order_total', 'product_exists', 'channel', 'day_of_week', 'time_of_day', 'conversation_status'].includes(config.type)
  const needsField = config.type === 'customer_field'

  return (
    <div className="space-y-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Condition Type</label>
        <select
          value={config.type || 'customer_replied'}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          <optgroup label="Conversation & Response">
            <option value="customer_replied">Customer Replied (since last step)</option>
            <option value="conversation_status">Conversation Status</option>
            <option value="last_message_from_customer">Last Message from Customer</option>
            <option value="last_message_from_ai">Last Message from AI</option>
            <option value="is_escalated">Is Escalated</option>
            <option value="is_not_escalated">Is Not Escalated</option>
          </optgroup>

          <optgroup label="Customer / Contact">
            <option value="customer_tag">Customer Tag</option>
            <option value="customer_field">Customer Field</option>
            <option value="customer_exists">Customer Exists</option>
          </optgroup>

          <optgroup label="Message Content">
            <option value="message_text">Message Text</option>
            <option value="message_language">Message Language</option>
            <option value="message_intent">Message Intent</option>
          </optgroup>

          <optgroup label="AI & Confidence">
            <option value="ai_confidence">AI Confidence Score</option>
            <option value="ai_intent">AI Detected Intent</option>
            <option value="needs_escalation">AI Needs Escalation</option>
          </optgroup>

          <optgroup label="Orders & Products">
            <option value="has_order">Has Active Order</option>
            <option value="does_not_have_order">Does Not Have Order</option>
            <option value="order_status">Order Status</option>
            <option value="order_total">Order Total Amount</option>
            <option value="product_exists">Product Name in Order</option>
          </optgroup>

          <optgroup label="Channel">
            <option value="channel">Channel Type</option>
          </optgroup>

          <optgroup label="Schedule & Time">
            <option value="within_business_hours">Within Business Hours</option>
            <option value="outside_business_hours">Outside Business Hours</option>
            <option value="day_of_week">Day of Week</option>
            <option value="time_of_day">Time of Day</option>
          </optgroup>
        </select>
      </div>

      {needsField && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Field Name</label>
          <select
            value={config.field_name || 'name'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, field_name: e.target.value } })}
            className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="name">Customer Name</option>
            <option value="email">Email Address</option>
            <option value="phone">Phone / Sender ID</option>
          </select>
        </div>
      )}

      {needsValue && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Operator</label>
            <select
              value={config.operator || 'equals'}
              onChange={(e) => updateStep(step.id, { condition_config: { ...config, operator: e.target.value } })}
              className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              {config.type === 'customer_tag' ? (
                <>
                  <option value="has_tag">Has Tag</option>
                  <option value="does_not_have_tag">Does Not Have Tag</option>
                </>
              ) : ['ai_confidence', 'order_total'].includes(config.type) ? (
                <>
                  <option value="greater_than">Greater Than (&gt;)</option>
                  <option value="greater_than_or_equal">Greater Than or Equal (&ge;)</option>
                  <option value="less_than">Less Than (&lt;)</option>
                  <option value="less_than_or_equal">Less Than or Equal (&le;)</option>
                  <option value="equals">Equals (=)</option>
                </>
              ) : (
                <>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Does Not Equal</option>
                  <option value="contains">Contains</option>
                  <option value="does_not_contain">Does Not Contain</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Value</label>
            {config.type === 'channel' ? (
              <select
                value={config.value || 'whatsapp'}
                onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="messenger">Messenger</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
              </select>
            ) : config.type === 'day_of_week' ? (
              <select
                value={config.value || 'Monday'}
                onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input
                type={['ai_confidence', 'order_total'].includes(config.type) ? 'number' : 'text'}
                value={config.value ?? ''}
                onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                placeholder={config.type === 'ai_confidence' ? 'e.g. 80' : config.type === 'customer_tag' ? 'e.g. VIP' : 'Enter value...'}
                className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>
        </div>
      )}

      {/* Branching Routes */}
      <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">If Condition is TRUE</label>
          <select
            value={config.on_true || 'continue'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, on_true: e.target.value } })}
            className="w-full h-9 px-3 bg-[var(--surface-elevated)] border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-none"
          >
            <option value="continue">Continue to Next Step</option>
            <option value="stop">Stop Sequence</option>
            <option value="jump">Jump to Step Number...</option>
          </select>
          {config.on_true === 'jump' && (
            <input
              type="number"
              min="1"
              value={config.true_step_order || 1}
              onChange={(e) => updateStep(step.id, { condition_config: { ...config, true_step_order: parseInt(e.target.value) || 1 } })}
              placeholder="Step order #"
              className="w-full mt-1.5 px-3 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-xs font-bold"
            />
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-rose-500 uppercase mb-1">If Condition is FALSE</label>
          <select
            value={config.on_false || 'stop'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, on_false: e.target.value } })}
            className="w-full h-9 px-3 bg-[var(--surface-elevated)] border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-none"
          >
            <option value="stop">Stop Sequence</option>
            <option value="continue">Continue to Next Step</option>
            <option value="jump">Jump to Step Number...</option>
          </select>
          {config.on_false === 'jump' && (
            <input
              type="number"
              min="1"
              value={config.false_step_order || 1}
              onChange={(e) => updateStep(step.id, { condition_config: { ...config, false_step_order: parseInt(e.target.value) || 1 } })}
              placeholder="Step order #"
              className="w-full mt-1.5 px-3 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-xs font-bold"
            />
          )}
        </div>
      </div>
    </div>
  )
}