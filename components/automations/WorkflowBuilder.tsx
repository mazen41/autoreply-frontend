'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  Plus,
  Sliders,
  Tag,
  Trash2,
  UserCheck,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { getBusinessHeaders, getSelectedBusinessId } from '../../lib/businessContext'
import { useLang } from '../../lib/LangContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowLike {
  id: number
  name: string
  description: string | null
  trigger: { type: string; config?: any; conditions?: any }
  conditions: Array<{ type: string; config: any; operator?: string; comparison?: string }>
  actions: Array<any>
}

type TriggerType = 'first_contact' | 'message_received' | 'keyword' | 'business_hours' | 'tag_added'
type ActionType = 'send_message' | 'add_tag' | 'assign_agent'

interface WorkflowAgent {
  id: number
  name: string
}

interface Cond {
  id: string
  type: string
  comparison: string
  config: { value?: string }
}
interface Act {
  id: string
  type: ActionType
  config: Record<string, any>
  delay: number
}

const uid = () => Math.random().toString(36).slice(2, 9)

const TRIGGERS: { value: TriggerType; label: string; description: string; icon: string }[] = [
  { value: 'first_contact', label: 'First message from a customer', description: 'Runs once, when a new customer writes', icon: '👋' },
  { value: 'message_received', label: 'Any incoming message', description: 'Runs on every customer message', icon: '💬' },
  { value: 'keyword', label: 'Message contains a keyword', description: 'e.g. refund, price, cancel', icon: '🔎' },
  { value: 'business_hours', label: 'Message arrives outside business hours', description: 'Great for after-hours replies', icon: '🌙' },
  { value: 'tag_added', label: 'A tag is added to a customer', description: 'e.g. when someone becomes VIP', icon: '🏷️' },
]

const CONDITION_TYPES = [
  { value: 'conversation_status', label: 'Conversation status', placeholder: 'e.g. open' },
  { value: 'customer_tag', label: 'Customer tag', placeholder: 'e.g. VIP' },
  { value: 'message_contains', label: 'Message contains', placeholder: 'e.g. discount' },
]

const COMPARISONS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: "isn't" },
  { value: 'contains', label: 'contains' },
]

const ACTION_META: Record<ActionType, { label: string; hint: string; icon: React.ElementType }> = {
  send_message: { label: 'Send a message', hint: 'Reply automatically', icon: MessageSquare },
  add_tag: { label: 'Add a tag', hint: 'Label the customer', icon: Tag },
  assign_agent: { label: 'Assign to an agent', hint: 'Hand over to your team', icon: UserCheck },
}

interface Recipe {
  id: string
  emoji: string
  name: string
  description: string
  trigger: TriggerType
  keyword?: string
  actions: () => Act[]
}

const RECIPES: Recipe[] = [
  {
    id: 'welcome',
    emoji: '👋',
    name: 'Welcome first-time customers',
    description: 'Greet every new customer automatically.',
    trigger: 'first_contact',
    actions: () => [
      { id: uid(), type: 'send_message', delay: 0, config: { message: 'Hi! 👋 Thanks for reaching out. How can we help you today?' } },
    ],
  },
  {
    id: 'after_hours',
    emoji: '🌙',
    name: 'After-hours auto-reply',
    description: 'Let customers know when you will be back.',
    trigger: 'business_hours',
    actions: () => [
      { id: uid(), type: 'send_message', delay: 0, config: { message: "Thanks for your message! We're closed right now and will reply as soon as we're back." } },
    ],
  },
  {
    id: 'keyword_tag',
    emoji: '🏷️',
    name: 'Tag customers by keyword',
    description: 'Label conversations that mention certain words.',
    trigger: 'keyword',
    keyword: 'refund, return',
    actions: () => [{ id: uid(), type: 'add_tag', delay: 0, config: { tag: 'Refund request' } }],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function summarizeAction(a: Act): string {
  if (a.type === 'send_message') return a.config.message?.trim() ? a.config.message.trim().replace(/\s+/g, ' ') : 'Empty message — click to write it'
  if (a.type === 'add_tag') return a.config.tag?.trim() ? `Add tag "${a.config.tag.trim()}"` : 'Add a tag — click to name it'
  return 'Assign to an agent'
}

const getToken = () => decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')

function Block({ n, tone, title, children }: { n: number; tone: string; title: string; children: React.ReactNode }) {
  return (
  <section className="rounded-2xl border border-border bg-surface-elevated p-5">
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${tone}`}>{n}</span>
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
    </div>
    {children}
  </section>
  )
}

const Connector = () => <div className="mx-auto h-4 w-px bg-border" />

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowBuilder({
  workflow,
  onSave,
  onCancel,
}: {
  workflow: WorkflowLike | null
  onSave: () => void
  onCancel: () => void
}) {
  const { isRTL } = useLang()
  const isEditing = !!workflow
  const [stage, setStage] = useState<'pick' | 'edit'>(isEditing ? 'edit' : 'pick')

  const initial = useMemo(() => {
    const saved = workflow?.trigger
    const sc = saved?.conditions || {}
    let type = ((saved?.type as TriggerType) || (workflow ? 'message_received' : 'keyword')) as TriggerType
    // The API stores "outside business hours" as message_received + time_condition.
    if (type === 'message_received' && sc.time_condition === 'outside_hours') type = 'business_hours'
    return {
      type,
      keyword: Array.isArray(sc.keywords) ? sc.keywords.join(', ') : '',
      tag: Array.isArray(sc.tags) ? sc.tags[0] || '' : '',
      conditions: (workflow?.conditions || []).map((c) => ({
        id: uid(),
        type: c.type,
        comparison: c.comparison || (c as any).operator || 'equals',
        config: { value: c.config?.value || '' },
      })) as Cond[],
      actions: (workflow?.actions || []).map((a: any) => {
        const { type: aType, config, delay, ...rest } = a
        return { id: uid(), type: aType as ActionType, config: { ...rest, ...(config || {}) }, delay: delay || 0 }
      }) as Act[],
    }
  }, [workflow])

  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [showDescription, setShowDescription] = useState(!!workflow?.description)
  const [triggerType, setTriggerType] = useState<TriggerType>(initial.type)
  const [keyword, setKeyword] = useState<string>(initial.keyword)
  const [tag, setTag] = useState<string>(initial.tag)
  const [conditions, setConditions] = useState<Cond[]>(initial.conditions)
  const [actions, setActions] = useState<Act[]>(initial.actions)
  const [openAction, setOpenAction] = useState<string | null>(null)
  const [addMenu, setAddMenu] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [agents, setAgents] = useState<WorkflowAgent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [agentsError, setAgentsError] = useState<string | null>(null)
  const [agentsReload, setAgentsReload] = useState(0)
  const needsAgents = actions.some((action) => action.type === 'assign_agent')

  useEffect(() => {
    if (!needsAgents) return

    let cancelled = false
    const loadAgents = async () => {
      const businessId = getSelectedBusinessId()
      const token = getToken()
      if (!businessId || !token) {
        setAgentsError('Select a workspace and sign in before choosing an agent.')
        return
      }

      setAgentsLoading(true)
      setAgentsError(null)
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${api}/api/businesses/${businessId}/team`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        })
        if (!response.ok) throw new Error(`Could not load team members (HTTP ${response.status}).`)
        const data = await response.json()
        const members = Array.isArray(data) ? data : data.members || data.data || []
        if (!cancelled) {
          setAgents(members
            .filter((member: any) => member.is_active && member.user?.id)
            .map((member: any) => ({ id: Number(member.user.id), name: member.user.name || member.user.email || `Agent ${member.user.id}` })))
        }
      } catch (error) {
        if (!cancelled) setAgentsError(error instanceof Error ? error.message : 'Could not load team members.')
      } finally {
        if (!cancelled) setAgentsLoading(false)
      }
    }

    void loadAgents()
    return () => { cancelled = true }
  }, [needsAgents, agentsReload])

  // Dirty tracking
  const snapshot = useMemo(
    () => JSON.stringify({ name, description, triggerType, keyword, tag, conditions, actions }),
    [name, description, triggerType, keyword, tag, conditions, actions]
  )
  const baselineRef = useRef<string | null>(null)
  useEffect(() => {
    if (stage === 'edit' && baselineRef.current === null) baselineRef.current = snapshot
  }, [stage, snapshot])
  const dirty = stage === 'edit' && baselineRef.current !== null && baselineRef.current !== snapshot

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  // Validation
  const errors = useMemo(() => {
    const e: { name?: string; trigger?: string; actions?: string; cond: Record<string, string>; act: Record<string, string>; list: string[]; first?: string } = {
      cond: {}, act: {}, list: [],
    }
    if (!name.trim()) { e.name = 'Give your workflow a name'; e.list.push(e.name); e.first ||= 'wf-name' }
    if (triggerType === 'keyword' && !keyword.trim()) { e.trigger = 'Enter at least one keyword'; e.list.push(e.trigger); e.first ||= 'wf-trigger' }
    if (triggerType === 'tag_added' && !tag.trim()) { e.trigger = 'Enter the tag to watch for'; e.list.push(e.trigger); e.first ||= 'wf-trigger' }
    conditions.forEach((c, i) => {
      if (!c.config.value?.trim()) { e.cond[c.id] = 'Enter a value'; e.list.push(`Filter ${i + 1}: enter a value`); e.first ||= `wf-cond-${c.id}` }
    })
    if (actions.length === 0) { e.actions = 'Add at least one action'; e.list.push(e.actions); e.first ||= 'wf-actions' }
    actions.forEach((a, i) => {
      let msg = ''
      if (a.type === 'send_message' && !a.config.message?.trim()) msg = 'Write the message to send'
      if (a.type === 'add_tag' && !a.config.tag?.trim()) msg = 'Enter the tag name'
      if (a.type === 'assign_agent' && !agents.some((agent) => agent.id === Number(a.config.agent_id))) msg = 'Choose an active team agent'
      if (msg) { e.act[a.id] = msg; e.list.push(`Action ${i + 1}: ${msg}`); e.first ||= `wf-act-${a.id}` }
    })
    return e
  }, [name, triggerType, keyword, tag, conditions, actions, agents])
  const showErrors = attempted && errors.list.length > 0

  const applyRecipe = (r: Recipe | null) => {
    if (r) {
      const acts = r.actions()
      setName(r.name)
      setTriggerType(r.trigger)
      setKeyword(r.keyword || '')
      setActions(acts)
      setOpenAction(acts[0]?.id ?? null)
    } else {
      setActions([])
      setOpenAction(null)
    }
    setStage('edit')
  }

  const updateAction = (id: string, patch: Partial<Act>) => setActions((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  const updateActionConfig = (id: string, patch: Record<string, any>) =>
    setActions((p) => p.map((a) => (a.id === id ? { ...a, config: { ...a.config, ...patch } } : a)))
  const addAction = (type: ActionType) => {
    const a: Act = { id: uid(), type, delay: 0, config: type === 'send_message' ? { message: '' } : type === 'add_tag' ? { tag: '' } : {} }
    setActions((p) => [...p, a])
    setOpenAction(a.id)
    setAddMenu(false)
  }

  const handleSave = async () => {
    setAttempted(true)
    setApiError(null)
    if (errors.list.length > 0) {
      const firstAct = actions.find((a) => errors.act[a.id])
      if (firstAct) setOpenAction(firstAct.id)
      setTimeout(() => document.getElementById(errors.first || '')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const url = workflow ? `${api}/api/workflows/${workflow.id}` : `${api}/api/workflows`

      const keywords = keyword.split(',').map((k) => k.trim()).filter(Boolean)
      const normalizedTrigger =
        triggerType === 'keyword'
          ? { type: 'keyword', conditions: { keywords, match_type: 'any' } }
          : triggerType === 'business_hours'
            ? { type: 'message_received', conditions: { time_condition: 'outside_hours' } }
            : triggerType === 'tag_added'
              ? { type: 'tag_added', conditions: { tags: [tag.trim()] } }
              : { type: triggerType, conditions: {} }

      const response = await fetch(url, {
        method: workflow ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify({
          name: name.trim(),
          description,
          trigger: normalizedTrigger,
          conditions: conditions.map((c) => ({
            type: c.type,
            config: { value: c.config.value },
            operator: 'and',
            comparison: c.comparison || 'equals',
          })),
          actions: actions.map((a) => ({ type: a.type, config: a.config, delay: a.delay || 0 })),
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const validation = payload?.errors ? Object.values(payload.errors).flat().join(' ') : ''
        throw new Error(payload?.error || validation || payload?.message || `Workflow could not be saved (HTTP ${response.status}).`)
      }
      baselineRef.current = snapshot
      toast.success(workflow ? 'Workflow updated' : 'Workflow created')
      onSave()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to save workflow')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    onCancel()
  }

  // ─── Recipe picker ──────────────────────────────────────────────────────────
  if (stage === 'pick') {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <Button variant="outline" size="sm" onClick={onCancel} icon={<ChevronLeft className={isRTL ? 'rotate-180' : ''} size={14} />}>
          Workflows
        </Button>
        <div>
          <h2 className="text-xl font-bold text-text-primary">How do you want to start?</h2>
          <p className="mt-1 text-sm text-text-secondary">Pick a recipe and tweak the text — or build your own.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RECIPES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => applyRecipe(r)}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-start transition-colors hover:border-brand/50"
            >
              <span className="text-2xl">{r.emoji}</span>
              <div>
                <p className="text-sm font-bold text-text-primary">{r.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{r.description}</p>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyRecipe(null)}
            className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-4 text-start transition-colors hover:border-brand/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary">
              <Plus size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Start from scratch</p>
              <p className="mt-0.5 text-xs text-text-secondary">Choose your own trigger and actions.</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ─── Builder ────────────────────────────────────────────────────────────────

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-4 p-4 pb-16 md:p-6">
      <div className="sticky top-0 z-30 -mx-1 flex items-center justify-between gap-3 border-b border-border bg-[var(--background)]/90 px-1 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack} icon={<ChevronLeft className={isRTL ? 'rotate-180' : ''} size={14} />}>
            Workflows
          </Button>
          <h2 className="hidden truncate text-sm font-bold text-text-primary sm:block">
            {isEditing ? name || 'Edit workflow' : 'New workflow'}
          </h2>
          {dirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          {isEditing ? 'Save changes' : 'Publish workflow'}
        </Button>
      </div>

      {apiError && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {apiError}
        </div>
      )}
      {showErrors && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm">
          <p className="font-semibold text-error">
            Fix {errors.list.length} {errors.list.length === 1 ? 'issue' : 'issues'} to save
          </p>
          <ul className="mt-1 list-disc ps-5 text-xs text-text-secondary">
            {errors.list.slice(0, 5).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5">
        <Input
          id="wf-name"
          label="Workflow name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. VIP route to sales"
          error={attempted ? errors.name : undefined}
        />
        {showDescription ? (
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this workflow do?"
          />
        ) : (
          <button type="button" onClick={() => setShowDescription(true)} className="text-xs font-medium text-brand hover:underline">
            + Add description
          </button>
        )}
      </section>

      <Block n={1} tone="bg-warning/15 text-warning" title="When this happens">
        <div id="wf-trigger" className="space-y-3">
          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
            options={TRIGGERS.map((t) => ({ value: t.value, label: t.label, description: t.description, icon: <span>{t.icon}</span> }))}
          />
          {triggerType === 'keyword' && (
            <Input
              label="Keywords"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="refund, cancel, discount"
              helperText="Separate several keywords with commas — any of them will trigger this."
              error={attempted ? errors.trigger : undefined}
            />
          )}
          {triggerType === 'tag_added' && (
            <Input
              label="Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. VIP"
              error={attempted ? errors.trigger : undefined}
            />
          )}
        </div>
      </Block>

      <Connector />

      <Block n={2} tone="bg-info/15 text-info" title="Only if… (optional)">
        {conditions.length === 0 ? (
          <p className="mb-3 text-xs text-text-tertiary">No filters — runs every time the trigger happens.</p>
        ) : (
          <div className="mb-3 space-y-2">
            {conditions.map((c, idx) => {
              const meta = CONDITION_TYPES.find((t) => t.value === c.type)
              return (
                <div key={c.id} id={`wf-cond-${c.id}`} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2">
                    <span className="px-1 text-xs font-semibold text-text-tertiary">{idx === 0 ? 'If' : 'and'}</span>
                    <div className="w-44">
                      <Select
                        dir={isRTL ? 'rtl' : 'ltr'}
                        size="sm"
                        value={c.type}
                        onChange={(e) => setConditions((p) => p.map((x) => (x.id === c.id ? { ...x, type: e.target.value } : x)))}
                        options={CONDITION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                      />
                    </div>
                    <div className="w-28">
                      <Select
                        dir={isRTL ? 'rtl' : 'ltr'}
                        size="sm"
                        value={c.comparison}
                        onChange={(e) => setConditions((p) => p.map((x) => (x.id === c.id ? { ...x, comparison: e.target.value } : x)))}
                        options={COMPARISONS}
                      />
                    </div>
                    <Input
                      className="!h-8 min-w-[120px] flex-1"
                      value={c.config.value || ''}
                      onChange={(e) => setConditions((p) => p.map((x) => (x.id === c.id ? { ...x, config: { value: e.target.value } } : x)))}
                      placeholder={meta?.placeholder || 'Value…'}
                      error={attempted ? errors.cond[c.id] : undefined}
                    />
                    <button
                      type="button"
                      aria-label="Remove filter"
                      onClick={() => setConditions((p) => p.filter((x) => x.id !== c.id))}
                      className="rounded-md p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Button
          variant="outline"
          size="xs"
          icon={<Plus size={12} />}
          onClick={() => setConditions((p) => [...p, { id: uid(), type: 'customer_tag', comparison: 'equals', config: { value: '' } }])}
        >
          Add filter
        </Button>
      </Block>

      <Connector />

      <Block n={3} tone="bg-brand/15 text-brand" title="Then do this">
        <div id="wf-actions" className="space-y-2">
          {actions.map((a, idx) => {
            const meta = ACTION_META[a.type]
            const Icon = meta.icon
            const open = openAction === a.id
            const err = errors.act[a.id]
            return (
              <div
                key={a.id}
                id={`wf-act-${a.id}`}
                className={`rounded-xl border bg-surface ${attempted && err ? 'border-error/50' : open ? 'border-brand/40' : 'border-border'}`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => setOpenAction(open ? null : a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpenAction(open ? null : a.id)
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                      Action {idx + 1} · {meta.label}
                    </p>
                    <p className="truncate text-sm text-text-primary">{summarizeAction(a)}</p>
                  </div>
                  {attempted && err && !open && <AlertCircle size={15} className="shrink-0 text-error" />}
                  <button
                    type="button"
                    aria-label="Remove action"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActions((p) => p.filter((x) => x.id !== a.id))
                    }}
                    className="rounded-md p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronDown size={16} className={`shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>

                {open && (
                  <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
                    <Select
                      dir={isRTL ? 'rtl' : 'ltr'}
                      label="Action"
                      size="sm"
                      value={a.type}
                      onChange={(e) => {
                        const type = e.target.value as ActionType
                        updateAction(a.id, { type, config: type === 'send_message' ? { message: a.config.message || '' } : type === 'add_tag' ? { tag: a.config.tag || '' } : {} })
                      }}
                      options={(Object.keys(ACTION_META) as ActionType[]).map((t) => ({ value: t, label: ACTION_META[t].label }))}
                    />
                    {a.type === 'send_message' && (
                      <div>
                        <textarea
                          value={a.config.message || ''}
                          onChange={(e) => updateActionConfig(a.id, { message: e.target.value })}
                          rows={3}
                          placeholder="Write the reply your customer will receive…"
                          className={`w-full resize-y rounded-lg border bg-surface-elevated p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 ${
                            attempted && err ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-brand focus:ring-brand/30'
                          }`}
                        />
                        {attempted && err && <p className="mt-1 text-xs font-medium text-error">{err}</p>}
                      </div>
                    )}
                    {a.type === 'assign_agent' && (
                      <div className="space-y-2">
                        <Select
                          dir={isRTL ? 'rtl' : 'ltr'}
                          label="Assign to"
                          size="sm"
                          value={a.config.agent_id ? String(a.config.agent_id) : ''}
                          onValueChange={(value) => updateActionConfig(a.id, { agent_id: value ? Number(value) : null })}
                          disabled={agentsLoading || agents.length === 0}
                          loading={agentsLoading}
                          options={agents.map((agent) => ({ value: String(agent.id), label: agent.name }))}
                          placeholder={agentsLoading ? 'Loading agents…' : 'Choose an agent'}
                        />
                        {agentsError ? (
                          <div role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-error">
                            <span>{agentsError}</span>
                            <button type="button" onClick={() => setAgentsReload((value) => value + 1)} disabled={agentsLoading} className="font-semibold underline disabled:opacity-50">Try again</button>
                            <Link href="/dashboard/team" className="font-semibold underline">Open team</Link>
                          </div>
                        ) : agents.length === 0 && !agentsLoading ? (
                          <p className="text-xs text-text-tertiary">No active team agents are available. <Link href="/dashboard/team" className="font-semibold text-brand hover:underline">Manage team</Link></p>
                        ) : null}
                        {attempted && err && <p className="text-xs font-medium text-error">{err}</p>}
                      </div>
                    )}
                    {a.type === 'add_tag' && (
                      <Input
                        label="Tag name"
                        value={a.config.tag || ''}
                        onChange={(e) => updateActionConfig(a.id, { tag: e.target.value })}
                        placeholder="e.g. VIP, Wholesale"
                        error={attempted ? err : undefined}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {addMenu ? (
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-surface p-2 sm:grid-cols-3">
              {(Object.keys(ACTION_META) as ActionType[]).map((t) => {
                const m = ACTION_META[t]
                const Icon = m.icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addAction(t)}
                    className="flex items-center gap-2.5 rounded-lg p-2 text-start hover:bg-surface-elevated"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
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
          ) : (
            <button
              type="button"
              onClick={() => setAddMenu(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Plus size={14} /> Add action
            </button>
          )}
          {attempted && errors.actions && <p className="text-xs font-medium text-error">{errors.actions}</p>}
        </div>
      </Block>
    </div>
  )
}
