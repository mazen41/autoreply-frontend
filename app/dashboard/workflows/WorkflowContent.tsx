'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface Workflow {
  id: number
  name: string
  description: string | null
  is_active: boolean
  trigger: { type: string; config: any }
  conditions: Array<{ type: string; config: any; operator: string }>
  actions: Array<{ type: string; config: any; delay?: number }>
  execution_count: number
  last_executed_at: string | null
  created_at: string
}

interface WorkflowExecution {
  id: number
  workflow_id: number
  status: string
  trigger_data: any
  results: any
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export default function WorkflowContent() {
  const { isRTL, t } = useLang()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [showExecutions, setShowExecutions] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [testing, setTesting] = useState(false)
  const [testConversationId, setTestConversationId] = useState('')

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setWorkflows(data)
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async (workflowId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${workflowId}/executions`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setExecutions(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Workflow deleted successfully')
        fetchWorkflows()
      } else {
        toast.error('Failed to delete workflow')
      }
    } catch (error) {
      toast.error('Failed to delete workflow')
    }
  }

  const handleToggle = async (id: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Workflow status updated')
        fetchWorkflows()
      } else {
        toast.error('Failed to update workflow status')
      }
    } catch (error) {
      toast.error('Failed to update workflow status')
    }
  }

  const handleDuplicate = async (id: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Workflow duplicated successfully')
        fetchWorkflows()
      } else {
        toast.error('Failed to duplicate workflow')
      }
    } catch (error) {
      toast.error('Failed to duplicate workflow')
    }
  }

  const handleTest = async () => {
    if (!testConversationId.trim()) {
      toast.error('Please enter a conversation ID to test')
      return
    }

    if (!selectedWorkflow) return

    setTesting(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${selectedWorkflow.id}/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ conversation_id: testConversationId }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Workflow test completed')
      } else {
        toast.error(data.error || 'Workflow test failed')
      }
    } catch (error) {
      toast.error('Workflow test failed')
    } finally {
      setTesting(false)
    }
  }

  const viewExecutions = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setShowExecutions(true)
    fetchExecutions(workflow.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  if (showBuilder) {
    return (
      <WorkflowBuilder
        workflow={editingWorkflow}
        onSave={() => {
          setShowBuilder(false)
          setEditingWorkflow(null)
          fetchWorkflows()
        }}
        onCancel={() => {
          setShowBuilder(false)
          setEditingWorkflow(null)
        }}
      />
    )
  }

  if (showExecutions && selectedWorkflow) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowExecutions(false)}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          ← Back to Workflows
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            Execution History: {selectedWorkflow.name}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Total executions: {selectedWorkflow.execution_count}
          </p>

          {executions.length === 0 ? (
            <div className="text-center py-8 rounded-xl" style={{ background: 'var(--surface-elevated)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>No executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{
                      color: execution.status === 'completed' ? 'var(--accent)' : 
                            execution.status === 'failed' ? 'var(--error)' : 'var(--text-tertiary)'
                    }}>
                      {execution.status.toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(execution.created_at).toLocaleString()}
                    </span>
                  </div>
                  {execution.error_message && (
                    <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>
                      Error: {execution.error_message}
                    </p>
                  )}
                  {execution.results && (
                    <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(execution.results, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
              Workflows
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Automate your customer interactions with powerful workflows
            </p>
          </div>
          <button
            onClick={() => { setEditingWorkflow(null); setShowBuilder(true) }}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
          >
            + Create Workflow
          </button>
        </div>
      </motion.div>

      {/* Workflows List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No workflows yet</p>
            <button
              onClick={() => { setEditingWorkflow(null); setShowBuilder(true) }}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {workflow.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${workflow.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {workflow.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Executions: {workflow.execution_count}</span>
                      {workflow.last_executed_at && (
                        <span>Last: {new Date(workflow.last_executed_at).toLocaleString()}</span>
                      )}
                      <span>Trigger: {workflow.trigger.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewExecutions(workflow)}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title="View executions"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggle(workflow.id)}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title={workflow.is_active ? 'Disable' : 'Enable'}
                    >
                      {workflow.is_active ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => { setEditingWorkflow(workflow); setShowBuilder(true) }}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(workflow.id)}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Duplicate"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                      style={{ color: 'var(--error)' }}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function WorkflowBuilder({ workflow, onSave, onCancel }: { workflow: Workflow | null; onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [trigger, setTrigger] = useState(workflow?.trigger || { type: '', config: {} })
  const [conditions, setConditions] = useState(workflow?.conditions || [])
  const [actions, setActions] = useState(workflow?.actions || [])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    if (!trigger.type) {
      toast.error('Please select a trigger type')
      return
    }

    if (actions.length === 0) {
      toast.error('Please add at least one action')
      return
    }

    setSaving(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const method = workflow ? 'PUT' : 'POST'
      const url = workflow 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${workflow.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows`

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          trigger,
          conditions,
          actions,
        }),
      })

      if (res.ok) {
        toast.success('Workflow saved successfully')
        onSave()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save workflow')
      }
    } catch (error) {
      toast.error('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const addCondition = () => {
    setConditions([...conditions, { type: '', config: {}, operator: 'equals' }])
  }

  const addAction = () => {
    setActions([...actions, { type: '', config: {}, delay: 0 }])
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setConditions(newConditions)
  }

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setActions(newActions)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        ← Back to Workflows
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
          {workflow ? 'Edit Workflow' : 'Create New Workflow'}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Workflow Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome new customers"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Trigger Section */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Trigger</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Trigger Type *
              </label>
              <select
                value={trigger.type}
                onChange={(e) => setTrigger({ ...trigger, type: e.target.value, config: {} })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Select trigger type</option>
                <option value="new_conversation">New Conversation</option>
                <option value="new_message">New Message</option>
                <option value="conversation_assigned">Conversation Assigned</option>
                <option value="conversation_closed">Conversation Closed</option>
                <option value="conversation_reopened">Conversation Reopened</option>
                <option value="keyword">Keyword Match</option>
                <option value="customer_created">Customer Created</option>
                <option value="customer_tag_added">Customer Tag Added</option>
                <option value="ai_classification">AI Classification</option>
                <option value="business_hours">Business Hours</option>
              </select>
            </div>

            {trigger.type === 'keyword' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Keyword
                </label>
                <input
                  type="text"
                  value={trigger.config.keyword || ''}
                  onChange={(e) => setTrigger({ ...trigger, config: { ...trigger.config, keyword: e.target.value } })}
                  placeholder="Enter keyword to match"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            {trigger.type === 'customer_tag_added' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Tag
                </label>
                <input
                  type="text"
                  value={trigger.config.tag || ''}
                  onChange={(e) => setTrigger({ ...trigger, config: { ...trigger.config, tag: e.target.value } })}
                  placeholder="Enter tag name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            {trigger.type === 'ai_classification' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  value={trigger.config.category || ''}
                  onChange={(e) => setTrigger({ ...trigger, config: { ...trigger.config, category: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select category</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="general">General</option>
                </select>
              </div>
            )}

            {trigger.type === 'business_hours' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Condition
                </label>
                <select
                  value={trigger.config.condition || ''}
                  onChange={(e) => setTrigger({ ...trigger, config: { ...trigger.config, condition: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="outside_hours">Outside Business Hours</option>
                  <option value="inside_hours">Inside Business Hours</option>
                </select>
              </div>
            )}
          </div>

          {/* Conditions Section */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conditions</h3>
              <button
                onClick={addCondition}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                + Add Condition
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                No conditions - workflow will run for all triggers
              </p>
            ) : (
              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <div key={index} className="p-3 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        Condition {index + 1}
                      </span>
                      <button
                        onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                        className="text-xs"
                        style={{ color: 'var(--error)' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Field</label>
                        <select
                          value={condition.type}
                          onChange={(e) => updateCondition(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="">Select field</option>
                          <option value="conversation_status">Conversation Status</option>
                          <option value="conversation_category">Conversation Category</option>
                          <option value="conversation_priority">Conversation Priority</option>
                          <option value="customer_tag">Customer Tag</option>
                          <option value="team">Team</option>
                          <option value="assigned_agent">Assigned Agent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Operator</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="does_not_contain">Does Not Contain</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="exists">Exists</option>
                          <option value="does_not_exist">Does Not Exist</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Value</label>
                      <input
                        type="text"
                        value={condition.config.value || ''}
                        onChange={(e) => updateCondition(index, 'config', { ...condition.config, value: e.target.value })}
                        placeholder="Enter value"
                        className="w-full px-3 py-2 rounded-lg text-xs"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Actions</h3>
              <button
                onClick={addAction}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                + Add Action
              </button>
            </div>

            {actions.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                No actions added
              </p>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={index} className="p-3 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        Action {index + 1}
                      </span>
                      <button
                        onClick={() => setActions(actions.filter((_, i) => i !== index))}
                        className="text-xs"
                        style={{ color: 'var(--error)' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Action Type</label>
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="">Select action type</option>
                          <option value="send_message">Send Message</option>
                          <option value="send_email">Send Email</option>
                          <option value="add_tag">Add Tag</option>
                          <option value="remove_tag">Remove Tag</option>
                          <option value="assign_agent">Assign Agent</option>
                          <option value="assign_team">Assign Team</option>
                          <option value="set_priority">Set Priority</option>
                          <option value="close_conversation">Close Conversation</option>
                          <option value="reopen_conversation">Reopen Conversation</option>
                          <option value="call_ai">Call AI</option>
                          <option value="add_note">Add Note</option>
                          <option value="webhook">Webhook</option>
                          <option value="notify_team">Notify Team</option>
                        </select>
                      </div>

                      {action.type === 'send_message' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Message</label>
                          <textarea
                            value={action.config.message || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, message: e.target.value })}
                            placeholder="Enter message content"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}

                      {action.type === 'add_tag' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Tag</label>
                          <input
                            type="text"
                            value={action.config.tag || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, tag: e.target.value })}
                            placeholder="Enter tag name"
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}

                      {action.type === 'assign_agent' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Agent ID</label>
                          <input
                            type="number"
                            value={action.config.agent_id || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, agent_id: parseInt(e.target.value) })}
                            placeholder="Enter agent ID"
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}

                      {action.type === 'assign_team' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Team ID</label>
                          <input
                            type="number"
                            value={action.config.team_id || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, team_id: parseInt(e.target.value) })}
                            placeholder="Enter team ID"
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}

                      {action.type === 'set_priority' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Priority</label>
                          <select
                            value={action.config.priority || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, priority: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          >
                            <option value="">Select priority</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      )}

                      {action.type === 'webhook' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Webhook URL</label>
                          <input
                            type="url"
                            value={action.config.url || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, url: e.target.value })}
                            placeholder="Enter webhook URL"
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}

                      {action.type === 'notify_team' && (
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Team ID</label>
                          <input
                            type="number"
                            value={action.config.team_id || ''}
                            onChange={(e) => updateAction(index, 'config', { ...action.config, team_id: parseInt(e.target.value) })}
                            placeholder="Enter team ID"
                            className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                          <div className="mt-2">
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Message</label>
                            <input
                              type="text"
                              value={action.config.message || ''}
                              onChange={(e) => updateAction(index, 'config', { ...action.config, message: e.target.value })}
                              placeholder="Enter notification message"
                              className="w-full px-3 py-2 rounded-lg text-xs"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Delay (minutes)</label>
                        <input
                          type="number"
                          value={action.delay || 0}
                          onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value) || 0)}
                          placeholder="0 for immediate"
                          min="0"
                          className="w-full px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
              style={{ background: saving ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
            >
              {saving && (
                <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
              )}
              {workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}