'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Play, Clock, MessageSquare, GitBranch, Zap } from 'lucide-react'
import { useSequences, Sequence, SequenceStep } from '../../../../../hooks/useSequences'

export default function EditSequencePage() {
  const params = useParams()
  const router = useRouter()
  const sequenceId = params.id ? parseInt(params.id as string) : 0
  
  const { fetchSequence, updateSequence, activateSequence } = useSequences()
  
  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('manual')
  const [channel, setChannel] = useState('whatsapp')
  const [steps, setSteps] = useState<any[]>([])
  
  useEffect(() => {
    if (sequenceId) {
      loadSequence()
    }
  }, [sequenceId])
  
  const loadSequence = async () => {
    setLoading(true)
    const data = await fetchSequence(sequenceId)
    if (data) {
      setSequence(data)
      setName(data.name || '')
      setDescription(data.description || '')
      setTriggerType(data.trigger_type || 'manual')
      setChannel(data.channel || 'whatsapp')
      setSteps(data.steps || [])
    }
    setLoading(false)
  }
  
  const handleSave = async () => {
    if (!sequenceId) return
    
    setSaving(true)
    const updated = await updateSequence(sequenceId, {
      name,
      description,
      trigger_type: triggerType,
      channel,
      steps,
    })
    
    if (updated) {
      setSequence(updated)
      // Optionally show success message
    }
    setSaving(false)
  }
  
  const handleActivate = async () => {
    if (!sequenceId) return
    
    setActivating(true)
    await handleSave() // Save first
    const activated = await activateSequence(sequenceId)
    if (activated) {
      setSequence(activated)
      router.push(`/dashboard/sequences/${sequenceId}`)
    }
    setActivating(false)
  }
  
  const addStep = (type: 'message' | 'delay' | 'condition' | 'action') => {
    const newStep: any = {
      step_type: type,
      step_order: steps.length + 1,
    }
    
    if (type === 'message') {
      newStep.message = ''
      newStep.config = {}
    } else if (type === 'delay') {
      newStep.delay_hours = 1
      newStep.delay_unit = 'hours'
    } else if (type === 'condition') {
      newStep.condition_config = { type: 'customer_replied' }
    } else if (type === 'action') {
      newStep.action_config = { type: 'stop_sequence' }
    }
    
    setSteps([...steps, newStep])
  }
  
  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }
  
  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index)
    // Reorder remaining steps
    updatedSteps.forEach((step, i) => {
      step.step_order = i + 1
    })
    setSteps(updatedSteps)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading sequence...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/sequences/${sequenceId}`}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Edit Sequence</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{activating ? 'Activating...' : 'Save & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Sequence Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sequence name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What does this sequence do?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="manual">Manual</option>
                    <option value="new_user">New User</option>
                    <option value="tag_added">Tag Added</option>
                    <option value="no_reply">No Reply</option>
                    <option value="order_created">Order Created</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Steps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Sequence Steps</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addStep('message')}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm flex items-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => addStep('delay')}
                    className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm flex items-center space-x-1"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Delay</span>
                  </button>
                  <button
                    onClick={() => addStep('condition')}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm flex items-center space-x-1"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>Condition</span>
                  </button>
                  <button
                    onClick={() => addStep('action')}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm flex items-center space-x-1"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Action</span>
                  </button>
                </div>
              </div>
              
              {steps.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No steps yet. Add your first step to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              Step {index + 1}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                              {step.step_type}
                            </span>
                          </div>
                          
                          {step.step_type === 'message' && (
                            <textarea
                              value={step.message || ''}
                              onChange={(e) => updateStep(index, 'message', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Enter your message..."
                            />
                          )}
                          
                          {step.step_type === 'delay' && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={step.delay_hours || 0}
                                onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value))}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                min="0"
                              />
                              <select
                                value={step.delay_unit || 'hours'}
                                onChange={(e) => updateStep(index, 'delay_unit', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          )}
                          
                          {step.step_type === 'condition' && (
                            <select
                              value={step.condition_config?.type || 'customer_replied'}
                              onChange={(e) => updateStep(index, 'condition_config', { type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="customer_replied">Customer Replied</option>
                            </select>
                          )}
                          
                          {step.step_type === 'action' && (
                            <select
                              value={step.action_config?.type || 'stop_sequence'}
                              onChange={(e) => updateStep(index, 'action_config', { type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="stop_sequence">Stop Sequence</option>
                              <option value="add_tag">Add Tag</option>
                              <option value="remove_tag">Remove Tag</option>
                            </select>
                          )}
                        </div>
                        
                        <button
                          onClick={() => removeStep(index)}
                          className="ml-4 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
