'use client'

import React, { useState, useEffect } from 'react'
import {
  GitFork,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit2,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  History,
  Tag,
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  Sliders,
  ChevronLeft
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input, { Textarea } from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import FilterBar from '../../../components/ui/FilterBar'
import EmptyState from '../../../components/ui/EmptyState'
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

const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: 1,
    name: 'Auto-Assign High Value Leads to VIP Support',
    description: 'When an incoming inquiry is classified as Wholesale or VIP, assign directly to Lead Agent and tag as VIP.',
    is_active: true,
    trigger: { type: 'ai_classification', config: { category: 'sales' } },
    conditions: [{ type: 'conversation_priority', config: { value: 'high' }, operator: 'equals' }],
    actions: [
      { type: 'add_tag', config: { tag: 'VIP-Client' } },
      { type: 'assign_agent', config: { agent_id: 2 } },
      { type: 'send_message', config: { message: 'Hello! You have been connected with our priority accounts specialist.' } },
    ],
    execution_count: 1420,
    last_executed_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    created_at: '2025-01-08T10:00:00Z',
  },
  {
    id: 2,
    name: 'After-Hours Emergency Auto-Responder',
    description: 'Sends automated response informing customers of business operating hours when receiving messages after 10 PM.',
    is_active: true,
    trigger: { type: 'business_hours', config: { condition: 'outside_hours' } },
    conditions: [],
    actions: [
      { type: 'send_message', config: { message: 'Thanks for reaching out! Our team is currently offline. We will reply at 8:00 AM.' } },
      { type: 'add_tag', config: { tag: 'after-hours' } },
    ],
    execution_count: 3840,
    last_executed_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_at: '2025-01-12T14:30:00Z',
  },
  {
    id: 3,
    name: 'Complaint Keyword Auto-Escalation',
    description: 'Scans for keywords like "refund", "broken", or "dispute" and immediately alerts the operations supervisor.',
    is_active: false,
    trigger: { type: 'keyword', config: { keyword: 'refund' } },
    conditions: [{ type: 'conversation_status', config: { value: 'open' }, operator: 'equals' }],
    actions: [
      { type: 'set_priority', config: { priority: 'high' } },
      { type: 'notify_team', config: { team_id: 1, message: 'Potential escalation triggered by refund keyword' } },
    ],
    execution_count: 190,
    last_executed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    created_at: '2025-02-01T09:00:00Z',
  },
]

export default function WorkflowContent() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [showExecutions, setShowExecutions] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) {
        setWorkflows(DEMO_WORKFLOWS)
        setLoading(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setWorkflows(data)
      } else {
        setWorkflows(DEMO_WORKFLOWS)
      }
    } catch {
      setWorkflows(DEMO_WORKFLOWS)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async (workflowId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) {
        setExecutions([
          {
            id: 1,
            workflow_id: workflowId,
            status: 'completed',
            trigger_data: { event: 'new_message', sender: '+966509998888' },
            results: { action_taken: 'Tagged VIP, assigned to agent #2' },
            error_message: null,
            started_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            completed_at: new Date(Date.now() - 1000 * 60 * 15 + 400).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: 2,
            workflow_id: workflowId,
            status: 'completed',
            trigger_data: { event: 'new_message', sender: '+966501112222' },
            results: { action_taken: 'Dispatched automated notification' },
            error_message: null,
            started_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
            completed_at: new Date(Date.now() - 1000 * 60 * 80 + 350).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
          },
        ])
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${workflowId}/executions`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setExecutions(data.data || data)
      }
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow rule?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      }
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Workflow deleted')
    } catch {
      toast.error('Failed to delete workflow')
    }
  }

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${id}/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      }
      setWorkflows(prev =>
        prev.map(w => (w.id === id ? { ...w, is_active: !currentStatus } : w))
      )
      toast.success(`Workflow ${!currentStatus ? 'activated' : 'paused'}`)
    } catch {
      toast.error('Failed to update workflow status')
    }
  }

  const handleDuplicate = (id: number) => {
    const item = workflows.find(w => w.id === id)
    if (!item) return
    const duplicated: Workflow = {
      ...item,
      id: Date.now(),
      name: `${item.name} (Copy)`,
      execution_count: 0,
      last_executed_at: null,
      created_at: new Date().toISOString(),
    }
    setWorkflows([duplicated, ...workflows])
    toast.success('Workflow duplicated successfully')
  }

  const viewExecutions = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setShowExecutions(true)
    fetchExecutions(workflow.id)
  }

  const filteredWorkflows = workflows.filter(w => {
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && w.is_active) ||
      (statusFilter === 'paused' && !w.is_active)
    return matchSearch && matchStatus
  })

  const totalRuns = workflows.reduce((acc, w) => acc + w.execution_count, 0)
  const activeCount = workflows.filter(w => w.is_active).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">Loading workflow automations...</span>
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExecutions(false)}
            icon={<ChevronLeft size={14} />}
          >
            Back to Workflows
          </Button>
          <div>
            <h2 className="text-base font-bold text-text-primary">Execution Audit Log</h2>
            <p className="text-xs text-text-tertiary">{selectedWorkflow.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Runs</CardTitle>
              <Badge variant="outline">{selectedWorkflow.execution_count} Total Executions</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {executions.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={History}
                  title="No execution runs recorded"
                  description="Events will log here automatically when incoming messages trigger this workflow."
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {executions.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-surface-elevated/40 transition-colors text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : 'warning'}
                          size="sm"
                          dot
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                        <span className="text-text-tertiary">Execution #{item.id}</span>
                      </div>
                      <span className="text-text-tertiary">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    {item.results && (
                      <div className="bg-surface p-2.5 rounded-lg border border-border/60 font-mono text-[11px] text-text-secondary">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(item.results, null, 2)}</pre>
                      </div>
                    )}
                    {item.error_message && (
                      <div className="text-error bg-error/10 p-2.5 rounded-lg border border-error/20">
                        {item.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows & Rule Automations"
        description="Build event-driven if/then automation recipes to route chats, tag conversations, notify internal teams, and trigger AI actions automatically."
        badge={
          <Badge variant="ai" dot>
            Event Triggers & Actions
          </Badge>
        }
        primaryAction={
          <Button
            variant="primary"
            onClick={() => {
              setEditingWorkflow(null)
              setShowBuilder(true)
            }}
            icon={<Plus size={14} />}
          >
            Create Workflow
          </Button>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Automations"
          value={workflows.length}
          subValue={`${activeCount} active rules`}
          icon={<GitFork size={18} />}
        />
        <MetricCard
          label="Active Recipes"
          value={activeCount}
          subValue="Listening to live events"
          icon={<Play size={18} />}
          variant="ai"
        />
        <MetricCard
          label="Total Runs Executed"
          value={totalRuns.toLocaleString()}
          subValue="Automated events triggered"
          icon={<Activity size={18} />}
        />
        <MetricCard
          label="Success Rate"
          value="99.4%"
          subValue="Minimal error drop-off"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search workflows by rule name or action..."
        tabs={[
          { id: 'all', label: 'All Workflows', count: workflows.length },
          { id: 'active', label: 'Active', count: activeCount },
          { id: 'paused', label: 'Paused', count: workflows.length - activeCount },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      {/* Workflows Directory */}
      {filteredWorkflows.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={GitFork}
            title="No workflow automations found"
            description="Create custom rules to automatically categorize customer chats, set priority levels, and notify sales agents."
            primaryAction={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingWorkflow(null)
                  setShowBuilder(true)
                }}
              >
                Create Workflow
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} variant="interactive" className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-sm text-text-primary tracking-tight">
                      {workflow.name}
                    </h3>
                    <Badge variant={workflow.is_active ? 'success' : 'outline'} dot size="sm">
                      {workflow.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  {workflow.description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {workflow.description}
                    </p>
                  )}

                  {/* Flow Diagram Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                    {/* Trigger */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 border border-warning/20 text-warning font-medium">
                      <Zap size={12} />
                      <span className="capitalize">{workflow.trigger.type.replace(/_/g, ' ')}</span>
                    </div>

                    <ArrowRight size={13} className="text-text-tertiary" />

                    {/* Conditions */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-info/10 border border-info/20 text-info font-medium">
                      <Sliders size={12} />
                      <span>{workflow.conditions.length} condition{workflow.conditions.length === 1 ? '' : 's'}</span>
                    </div>

                    <ArrowRight size={13} className="text-text-tertiary" />

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand/10 border border-brand/20 text-brand font-medium">
                      <GitFork size={12} />
                      <span>{workflow.actions.length} action{workflow.actions.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-text-tertiary pt-1">
                    <span>{workflow.execution_count.toLocaleString()} executions</span>
                    {workflow.last_executed_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> Last triggered {new Date(workflow.last_executed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1.5 self-start lg:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => viewExecutions(workflow)}
                    icon={<History size={12} />}
                  >
                    History
                  </Button>
                  <Button
                    variant={workflow.is_active ? 'outline' : 'secondary'}
                    size="xs"
                    onClick={() => handleToggle(workflow.id, workflow.is_active)}
                    icon={workflow.is_active ? <Pause size={12} /> : <Play size={12} />}
                  >
                    {workflow.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setEditingWorkflow(workflow)
                      setShowBuilder(true)
                    }}
                    icon={<Edit2 size={12} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDuplicate(workflow.id)}
                    icon={<Copy size={12} />}
                    title="Duplicate"
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDelete(workflow.id)}
                    className="text-text-tertiary hover:text-error hover:bg-error/10"
                    icon={<Trash2 size={12} />}
                    title="Delete"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkflowBuilder({
  workflow,
  onSave,
  onCancel,
}: {
  workflow: Workflow | null
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [trigger, setTrigger] = useState(workflow?.trigger || { type: 'new_conversation', config: {} })
  const [conditions, setConditions] = useState(workflow?.conditions || [])
  const [actions, setActions] = useState(
    workflow?.actions || [{ type: 'send_message', config: { message: 'Welcome to our store!' }, delay: 0 }]
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please assign a workflow name')
      return
    }
    if (!trigger.type) {
      toast.error('Please specify a trigger condition')
      return
    }
    if (actions.length === 0) {
      toast.error('Please add at least one execution action')
      return
    }

    setSaving(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const method = workflow ? 'PUT' : 'POST'
      const url = workflow
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows/${workflow.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/workflows`

      if (token) {
        await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ name, description, trigger, conditions, actions }),
        })
      }
      toast.success(workflow ? 'Workflow updated' : 'Workflow created successfully')
      onSave()
    } catch {
      toast.error('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const addCondition = () => {
    setConditions([...conditions, { type: 'conversation_priority', config: { value: 'high' }, operator: 'equals' }])
  }

  const addAction = () => {
    setActions([...actions, { type: 'send_message', config: { message: '' }, delay: 0 }])
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onCancel} icon={<ChevronLeft size={14} />}>
          Cancel & Return
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          {workflow ? 'Save Updates' : 'Publish Workflow'}
        </Button>
      </div>

      <PageHeader
        title={workflow ? 'Edit Workflow Recipe' : 'New Automation Recipe'}
        description="Define triggers, conditions, and automated actions to run on live customer interactions."
      />

      <Card className="space-y-6 p-6">
        {/* Core Metadata */}
        <div className="space-y-4">
          <Input
            label="Recipe Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., VIP Route to Sales Lead"
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the intent and behavior of this automation..."
              rows={2}
            />
          </div>
        </div>

        {/* 1. TRIGGER SECTION */}
        <div className="p-5 rounded-xl bg-warning/5 border border-warning/20 space-y-4">
          <div className="flex items-center gap-2 text-warning">
            <Zap size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Step 1: When Trigger Event Occurs</h4>
          </div>
          <Select
            value={trigger.type}
            onChange={(e) => setTrigger({ ...trigger, type: e.target.value, config: {} })}
            options={[
              { value: 'new_conversation', label: 'New Conversation Created' },
              { value: 'new_message', label: 'New Inbound Customer Message' },
              { value: 'ai_classification', label: 'AI Classifies Topic / Intent' },
              { value: 'keyword', label: 'Specific Keyword Detected' },
              { value: 'business_hours', label: 'Business Working Hours Check' },
              { value: 'customer_tag_added', label: 'Customer Tag Assigned' },
            ]}
          />
          {trigger.type === 'keyword' && (
            <Input
              label="Keyword to Match"
              value={trigger.config?.keyword || ''}
              onChange={(e) => setTrigger({ ...trigger, config: { ...trigger.config, keyword: e.target.value } })}
              placeholder="e.g., refund, cancel, discount"
            />
          )}
        </div>

        {/* 2. CONDITIONS SECTION */}
        <div className="p-5 rounded-xl bg-info/5 border border-info/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-info">
              <Sliders size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Step 2: Filter by Conditions (Optional)</h4>
            </div>
            <Button variant="outline" size="xs" onClick={addCondition} icon={<Plus size={12} />}>
              Add Rule
            </Button>
          </div>

          {conditions.length === 0 ? (
            <p className="text-xs text-text-tertiary italic">
              No filters set. All triggered conversations will proceed to execute actions unconditionally.
            </p>
          ) : (
            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-lg bg-surface border border-border">
                  <Select
                    className="flex-1"
                    value={cond.type}
                    onChange={(e) => {
                      const updated = [...conditions]
                      updated[idx].type = e.target.value
                      setConditions(updated)
                    }}
                    options={[
                      { value: 'conversation_priority', label: 'Conversation Priority' },
                      { value: 'conversation_status', label: 'Conversation Status' },
                      { value: 'customer_tag', label: 'Customer Tag' },
                    ]}
                  />
                  <Select
                    className="w-32"
                    value={cond.operator}
                    onChange={(e) => {
                      const updated = [...conditions]
                      updated[idx].operator = e.target.value
                      setConditions(updated)
                    }}
                    options={[
                      { value: 'equals', label: 'Equals' },
                      { value: 'not_equals', label: 'Does Not Equal' },
                      { value: 'contains', label: 'Contains' },
                    ]}
                  />
                  <Input
                    className="flex-1"
                    value={cond.config?.value || ''}
                    onChange={(e) => {
                      const updated = [...conditions]
                      updated[idx].config = { ...updated[idx].config, value: e.target.value }
                      setConditions(updated)
                    }}
                    placeholder="Match value..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}
                    className="text-text-tertiary hover:text-error"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. ACTIONS SECTION */}
        <div className="p-5 rounded-xl bg-brand/5 border border-brand/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <GitFork size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Step 3: Execute Actions</h4>
            </div>
            <Button variant="outline" size="xs" onClick={addAction} icon={<Plus size={12} />}>
              Add Action
            </Button>
          </div>

          <div className="space-y-3">
            {actions.map((act, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Action #{idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                    className="text-text-tertiary hover:text-error"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={act.type}
                    onChange={(e) => {
                      const updated = [...actions]
                      updated[idx].type = e.target.value
                      setActions(updated)
                    }}
                    options={[
                      { value: 'send_message', label: 'Send Automated Message' },
                      { value: 'add_tag', label: 'Add Contact Tag' },
                      { value: 'assign_agent', label: 'Assign to Agent' },
                      { value: 'set_priority', label: 'Set Priority Level' },
                      { value: 'close_conversation', label: 'Mark as Resolved' },
                    ]}
                  />
                  <Input
                    type="number"
                    value={act.delay || 0}
                    onChange={(e) => {
                      const updated = [...actions]
                      updated[idx].delay = parseInt(e.target.value) || 0
                      setActions(updated)
                    }}
                    placeholder="Delay in minutes (0 for immediate)"
                  />
                </div>

                {act.type === 'send_message' && (
                  <Textarea
                    value={act.config?.message || ''}
                    onChange={(e) => {
                      const updated = [...actions]
                      updated[idx].config = { ...updated[idx].config, message: e.target.value }
                      setActions(updated)
                    }}
                    placeholder="Enter automated reply content..."
                    rows={2}
                  />
                )}

                {act.type === 'add_tag' && (
                  <Input
                    value={act.config?.tag || ''}
                    onChange={(e) => {
                      const updated = [...actions]
                      updated[idx].config = { ...updated[idx].config, tag: e.target.value }
                      setActions(updated)
                    }}
                    placeholder="Tag name (e.g. VIP, Inactive, Wholesale)..."
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}