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
import Select from '../../../../components/ui/Select'

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
  const [selectedChannels, setSelectedChannels] = useState<ChannelType[]>(['whatsapp'])
  const [noReplyHours, setNoReplyHours] = useState(24)
  const [noReplyUnit, setNoReplyUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [allowReentry, setAllowReentry] = useState(false)

  const toggleChannel = (chId: ChannelType) => {
    if (selectedChannels.includes(chId)) {
      if (selectedChannels.length > 1) {
        const next = selectedChannels.filter(c => c !== chId)
        setSelectedChannels(next)
        setChannel(next[0])
      }
    } else {
      const next = [...selectedChannels, chId]
      setSelectedChannels(next)
      setChannel(next[0])
    }
  }
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Target Channels (Select Multiple or All) *
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedChannels(CHANNELS.map(c => c.id))}
                  className="text-[11px] font-bold text-[var(--accent)] hover:underline"
                >
                  Select All Channels
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {CHANNELS.map(ch => {
                  const isSelected = selectedChannels.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-xs font-bold relative ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] shadow-sm'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg mb-1 flex items-center justify-center" style={{ background: ch.bg }}>
                        <span className="w-3 h-3 rounded-full" style={{ background: ch.color }} />
                      </div>
                      {ch.label}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
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
              <div className="p-4 bg-warning/70 dark:bg-warning/20 border border-warning dark:border-warning rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-warning" />
                  <span className="text-xs font-bold text-warning dark:text-warning">Wait Duration Without Customer Reply</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={noReplyHours}
                    onChange={(e) => setNoReplyHours(parseInt(e.target.value) || 1)}
                    className="w-24 h-10 px-3 text-center font-bold bg-[var(--surface)] border border-warning dark:border-warning rounded-lg text-sm text-[var(--text-primary)] outline-none"
                  />
                  <div className="w-32 shrink-0">
                    <Select
                      value={noReplyUnit}
                      onChange={(e) => setNoReplyUnit(e.target.value as any)}
                      options={[
                        { value: 'minutes', label: 'Minutes' },
                        { value: 'hours', label: 'Hours' },
                        { value: 'days', label: 'Days' },
                      ]}
                    />
                  </div>
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
            <div className="w-full bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border border-warning dark:border-warning rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning text-white flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-warning dark:text-warning">Entry Trigger</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {TRIGGERS.find(t => t.id === triggerType)?.label || triggerType}
                  </p>
                </div>
              </div>
              <span className="text-xs text-warning font-semibold px-2.5 py-1 bg-warning dark:bg-warning/30 rounded-lg">
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
                        className="p-1.5 rounded-lg hover:bg-error dark:hover:bg-error/30 text-[var(--text-tertiary)] hover:text-error"
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
                        <div className="w-32 shrink-0">
                          <Select
                            value={step.delay_unit || 'hours'}
                            onChange={(e) => updateStep(step.id, { delay_unit: e.target.value as any })}
                            options={[
                              { value: 'minutes', label: 'Minutes' },
                              { value: 'hours', label: 'Hours' },
                              { value: 'days', label: 'Days' },
                            ]}
                          />
                        </div>
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
                    <div className="space-y-1.5">
                      <Select
                        label="Action Type"
                        value={step.config?.action_type || 'stop_sequence'}
                        onChange={(e) => updateStep(step.id, { config: { ...step.config, action_type: e.target.value } })}
                        options={[
                          { value: 'stop_sequence', label: 'Stop Sequence' },
                          { value: 'add_tag', label: 'Add Tag to Contact' },
                          { value: 'remove_tag', label: 'Remove Tag from Contact' },
                        ]}
                      />
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-info/10 text-info hover:bg-info/20 text-xs font-bold transition-all border border-info/20"
            >
              <Plus size={14} /> Send Message
            </button>
            <button
              type="button"
              onClick={() => addStep('delay')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 text-xs font-bold transition-all border border-brand/20"
            >
              <Clock size={14} /> Add Wait Delay
            </button>
            <button
              type="button"
              onClick={() => addStep('condition')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 text-xs font-bold transition-all border border-success/20"
            >
              <GitBranch size={14} /> Add Condition
            </button>
            <button
              type="button"
              onClick={() => addStep('action')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warning/10 text-warning hover:bg-warning/20 text-xs font-bold transition-all border border-warning/20"
            >
              <Zap size={14} /> Add Action
            </button>
          </div>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="bg-error dark:bg-error/20 border border-error dark:border-error rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-error font-bold text-sm">
              <AlertCircle size={16} /> Please resolve the following issues before saving:
            </div>
            <ul className="list-disc pl-6 space-y-1 text-xs text-error">
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
          <CheckCircle2 size={16} className="text-success" /> {toastMessage}
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
        <Select
          label="Condition Type"
          value={config.type || 'customer_replied'}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={[
            {
              label: 'Conversation & Response',
              options: [
                { value: 'customer_replied', label: 'Customer Replied (since last step)' },
                { value: 'conversation_status', label: 'Conversation Status' },
                { value: 'last_message_from_customer', label: 'Last Message from Customer' },
                { value: 'last_message_from_ai', label: 'Last Message from AI' },
                { value: 'is_escalated', label: 'Is Escalated' },
                { value: 'is_not_escalated', label: 'Is Not Escalated' },
              ],
            },
            {
              label: 'Customer / Contact',
              options: [
                { value: 'customer_tag', label: 'Customer Tag' },
                { value: 'customer_field', label: 'Customer Field' },
                { value: 'customer_exists', label: 'Customer Exists' },
              ],
            },
            {
              label: 'Message Content',
              options: [
                { value: 'message_text', label: 'Message Text' },
                { value: 'message_language', label: 'Message Language' },
                { value: 'message_intent', label: 'Message Intent' },
              ],
            },
            {
              label: 'AI & Confidence',
              options: [
                { value: 'ai_confidence', label: 'AI Confidence Score' },
                { value: 'ai_intent', label: 'AI Detected Intent' },
                { value: 'needs_escalation', label: 'AI Needs Escalation' },
              ],
            },
            {
              label: 'Orders & Products',
              options: [
                { value: 'has_order', label: 'Has Active Order' },
                { value: 'does_not_have_order', label: 'Does Not Have Order' },
                { value: 'order_status', label: 'Order Status' },
                { value: 'order_total', label: 'Order Total Amount' },
                { value: 'product_exists', label: 'Product Name in Order' },
              ],
            },
            {
              label: 'Channel',
              options: [
                { value: 'channel', label: 'Channel Type' },
              ],
            },
            {
              label: 'Schedule & Time',
              options: [
                { value: 'within_business_hours', label: 'Within Business Hours' },
                { value: 'outside_business_hours', label: 'Outside Business Hours' },
                { value: 'day_of_week', label: 'Day of Week' },
                { value: 'time_of_day', label: 'Time of Day' },
              ],
            },
          ]}
        />
      </div>

      {needsField && (
        <div>
          <Select
            label="Field Name"
            value={config.field_name || 'name'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, field_name: e.target.value } })}
            options={[
              { value: 'name', label: 'Customer Name' },
              { value: 'email', label: 'Email Address' },
              { value: 'phone', label: 'Phone / Sender ID' },
            ]}
          />
        </div>
      )}

      {needsValue && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Select
              label="Operator"
              value={config.operator || 'equals'}
              onChange={(e) => updateStep(step.id, { condition_config: { ...config, operator: e.target.value } })}
              options={
                config.type === 'customer_tag'
                  ? [
                      { value: 'has_tag', label: 'Has Tag' },
                      { value: 'does_not_have_tag', label: 'Does Not Have Tag' },
                    ]
                  : ['ai_confidence', 'order_total'].includes(config.type)
                  ? [
                      { value: 'greater_than', label: 'Greater Than (>)' },
                      { value: 'greater_than_or_equal', label: 'Greater Than or Equal (≥)' },
                      { value: 'less_than', label: 'Less Than (<)' },
                      { value: 'less_than_or_equal', label: 'Less Than or Equal (≤)' },
                      { value: 'equals', label: 'Equals (=)' },
                    ]
                  : [
                      { value: 'equals', label: 'Equals' },
                      { value: 'not_equals', label: 'Does Not Equal' },
                      { value: 'contains', label: 'Contains' },
                      { value: 'does_not_contain', label: 'Does Not Contain' },
                      { value: 'starts_with', label: 'Starts With' },
                      { value: 'ends_with', label: 'Ends With' },
                    ]
              }
            />
          </div>

          <div>
            {config.type === 'channel' ? (
              <Select
                label="Value"
                value={config.value || 'whatsapp'}
                onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                options={[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'messenger', label: 'Messenger' },
                  { value: 'telegram', label: 'Telegram' },
                  { value: 'email', label: 'Email' },
                ]}
              />
            ) : config.type === 'day_of_week' ? (
              <Select
                label="Value"
                value={config.value || 'Monday'}
                onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({
                  value: d,
                  label: d,
                }))}
              />
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Value</label>
                <input
                  type={['ai_confidence', 'order_total'].includes(config.type) ? 'number' : 'text'}
                  value={config.value ?? ''}
                  onChange={(e) => updateStep(step.id, { condition_config: { ...config, value: e.target.value } })}
                  placeholder={config.type === 'ai_confidence' ? 'e.g. 80' : config.type === 'customer_tag' ? 'e.g. VIP' : 'Enter value...'}
                  className="w-full h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branching Routes */}
      <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
        <div>
          <Select
            size="sm"
            label="If Condition is TRUE"
            value={config.on_true || 'continue'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, on_true: e.target.value } })}
            options={[
              { value: 'continue', label: 'Continue to Next Step' },
              { value: 'stop', label: 'Stop Sequence' },
              { value: 'jump', label: 'Jump to Step Number...' },
            ]}
          />
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
          <Select
            size="sm"
            label="If Condition is FALSE"
            value={config.on_false || 'stop'}
            onChange={(e) => updateStep(step.id, { condition_config: { ...config, on_false: e.target.value } })}
            options={[
              { value: 'stop', label: 'Stop Sequence' },
              { value: 'continue', label: 'Continue to Next Step' },
              { value: 'jump', label: 'Jump to Step Number...' },
            ]}
          />
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