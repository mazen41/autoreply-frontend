'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSequences, Sequence, SequenceStep } from '../../../../hooks/useSequences'
import { Plus, Trash2, Save, Play, ArrowLeft, MessageSquare, Clock, GitBranch, Copy } from 'lucide-react'

type StepType = 'message' | 'delay' | 'condition' | 'action'

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

export default function SequenceEditorPage() {
  const router = useRouter()
  const params = useParams()
  const isEditing = !!params.id
  const sequenceId = params.id ? parseInt(String(params.id)) : null
  
  const { 
    createSequence, 
    updateSequence, 
    fetchSequence, 
    activateSequence,
    loading 
  } = useSequences()
  
  const [sequenceName, setSequenceName] = useState('')
  const [sequenceDescription, setSequenceDescription] = useState('')
  const [triggerType, setTriggerType] = useState<'manual' | 'new_user' | 'tag_added' | 'no_reply' | 'order_created'>('manual')
  const [channel, setChannel] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp')
  const [steps, setSteps] = useState<SequenceStepUI[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
          
          // Convert backend steps to UI format
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
          setSteps(uiSteps)
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
      condition_config: type === 'condition' ? { type: 'customer_replied' } : undefined,
    }
    setSteps([...steps, newStep])
  }, [steps])

  const updateStep = useCallback((stepId: string, updates: Partial<SequenceStepUI>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [steps])

  const deleteStep = useCallback((stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId).map((step, index) => ({
      ...step,
      step_order: index + 1,
    })))
  }, [steps])

  const duplicateStep = useCallback((stepId: string) => {
    const stepToDuplicate = steps.find(s => s.id === stepId)
    if (!stepToDuplicate) return

    const newStep: SequenceStepUI = {
      ...stepToDuplicate,
      id: Date.now().toString(),
      step_order: steps.length + 1,
    }
    setSteps([...steps, newStep])
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
        errors.push(`Step ${index + 1}: Message content is required`)
      }

      if (step.step_type === 'delay' && (step.delay_hours ?? 0) < 0) {
        errors.push(`Step ${index + 1}: Delay cannot be negative`)
      }

      if (step.step_type === 'condition' && !step.condition_config?.type) {
        errors.push(`Step ${index + 1}: Condition type is required`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }, [sequenceName, steps])

  const handleSaveDraft = useCallback(async () => {
    if (!validateSequence()) return

    setIsSaving(true)
    try {
      const sequenceData = {
        name: sequenceName,
        description: sequenceDescription,
        trigger_type: triggerType,
        channel: channel,
        steps: steps,
      }

      let sequence: Sequence | null = null
      if (isEditing && sequenceId) {
        sequence = await updateSequence(sequenceId, sequenceData)
      } else {
        sequence = await createSequence(sequenceData)
      }

      if (sequence) {
        router.push('/dashboard/sequences')
      }
    } catch (error: any) {
      console.error('Failed to save sequence:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save sequence'
      setValidationErrors([errorMessage])
    } finally {
      setIsSaving(false)
    }
  }, [sequenceName, sequenceDescription, triggerType, channel, steps, isEditing, sequenceId, createSequence, updateSequence, router, validateSequence])

  const handleActivate = useCallback(async () => {
    if (!validateSequence()) return

    setIsSaving(true)
    try {
      const sequenceData = {
        name: sequenceName,
        description: sequenceDescription,
        trigger_type: triggerType,
        channel: channel,
        steps: steps,
      }

      let sequence: Sequence | null = null
      if (isEditing && sequenceId) {
        sequence = await updateSequence(sequenceId, sequenceData)
      } else {
        sequence = await createSequence(sequenceData)
      }

      if (sequence) {
        // Activate the sequence
        const activated = await activateSequence(sequence.id)
        
        if (activated) {
          router.push('/dashboard/sequences')
        } else {
          setValidationErrors(['Failed to activate sequence'])
        }
      }
    } catch (error: any) {
      console.error('Failed to save and activate sequence:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save and activate sequence'
      setValidationErrors([errorMessage])
    } finally {
      setIsSaving(false)
    }
  }, [sequenceName, sequenceDescription, triggerType, channel, steps, isEditing, sequenceId, createSequence, updateSequence, activateSequence, router, validateSequence])

  const renderStepEditor = (step: SequenceStepUI, index: number) => {
    switch (step.step_type) {
      case 'message':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Message Content</label>
            <textarea
              value={step.message || ''}
              onChange={(e) => updateStep(step.id, { message: e.target.value })}
              className="w-full h-24 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors resize-none"
              placeholder="Enter your message..."
            />
          </div>
        )
      case 'delay':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Delay Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={step.delay_hours || 0}
                onChange={(e) => updateStep(step.id, { delay_hours: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                min="0"
              />
              <select
                value={step.delay_unit || 'hours'}
                onChange={(e) => updateStep(step.id, { delay_unit: e.target.value as any })}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )
      case 'condition':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Condition Type</label>
            <select
              value={step.condition_config?.type || 'customer_replied'}
              onChange={(e) => updateStep(step.id, { condition_config: { type: e.target.value } })}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="customer_replied">Customer Replied</option>
            </select>
          </div>
        )
      case 'action':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Action Type</label>
            <select
              value={step.config?.action_type || 'stop_sequence'}
              onChange={(e) => updateStep(step.id, { config: { action_type: e.target.value } })}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="stop_sequence">Stop Sequence</option>
            </select>
          </div>
        )
      default:
        return null
    }
  }

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} />
      case 'delay': return <Clock size={16} />
      case 'condition': return <GitBranch size={16} />
      case 'action': return <Play size={16} />
      default: return null
    }
  }

  const getStepTypeLabel = (type: StepType) => {
    switch (type) {
      case 'message': return 'Message'
      case 'delay': return 'Delay'
      case 'condition': return 'Condition'
      case 'action': return 'Action'
      default: return 'Unknown'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {isEditing ? 'Edit Sequence' : 'Create Sequence'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {isEditing ? 'Modify your automated message flow' : 'Build an automated message flow'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            onClick={handleActivate}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold shadow-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            Activate
          </button>
        </div>
      </div>

      {/* Sequence Settings */}
      {isLoading ? (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Sequence Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Sequence Name</label>
              <input
                type="text"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Welcome New Customers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Description</label>
              <textarea
                value={sequenceDescription}
                onChange={(e) => setSequenceDescription(e.target.value)}
                className="w-full h-20 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors resize-none"
                placeholder="Describe what this sequence does..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Trigger</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="manual">Manual</option>
                  <option value="new_user">New User</option>
                  <option value="tag_added">Tag Added</option>
                  <option value="no_reply">No Reply</option>
                  <option value="order_created">Order Created</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Builder */}
      {isLoading ? (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Sequence Steps</h2>
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
                <Plus size={16} />
                Add Step
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
                <button onClick={() => addStep('message')} className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                  <MessageSquare size={14} /> Message
                </button>
                <button onClick={() => addStep('delay')} className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                  <Clock size={14} /> Delay
                </button>
                <button onClick={() => addStep('condition')} className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                  <GitBranch size={14} /> Condition
                </button>
                <button onClick={() => addStep('action')} className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                  <Play size={14} /> Action
                </button>
              </div>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">No steps yet. Add your first step to get started.</p>
              <button
                onClick={() => addStep('message')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Plus size={16} /> Add First Step
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                        {getStepIcon(step.step_type)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          Step {index + 1}: {getStepTypeLabel(step.step_type)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === steps.length - 1}
                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => duplicateStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {renderStepEditor(step, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Validation Errors</h3>
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-xs text-red-600 dark:text-red-300">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}