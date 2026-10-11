'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bot, Check, ChevronLeft, ChevronRight, LoaderCircle, Search, Store, X } from 'lucide-react'
import ChannelIcon from '../ui/ChannelIcon'
import Select from '../ui/Select'
import { useLang } from '../../lib/LangContext'
import { translations } from '../../lib/i18n'
import { getCommunicationChannels, isCommunicationChannel } from './botWizardUtils'
import { getBusinessHeaders } from '../../lib/businessContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
type Step = 1 | 2 | 3
type Assignment = { file_id: number; channel_id: number | null }
type KnowledgeFile = { id: number; filename: string; file_type?: string | null; chunks_count?: number | null }
type BotWizardRecord = {
  id?: number
  name?: string
  status?: string
  ai_provider?: string | null
  ai_model?: string | null
  ai_instructions?: string | null
  reply_style?: string | null
  ai_confidence_threshold?: number | null
  escalation_config?: { keywords?: string[]; intents?: string[] } | null
  ecommerce_connections?: Array<{ id: number; pivot?: { is_default?: boolean } }>
  ecommerce_channel_id?: number | null
  channels?: Array<{ id: number; type?: string; pivot?: { is_primary?: boolean; ecommerce_connection_id?: number | null } }>
  knowledgeAssignments?: Array<{ business_knowledge_file_id?: number; channel_id?: number | null }>
}
type ChannelRecord = {
  id: number
  type: string
  page_id?: string
  page_name?: string
  status?: string
  bots?: Array<{ id: number; name?: string; status?: string; pivot?: { is_primary?: boolean } }>
}
type ChannelCardProps = {
  channel: ChannelRecord
  selected: boolean
  primary: boolean
  routeId: number | null
  stores: ChannelRecord[]
  enabledStoreIds: number[]
  botDefaultId: number | null
  otherBotCount: number
  copy: Pick<WizardCopy, 'sharedWith' | 'primary' | 'storeRoute' | 'automatic' | 'useBotDefault' | 'effectiveStore' | 'unresolved' | 'invalidRoute'>
  onToggle: (id: number) => void
  onTogglePrimary: (id: number) => void
  onRouteChange: (id: number, storeId: number | null) => void
}

function getToken(): string {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

function getStoreLabel(store: ChannelRecord): string {
  return `${store.type.toUpperCase()} — ${store.page_name || store.page_id || `Store #${store.id}`}`
}

type WizardCopy = typeof translations.ar.botWizard

const ChannelCard = memo(function ChannelCard({
  channel, selected, primary, routeId, stores, enabledStoreIds, botDefaultId,
  otherBotCount, copy, onToggle, onTogglePrimary, onRouteChange,
}: ChannelCardProps) {
  const communicationChannel = isCommunicationChannel(channel)
  const channelStore = stores.find((store) => store.id === routeId && enabledStoreIds.includes(store.id))
  const defaultStore = stores.find((store) => store.id === botDefaultId && enabledStoreIds.includes(store.id))
  const singleStore = !defaultStore && enabledStoreIds.length === 1
    ? stores.find((store) => store.id === enabledStoreIds[0])
    : undefined
  const effectiveStore = channelStore || defaultStore || singleStore
  const invalidRoute = routeId !== null && !channelStore

  return (
    <article className={`rounded-2xl border p-4 transition-colors ${selected ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}>
      <div className="flex items-start gap-3">
        <ChannelIcon type={channel.type as Parameters<typeof ChannelIcon>[0]['type']} size={24} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-text-primary">{channel.page_name || channel.page_id || `Account #${channel.id}`}</h3>
              <p className="mt-1 truncate text-xs text-text-muted">{channel.type} · {channel.page_id || channel.id}</p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-text-secondary">
              <span className="sr-only">{channel.page_name || channel.type}</span>
              <input type="checkbox" checked={selected} onChange={() => onToggle(channel.id)} className="size-4 accent-[var(--accent)]" />
            </label>
          </div>
          {selected && (
            <div className="mt-4 space-y-3 border-t border-border/70 pt-3">
              {communicationChannel && otherBotCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-muted">{copy.sharedWith.replace('{count}', String(otherBotCount))}</p>
                  <button type="button" onClick={() => onTogglePrimary(channel.id)} aria-pressed={primary}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${primary ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated'}`}>
                    {primary ? <><Check size={13} className="me-1 inline" />{copy.primary}</> : copy.primary}
                  </button>
                </div>
              )}
              {communicationChannel && <div>
                <label htmlFor={`channel-store-${channel.id}`} className="mb-1.5 block text-xs font-medium text-text-secondary">{copy.storeRoute}</label>
                <select id={`channel-store-${channel.id}`} value={routeId ?? ''}
                  onChange={(event) => onRouteChange(channel.id, event.target.value ? Number(event.target.value) : null)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                  <option value="">{enabledStoreIds.length === 1 ? copy.automatic : copy.useBotDefault}</option>
                  {invalidRoute && <option value={String(routeId)} disabled>{copy.invalidRoute}</option>}
                  {stores.filter((store) => enabledStoreIds.includes(store.id)).map((store) => <option key={store.id} value={store.id}>{getStoreLabel(store)}</option>)}
                </select>
                <p role={invalidRoute ? 'alert' : undefined} className={`mt-2 text-xs ${invalidRoute ? 'text-error' : 'text-text-muted'}`}>
                  {invalidRoute ? copy.invalidRoute : effectiveStore ? `${copy.effectiveStore} ${getStoreLabel(effectiveStore)}` : copy.unresolved}
                </p>
              </div>}
            </div>
          )}
        </div>
      </div>
    </article>
  )
})

export interface BotWizardModalProps {
  bot?: BotWizardRecord | null
  onClose: () => void
  onSaved: () => void
}

export default function BotWizardModal({ bot, onClose, onSaved }: BotWizardModalProps) {
  const { isRTL, t } = useLang()
  const copy = t.botWizard
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingKnowledge, setLoadingKnowledge] = useState(false)
  const [channels, setChannels] = useState<ChannelRecord[]>([])
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([])
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false)
  const [channelCommerceDefaults, setChannelCommerceDefaults] = useState<Record<number, number | null>>({})
  const [knowledgeQuery, setKnowledgeQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(false)
  const [staleStoreAssignment, setStaleStoreAssignment] = useState(false)
  const [name, setName] = useState(bot?.name || '')
  const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>(bot?.status === 'inactive' || bot?.status === 'draft' ? bot.status : 'active')
  const [aiProvider, setAiProvider] = useState(bot?.ai_provider || '')
  const [aiModel, setAiModel] = useState(bot?.ai_model || '')
  const [businessAiProvider, setBusinessAiProvider] = useState<string | null>(null)
  const [businessAiModel, setBusinessAiModel] = useState<string | null>(null)
  const [aiInstructions, setAiInstructions] = useState(bot?.ai_instructions || '')
  const [instructionsRevision, setInstructionsRevision] = useState(0)
  const [replyStyle, setReplyStyle] = useState(bot?.reply_style || 'Friendly & Professional')
  const [templateUndo, setTemplateUndo] = useState<{ instructions: string; replyStyle: string } | null>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(bot?.ai_confidence_threshold ?? 0.8)
  const [escalationKeywords, setEscalationKeywords] = useState<string[]>(bot?.escalation_config?.keywords || [])
  const [escalationIntents, setEscalationIntents] = useState<string[]>(bot?.escalation_config?.intents || [])
  const [keywordDraft, setKeywordDraft] = useState('')
  const [intentDraft, setIntentDraft] = useState('')
  const [ecommerceConnectionIds, setEcommerceConnectionIds] = useState<number[]>(
    bot?.ecommerce_connections?.map((connection) => connection.id) || (bot?.ecommerce_channel_id ? [bot.ecommerce_channel_id] : []),
  )
  const [defaultEcommerceConnectionId, setDefaultEcommerceConnectionId] = useState<number | null>(
    bot?.ecommerce_connections?.find((connection) => connection.pivot?.is_default)?.id || bot?.ecommerce_channel_id || null,
  )
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>(bot?.channels?.map((channel) => channel.id) || [])
  const [primaryChannelIds, setPrimaryChannelIds] = useState<number[]>(bot?.channels?.filter((channel) => channel.pivot?.is_primary).map((channel) => channel.id) || [])
  const [assignments, setAssignments] = useState<Assignment[]>(bot?.knowledgeAssignments?.flatMap((assignment) => (
    assignment.business_knowledge_file_id == null
      ? []
      : [{ file_id: assignment.business_knowledge_file_id, channel_id: assignment.channel_id ?? null }]
  )) || [])
  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const communicationChannels = useMemo(() => getCommunicationChannels(channels), [channels])
  const connectedCommerceStores = useMemo(() => channels.filter((channel) =>
    !isCommunicationChannel(channel) && channel.status === 'connected',
  ), [channels])
  const filteredKnowledgeFiles = useMemo(() => {
    const normalized = knowledgeQuery.trim().toLocaleLowerCase()
    if (!normalized) return knowledgeFiles
    return knowledgeFiles.filter((file) => String(file.filename || '').toLocaleLowerCase().includes(normalized))
  }, [knowledgeFiles, knowledgeQuery])
  const activeKnowledgeCount = new Set(assignments.map((assignment) => assignment.file_id)).size

  const markDirty = useCallback(() => {
    setDirty(true)
    setFeedback(null)
  }, [])

  const updateInstructions = useCallback((value: string) => {
    setAiInstructions(value)
    markDirty()
    setFieldErrors((current) => ({ ...current, instructions: '' }))
  }, [markDirty])
  const touchInstructions = useCallback(() => setTouched((current) => ({ ...current, instructions: true })), [])

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm(copy.confirmClose)) return
    onClose()
  }, [copy.confirmClose, dirty, onClose])

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      returnFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [requestClose])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    let cancelled = false
    const fetchChannels = async () => {
      const token = getToken()
      if (!token) {
        setLoadingChannels(false)
        return
      }
      try {
        const response = await fetch(`${API}/api/channels`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } })
        if (!response.ok) throw new Error(copy.loadError)
        const data = await response.json()
        const loaded: ChannelRecord[] = Array.isArray(data) ? data : data.data || []
        if (cancelled) return
        setChannels(loaded)
        const communicationIds = new Set(getCommunicationChannels(loaded).map((channel) => channel.id))
        const savedRoutes = new Map<number, number>(
          (bot?.channels || []).filter((channel) => channel.pivot?.ecommerce_connection_id != null)
            .map((channel) => [Number(channel.id), Number(channel.pivot!.ecommerce_connection_id)]),
        )
        setChannelCommerceDefaults(Object.fromEntries(
          getCommunicationChannels(loaded).map((channel) => [channel.id, savedRoutes.get(Number(channel.id)) ?? null]),
        ))
        const savedChannelIds = (bot?.channels || []).map((channel) => Number(channel.id))
        const savedPrimaryIds = (bot?.channels || []).filter((channel) => channel.pivot?.is_primary).map((channel) => Number(channel.id))
        const stale = savedChannelIds.some((id: number) => !communicationIds.has(id)) || savedPrimaryIds.some((id: number) => !communicationIds.has(id))
        setStaleStoreAssignment(stale)
        if (stale) {
          setSelectedChannelIds(savedChannelIds.filter((id: number) => communicationIds.has(id)))
          setPrimaryChannelIds(savedPrimaryIds.filter((id: number) => communicationIds.has(id)))
        }

      } catch {
        if (!cancelled) setFeedback({ type: 'error', text: copy.loadError })
      } finally {
        if (!cancelled) setLoadingChannels(false)
      }
    }
    void fetchChannels()
    return () => { cancelled = true }
  }, [bot, copy.loadError])

  useEffect(() => {
    if (step !== 3 || knowledgeLoaded || loadingKnowledge) return
    let cancelled = false
    const fetchKnowledge = async () => {
      const token = getToken()
      setLoadingKnowledge(true)
      try {
        if (!token) throw new Error(copy.loadError)
        const response = await fetch(`${API}/api/knowledge`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } })
        if (!response.ok) throw new Error(copy.loadError)
        const data = await response.json()
        if (!cancelled) {
          setKnowledgeFiles(data.files || [])
          setBusinessAiProvider((value) => value || data.profile?.ai_provider || null)
          setBusinessAiModel((value) => value || data.profile?.ai_model || null)
          setKnowledgeLoaded(true)
        }
      } catch {
        if (!cancelled) setFeedback({ type: 'error', text: copy.loadError })
      } finally {
        if (!cancelled) setLoadingKnowledge(false)
      }
    }
    void fetchKnowledge()
    return () => { cancelled = true }
  }, [step, knowledgeLoaded, loadingKnowledge, copy.loadError])

  const getStepErrors = useCallback((targetStep: Step) => {
    if (targetStep !== 1) return {}
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = copy.nameRequired
    if (aiInstructions.trim().length < 10) errors.instructions = copy.instructionsRequired
    if (confidenceThreshold < 0.5 || confidenceThreshold > 1) errors.threshold = copy.thresholdInvalid
    return errors
  }, [name, aiInstructions, confidenceThreshold, copy])

  const validateCurrentStep = useCallback(() => {
    const errors = getStepErrors(step)
    setFieldErrors(errors)
    setTouched({ name: true, instructions: true, threshold: true })
    if (Object.keys(errors).length) {
      setFeedback({ type: 'error', text: copy.stepError })
      return false
    }
    setFeedback(null)
    return true
  }, [copy.stepError, getStepErrors, step])

  const changeStep = (nextStep: Step) => {
    if (nextStep > step && !validateCurrentStep()) return
    setStep(nextStep)
    setFeedback(null)
  }

  const toggleChannel = useCallback((id: number) => {
    const channel = channels.find((item) => item.id === id)
    if (!channel || !isCommunicationChannel(channel)) return
    markDirty()
    setSelectedChannelIds((current) => current.includes(id) ? current.filter((channelId) => channelId !== id) : [...current, id])
    setPrimaryChannelIds((current) => current.filter((channelId) => channelId !== id))
  }, [channels, markDirty])

  const togglePrimary = useCallback((id: number) => {
    const channel = channels.find((item) => item.id === id)
    if (!channel || !isCommunicationChannel(channel)) return
    markDirty()
    setPrimaryChannelIds((current) => current.includes(id) ? current.filter((channelId) => channelId !== id) : [...current, id])
  }, [channels, markDirty])

  const changeRoute = useCallback((id: number, storeId: number | null) => {
    markDirty()
    setChannelCommerceDefaults((current) => ({ ...current, [id]: storeId }))
  }, [markDirty])

  const addChip = (value: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>, clearDraft: () => void) => {
    const normalized = value.trim().replace(/,+$/, '')
    if (normalized && !values.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      markDirty()
      setValues((current) => [...current, normalized])
    }
    clearDraft()
  }

  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!panelRef.current?.contains(document.activeElement)) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleSave = async () => {
    const errors = getStepErrors(1)
    setFieldErrors(errors)
    setTouched({ name: true, instructions: true, threshold: true })
    if (Object.keys(errors).length) {
      setStep(1)
      setFeedback({ type: 'error', text: copy.stepError })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const token = getToken()
      if (!token) throw new Error(copy.saveError)
      const validIds = new Set(channels.filter((channel) => isCommunicationChannel(channel)).map((channel) => channel.id))
      const chosenChannelIds = selectedChannelIds.filter((id) => validIds.has(id))
      const chosenPrimaryIds = primaryChannelIds.filter((id) => chosenChannelIds.includes(id) && isCommunicationChannel(channels.find((channel) => channel.id === id) || { id, type: 'salla' }))
      const enabledStoreIds = ecommerceConnectionIds.filter((id) => connectedCommerceStores.some((store) => store.id === id))
      const defaultId = defaultEcommerceConnectionId !== null && enabledStoreIds.includes(defaultEcommerceConnectionId)
        ? defaultEcommerceConnectionId
        : null
      const payload = {
        name: name.trim(), status, ai_provider: aiProvider || null, ai_model: aiModel || null,
        ai_instructions: aiInstructions.trim(), reply_style: replyStyle,
        ai_confidence_threshold: confidenceThreshold,
        escalation_config: escalationKeywords.length || escalationIntents.length
          ? { keywords: escalationKeywords, intents: escalationIntents }
          : null,
        ecommerce_connection_ids: enabledStoreIds,
        default_ecommerce_connection_id: defaultId,
        channel_ids: chosenChannelIds,
        primary_channel_ids: chosenPrimaryIds,
        channel_store_routing: Object.fromEntries(chosenChannelIds.map((channelId) => [
          channelId,
          channelCommerceDefaults[channelId] !== null && enabledStoreIds.includes(channelCommerceDefaults[channelId] as number)
            ? channelCommerceDefaults[channelId]
            : null,
        ])),
        knowledge_assignments: assignments,
      }
      const response = await fetch(bot ? `${API}/api/bots/${bot.id}` : `${API}/api/bots`, {
        method: bot ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const serverErrors = data.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat().join(' ')
          : data.message
        throw new Error(serverErrors || copy.saveError)
      }
      setDirty(false)
      setFeedback({ type: 'success', text: copy.saved })
      closeTimerRef.current = setTimeout(onSaved, 650)
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.saveError
      setFeedback({ type: 'error', text: message })
    } finally {
      setSaving(false)
    }
  }

  const onStepKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = Math.max(1, Math.min(3, step + direction)) as Step
    changeStep(next)
  }

  const steps = [copy.stepPersona, copy.stepChannels, copy.stepKnowledge]
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-5" onMouseDown={(event) => {
      if (event.target === event.currentTarget) requestClose()
    }}>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bot-wizard-title"
        tabIndex={-1}
        onKeyDown={handleModalKeyDown}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
        transition={{ duration: reduceMotion ? 0 : 0.15 }}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative flex h-dvh w-full max-w-[880px] flex-col overflow-hidden border border-border bg-surface-elevated text-start shadow-2xl outline-none md:h-auto md:max-h-[min(92dvh,900px)] md:rounded-2xl"
      >
        <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-surface-elevated px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{copy.brand}</p>
              <h2 id="bot-wizard-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-text-primary outline-none sm:text-xl">
                {bot?.id ? copy.editTitle : copy.createTitle}
              </h2>
              {bot?.id && <p className="mt-1 truncate text-sm text-text-muted">{bot.name}</p>}
            </div>
            <button type="button" onClick={requestClose} aria-label={copy.close} className="rounded-xl p-2 text-text-muted hover:bg-surface hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label={copy.stepNavLabel} className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {steps.map((title, index) => {
              const id = (index + 1) as Step
              const completed = step > id
              const errorOnStep = Object.keys(getStepErrors(id)).length > 0 && (touched.name || touched.instructions || touched.threshold)
              return (
                <button key={id} type="button" data-step={id} onClick={() => changeStep(id)} onKeyDown={onStepKeyDown}
                  aria-current={step === id ? 'step' : undefined}
                  className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-start transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 sm:px-3 ${step === id ? 'border-accent bg-accent/10 text-text-primary' : 'border-border bg-surface text-text-secondary hover:border-accent/40'}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${completed ? 'bg-success text-white' : step === id ? 'bg-accent text-white' : 'bg-surface-elevated text-text-muted'}`}>
                    {completed ? <Check size={13} /> : errorOnStep ? '!' : id}
                  </span>
                  <span className="truncate text-[11px] font-medium sm:text-xs">{title}</span>
                </button>
              )
            })}
          </nav>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6" aria-live="polite">
          {feedback && (
            <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`mb-5 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-error/30 bg-error/5 text-error' : 'border-success/30 bg-success/5 text-success'}`}>
              {feedback.text}
            </div>
          )}
          {staleStoreAssignment && <p role="status" className="mb-5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-secondary">{copy.stalePrimary}</p>}

          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.section key="persona" initial={reduceMotion ? false : { opacity: 0, x: isRTL ? -8 : 8 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: isRTL ? 8 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.15 }} className="space-y-6">
                <section aria-labelledby="identity-heading" className="space-y-4">
                  <h3 id="identity-heading" className="text-sm font-semibold text-text-primary">{copy.identity}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bot-name" className="mb-1.5 block text-sm font-medium text-text-secondary">{copy.name} <span aria-hidden="true">*</span></label>
                      <input id="bot-name" value={name} onChange={(event) => { setName(event.target.value); markDirty() }} onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                        aria-invalid={Boolean(touched.name && fieldErrors.name)} aria-describedby={touched.name && fieldErrors.name ? 'bot-name-error' : undefined}
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder={copy.namePlaceholder} />
                      {touched.name && fieldErrors.name && <p id="bot-name-error" className="mt-1 text-xs text-error">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="bot-status" className="mb-1.5 block text-sm font-medium text-text-secondary">{copy.status}</label>
                      <select id="bot-status" value={status} onChange={(event) => { setStatus(event.target.value as 'active' | 'inactive' | 'draft'); markDirty() }} className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-text-primary outline-none focus:border-accent">
                        <option value="active">{copy.active}</option><option value="inactive">{copy.inactive}</option><option value="draft">{copy.draft}</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section aria-labelledby="model-heading" className="space-y-4 border-t border-border pt-5">
                  <h3 id="model-heading" className="text-sm font-semibold text-text-primary">{copy.model}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select label={copy.provider} value={aiProvider} onChange={(event) => { setAiProvider(event.target.value); setAiModel(''); markDirty() }} options={[
                      { value: '', label: `${copy.businessDefault}${businessAiProvider ? ` (${businessAiProvider})` : ''}` },
                      { value: 'gemini', label: 'Google Gemini' }, { value: 'groq', label: 'Groq' },
                    ]} />
                    <Select label={copy.aiModel} value={aiModel} onChange={(event) => { setAiModel(event.target.value); markDirty() }} options={[
                      { value: '', label: `${copy.businessDefault}${businessAiModel ? ` (${businessAiModel})` : ''}` },
                      ...((aiProvider || businessAiProvider) === 'gemini'
                        ? [{ value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }, { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }, { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }, { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }]
                        : [{ value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' }, { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' }, { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }]),
                    ]} />
                  </div>
                </section>

                <section aria-labelledby="persona-heading" className="space-y-4 border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="persona-heading" className="text-sm font-semibold text-text-primary">{copy.persona}</h3>
                    <span className="text-xs text-text-muted">{replyStyle}</span>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-text-secondary">{copy.templates}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { title: copy.templateSupport, desc: copy.templateSupportDesc, reply: copy.templateSupportStyle, instructions: copy.templateSupportInstructions },
                        { title: copy.templateSales, desc: copy.templateSalesDesc, reply: copy.templateSalesStyle, instructions: copy.templateSalesInstructions },
                        { title: copy.templateTechnical, desc: copy.templateTechnicalDesc, reply: copy.templateTechnicalStyle, instructions: copy.templateTechnicalInstructions },
                        ].map((template) => (
                        <button key={template.title} type="button" onClick={() => { setTemplateUndo({ instructions: aiInstructions, replyStyle }); setAiInstructions(template.instructions); setInstructionsRevision((revision) => revision + 1); setReplyStyle(template.reply); setFieldErrors((current) => ({ ...current, instructions: '' })); markDirty() }} className="rounded-xl border border-border bg-surface p-3 text-start transition-colors hover:border-accent/50 hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent/40">
                          <span className="block text-sm font-semibold text-text-primary">{template.title}</span><span className="mt-1 block text-xs leading-5 text-text-muted">{template.desc}</span>
                        </button>
                      ))}
                    </div>
                    {templateUndo && <button type="button" onClick={() => { setAiInstructions(templateUndo.instructions); setInstructionsRevision((revision) => revision + 1); setReplyStyle(templateUndo.replyStyle); setTemplateUndo(null); markDirty() }} className="mt-2 text-xs font-semibold text-accent hover:underline">{copy.undo}</button>}
                  </div>
                  <InstructionsEditor key={instructionsRevision} value={aiInstructions} copy={copy} invalid={Boolean(touched.instructions && fieldErrors.instructions)} error={fieldErrors.instructions} onCommit={updateInstructions} onBlur={touchInstructions} />
                </section>

                <section aria-labelledby="handoff-heading" className="space-y-4 border-t border-border pt-5">
                  <h3 id="handoff-heading" className="text-sm font-semibold text-text-primary">{copy.handoff}</h3>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="confidence-range" className="text-sm font-medium text-text-secondary">{copy.threshold}</label><input aria-label={copy.threshold} type="number" min="50" max="100" step="5" value={Math.round(confidenceThreshold * 100)} onChange={(event) => { setConfidenceThreshold(Number(event.target.value) / 100); markDirty() }} className="w-20 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary" /></div>
                    <input id="confidence-range" type="range" min="50" max="100" step="5" value={Math.round(confidenceThreshold * 100)} onChange={(event) => { setConfidenceThreshold(Number(event.target.value) / 100); markDirty() }} className="w-full accent-[var(--accent)]" />
                    <p className="mt-1 text-xs text-text-muted">{copy.thresholdHint.replace('{value}', String(Math.round(confidenceThreshold * 100)))}</p>
                    {(touched.threshold && fieldErrors.threshold) && <p className="mt-1 text-xs text-error">{fieldErrors.threshold}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ChipInput label={copy.keywords} placeholder={copy.addChip} removeLabel={copy.removeChip} value={keywordDraft} values={escalationKeywords} onValueChange={setKeywordDraft} onAdd={() => addChip(keywordDraft, escalationKeywords, setEscalationKeywords, () => setKeywordDraft(''))} onRemove={(value) => { markDirty(); setEscalationKeywords((current) => current.filter((item) => item !== value)) }} onDirty={markDirty} />
                    <ChipInput label={copy.intents} placeholder={copy.addChip} removeLabel={copy.removeChip} value={intentDraft} values={escalationIntents} onValueChange={setIntentDraft} onAdd={() => addChip(intentDraft, escalationIntents, setEscalationIntents, () => setIntentDraft(''))} onRemove={(value) => { markDirty(); setEscalationIntents((current) => current.filter((item) => item !== value)) }} onDirty={markDirty} />
                  </div>
                </section>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="mapping" initial={reduceMotion ? false : { opacity: 0, x: isRTL ? -8 : 8 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: isRTL ? 8 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.15 }} className="space-y-8">
        <section aria-labelledby="stores-heading">
                  <div className="mb-3 flex items-center gap-2"><Store size={18} className="text-accent" /><h3 id="stores-heading" className="text-base font-semibold text-text-primary">{copy.stores}</h3></div>
                  {loadingChannels ? <LoadingState text={copy.loading} /> : connectedCommerceStores.length === 0 ? (
                    <EmptyLink href="/dashboard/channels" text={copy.noStores} action={copy.connectStore} />
                  ) : <div className="space-y-2">
                    {connectedCommerceStores.map((store) => {
                      const selected = ecommerceConnectionIds.includes(store.id)
                      return <div key={store.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
                        <label className="flex min-w-0 flex-1 items-center gap-3 text-sm text-text-primary">
                          <input type="checkbox" checked={selected} onChange={() => {
                            markDirty()
                            const next = selected ? ecommerceConnectionIds.filter((id) => id !== store.id) : [...ecommerceConnectionIds, store.id]
                            setEcommerceConnectionIds(next)
                            if (selected && defaultEcommerceConnectionId === store.id) setDefaultEcommerceConnectionId(next[0] ?? null)
                            else if (!selected && defaultEcommerceConnectionId === null) setDefaultEcommerceConnectionId(store.id)
                          }} className="size-4 accent-[var(--accent)]" />
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-elevated text-[10px] font-bold uppercase text-text-secondary">{store.type.slice(0, 2)}</span>
                          <span className="min-w-0"><span className="block truncate font-medium">{store.page_name || store.page_id || `Store #${store.id}`}</span><span className="mt-0.5 block truncate text-xs text-text-muted">{store.page_id || store.type}</span></span>
                        </label>
                        <label className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${selected && defaultEcommerceConnectionId === store.id ? 'bg-accent/10 font-semibold text-accent' : 'text-text-muted'}`}>
                          <input type="radio" name="default-commerce-connection" aria-label={`${copy.default}: ${store.page_name || store.type}`} checked={selected && defaultEcommerceConnectionId === store.id} disabled={!selected} onChange={() => { setDefaultEcommerceConnectionId(store.id); markDirty() }} className="accent-[var(--accent)]" />
                          {selected && defaultEcommerceConnectionId === store.id ? copy.default : copy.setDefault}
                        </label>
                      </div>
                    })}
                  </div>}
                  {defaultEcommerceConnectionId !== null && !connectedCommerceStores.some((store) => store.id === defaultEcommerceConnectionId && ecommerceConnectionIds.includes(store.id)) && <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-xs text-error"><span>{copy.invalidRoute}</span><button type="button" onClick={() => { setDefaultEcommerceConnectionId(null); markDirty() }} className="font-semibold underline">{copy.clearDefault}</button></div>}
                </section>

                <section aria-labelledby="channels-heading">
                  <div className="mb-1 flex items-center gap-2"><Bot size={18} className="text-accent" /><h3 id="channels-heading" className="text-base font-semibold text-text-primary">{copy.channels}</h3></div>
                  <p className="mb-4 text-sm text-text-muted">{copy.channelsHint}</p>
                  {loadingChannels ? <LoadingState text={copy.loading} /> : communicationChannels.length === 0 ? (
                    <EmptyLink href="/dashboard/channels" text={copy.noChannels} action={copy.connectChannel} />
                  ) : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {communicationChannels.map((channel) => {
                      const otherBots = (channel.bots || []).filter((candidate) => candidate.id !== bot?.id && candidate.status === 'active')
                      return <ChannelCard key={channel.id} channel={channel} selected={selectedChannelIds.includes(channel.id)} primary={primaryChannelIds.includes(channel.id)} routeId={channelCommerceDefaults[channel.id] ?? null} stores={connectedCommerceStores} enabledStoreIds={ecommerceConnectionIds} botDefaultId={defaultEcommerceConnectionId} otherBotCount={otherBots.length} copy={copy} onToggle={toggleChannel} onTogglePrimary={togglePrimary} onRouteChange={changeRoute} />
                    })}
                  </div>}
                </section>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section key="knowledge" initial={reduceMotion ? false : { opacity: 0, x: isRTL ? -8 : 8 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: isRTL ? 8 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.15 }} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-base font-semibold text-text-primary">{copy.stepKnowledge}</h3><p className="mt-1 text-sm text-text-muted">{copy.knowledgeHint}</p></div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{copy.fileCount.replace('{count}', String(activeKnowledgeCount))}</span>
                </div>
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <span className="sr-only">{copy.searchFiles}</span>
                  <input value={knowledgeQuery} onChange={(event) => setKnowledgeQuery(event.target.value)} placeholder={copy.searchFiles} className="w-full rounded-xl border border-border bg-surface py-3 pe-3 ps-10 text-sm text-text-primary outline-none focus:border-accent" />
                </label>
                {loadingKnowledge ? <LoadingState text={copy.loading} /> : filteredKnowledgeFiles.length === 0 ? (
                  <EmptyLink href="/dashboard/ai-knowledge" text={copy.noFiles} action={copy.addKnowledge} />
                ) : <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {filteredKnowledgeFiles.map((file) => {
                    const existing = assignments.filter((assignment) => assignment.file_id === file.id)
                    const isAssigned = existing.length > 0
                    const sharedAssigned = existing.some((assignment) => assignment.channel_id === null)
                    const assignedChannelIds = existing.map((assignment) => assignment.channel_id).filter((channelId): channelId is number => channelId !== null)
                    return <article key={file.id} className="bg-surface p-4">
                      <div className="flex items-start gap-3">
                        <input aria-label={`${copy.enableFile} ${file.filename}`} type="checkbox" checked={isAssigned} onChange={() => {
                          markDirty()
                          setAssignments((current) => isAssigned ? current.filter((assignment) => assignment.file_id !== file.id) : [...current, { file_id: file.id, channel_id: null }])
                        }} className="mt-1 size-4 accent-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-medium text-text-primary">{file.filename}</h4><span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] uppercase text-text-muted">{file.file_type || copy.fileType}</span></div>
                          <p className="mt-1 text-xs text-text-muted">{copy.chunks} {file.chunks_count || 0}</p>
                          {isAssigned && <div className="mt-3 space-y-3">
                            <label className="flex items-center gap-2 text-xs text-text-secondary">
                              <input type="checkbox" checked={sharedAssigned} onChange={() => {
                                markDirty()
                                setAssignments((current) => sharedAssigned
                                  ? current.filter((assignment) => !(assignment.file_id === file.id && assignment.channel_id === null))
                                  : [...current, { file_id: file.id, channel_id: null }])
                              }} className="size-4 accent-[var(--accent)]" />
                              {copy.shared}
                            </label>
                            {assignedChannelIds.length > 0 && <div className="max-w-sm">
                              <label htmlFor={`knowledge-scope-${file.id}`} className="mb-1.5 block text-xs font-medium text-text-secondary">{copy.channelScope}</label>
                              <select id={`knowledge-scope-${file.id}`} multiple size={Math.min(4, Math.max(2, communicationChannels.filter((channel) => selectedChannelIds.includes(channel.id)).length))} value={assignedChannelIds.map(String)} onChange={(event) => {
                                const channelIds = Array.from(event.target.selectedOptions).map((option) => Number(option.value))
                                markDirty()
                                setAssignments((current) => [
                                  ...current.filter((assignment) => assignment.file_id !== file.id || assignment.channel_id === null),
                                  ...channelIds.map((channelId) => ({ file_id: file.id, channel_id: channelId })),
                                ])
                              }} className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary">
                                {communicationChannels.filter((channel) => selectedChannelIds.includes(channel.id)).map((channel) => <option key={channel.id} value={channel.id}>{channel.page_name || channel.type}</option>)}
                              </select>
                              <p className="mt-1 text-[11px] text-text-muted">{copy.selectChannels}</p>
                            </div>}
                            {assignedChannelIds.length === 0 && communicationChannels.some((channel) => selectedChannelIds.includes(channel.id)) && <button type="button" onClick={() => {
                              const channelId = communicationChannels.find((channel) => selectedChannelIds.includes(channel.id))?.id
                              if (channelId == null) return
                              markDirty()
                              setAssignments((current) => [...current, { file_id: file.id, channel_id: channelId }])
                            }} className="text-xs font-semibold text-accent hover:underline">{copy.scopeToChannel}</button>}
                          </div>}
                        </div>
                      </div>
                    </article>
                  })}
                </div>}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-surface-elevated px-5 py-4 sm:px-6">
          <div className="mb-3 flex min-h-5 items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs text-text-muted">{dirty ? copy.unsaved : ' '}</p>
            {feedback?.type === 'error' && <p className="max-w-[65%] truncate text-xs text-error">{feedback.text}</p>}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={requestClose} className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent/40">{copy.cancel}</button>
            <div className="flex items-center gap-2">
              {step > 1 && <button type="button" onClick={() => changeStep((step - 1) as Step)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40"><ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} />{copy.back}</button>}
              {step < 3 ? <button type="button" onClick={() => changeStep((step + 1) as Step)} className="inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent/50">{copy.next}<ChevronRight size={16} className={isRTL ? 'rotate-180' : ''} /></button>
                : <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-wait disabled:opacity-60">{saving && <LoaderCircle size={15} className="animate-spin" />}{saving ? copy.saving : copy.save}</button>}
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}

function ChipInput({ label, placeholder, removeLabel, value, values, onValueChange, onAdd, onRemove, onDirty }: {
  label: string
  placeholder: string
  removeLabel: string
  value: string
  values: string[]
  onValueChange: (value: string) => void
  onAdd: () => void
  onRemove: (value: string) => void
  onDirty: () => void
}) {
  return <div>
    <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>
    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-2 focus-within:border-accent">
      {values.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-text-primary">{item}<button type="button" aria-label={removeLabel.replace('{value}', item)} onClick={() => onRemove(item)} className="rounded-full text-text-muted hover:text-error">×</button></span>)}
      <input value={value} onChange={(event) => { onValueChange(event.target.value); onDirty() }} onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); onAdd() }
        if (event.key === 'Backspace' && !value && values.length) onRemove(values[values.length - 1])
      }} onBlur={() => { if (value.trim()) onAdd() }} placeholder={placeholder} className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted" />
    </div>
  </div>
}

const InstructionsEditor = memo(function InstructionsEditor({ value, copy, invalid, error, onCommit, onBlur }: {
  value: string
  copy: Pick<WizardCopy, 'instructions' | 'instructionCount' | 'instructionsHint' | 'minInstructions' | 'instructionsPlaceholder'>
  invalid: boolean
  error?: string
  onCommit: (value: string) => void
  onBlur: () => void
}) {
  const [draft, setDraft] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (draft === value) return
    timerRef.current = setTimeout(() => onCommit(draft), 250)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [draft, value, onCommit])

  return <div>
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor="bot-instructions" className="text-sm font-medium text-text-secondary">{copy.instructions} <span aria-hidden="true">*</span></label>
      <span className="text-xs text-text-muted">{draft.length} {copy.instructionCount}</span>
    </div>
    <textarea id="bot-instructions" rows={6} value={draft} onChange={(event) => setDraft(event.target.value)}
      onBlur={() => { onCommit(draft); onBlur() }} aria-invalid={invalid}
      aria-describedby={['instructions-hint', 'instructions-count', invalid ? 'instructions-error' : null].filter(Boolean).join(' ')}
      placeholder={copy.instructionsPlaceholder} className="w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-6 text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
    <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
      <p id="instructions-hint" className="text-text-muted">{copy.instructionsHint} {copy.minInstructions}</p>
      {invalid && error && <p id="instructions-error" className="text-error">{error}</p>}
    </div>
    <span id="instructions-count" className="sr-only">{draft.length} {copy.instructionCount}</span>
  </div>
})

function LoadingState({ text }: { text: string }) {
  return <div role="status" className="flex items-center gap-2 py-8 text-sm text-text-muted"><LoaderCircle size={16} className="animate-spin" />{text}</div>
}

function EmptyLink({ href, text, action }: { href: string; text: string; action: string }) {
  return <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted">{text}</p><a href={href} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary hover:border-accent hover:text-accent">{action}</a></div>
}
