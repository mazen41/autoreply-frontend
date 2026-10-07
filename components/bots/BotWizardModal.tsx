'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChannelIcon from '../ui/ChannelIcon'
import { XIcon, LightningIcon, PlusIcon, CheckIcon } from '../ui/DashboardIcons'
import Select from '../ui/Select'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const AI_PROVIDERS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ],
  },
  openai: {
    label: 'OpenAI (GPT)',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'o3-mini', label: 'o3-mini (Reasoning)' },
    ],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    ],
  },
  groq: {
    label: 'Groq (Ultra-Fast)',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommended)' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Fastest)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
  },
}

const TEMPLATES = [
  {
    label: 'Customer Support Lead',
    instructions: 'You are an empathetic, concise Customer Support Assistant. Resolve user issues accurately using the knowledge base. If unsure, ask clarifying questions before offering help.',
    replyStyle: 'Empathetic & Helpful',
  },
  {
    label: 'Sales Qualifier & Rep',
    instructions: 'You are an energetic, goal-driven Sales Qualifier. Guide the customer through product benefits, answer questions accurately, and help them place orders seamlessly.',
    replyStyle: 'Persuasive & Direct',
  },
  {
    label: 'Technical Specialist',
    instructions: 'You are a highly skilled Technical Lead. Provide precise step-by-step guidance, cite exact specifications from documentation, and maintain a professional tone.',
    replyStyle: 'Professional & Technical',
  },
]

export interface BotWizardModalProps {
  bot?: any | null
  onClose: () => void
  onSaved: () => void
}

export default function BotWizardModal({ bot, onClose, onSaved }: BotWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [channels, setChannels] = useState<any[]>([])
  const [channelCommerceDefaults, setChannelCommerceDefaults] = useState<Record<number, number | null>>({})
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([])

  // Form State
  const [name, setName] = useState(bot?.name || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(bot?.status || 'active')
  const [aiProvider, setAiProvider] = useState(bot?.ai_provider || 'gemini')
  const [aiModel, setAiModel] = useState(bot?.ai_model || 'gemini-2.5-flash')
  const [aiInstructions, setAiInstructions] = useState(bot?.ai_instructions || '')
  const [replyStyle, setReplyStyle] = useState(bot?.reply_style || 'Friendly & Professional')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(bot?.ai_confidence_threshold ?? 0.80)
  const [ecommerceConnectionIds, setEcommerceConnectionIds] = useState<number[]>(
    bot?.ecommerce_connections?.map((connection: any) => connection.id)
      || (bot?.ecommerce_channel_id ? [bot.ecommerce_channel_id] : [])
  )
  const [defaultEcommerceConnectionId, setDefaultEcommerceConnectionId] = useState<number | null>(
    bot?.ecommerce_connections?.find((connection: any) => connection.pivot?.is_default)?.id
      || bot?.ecommerce_channel_id || null
  )
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>(
    bot?.channels?.map((c: any) => c.id) || []
  )
  const [primaryChannelIds, setPrimaryChannelIds] = useState<number[]>(
    bot?.channels?.filter((c: any) => c.pivot?.is_primary).map((c: any) => c.id) || []
  )
  const [assignments, setAssignments] = useState<Array<{ file_id: number; channel_id: number | null }>>(
    bot?.knowledgeAssignments?.map((a: any) => ({
      file_id: a.business_knowledge_file_id,
      channel_id: a.channel_id,
    })) || []
  )

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      if (!token) return

      try {
        const [chRes, kRes] = await Promise.all([
          fetch(`${API}/api/channels`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/knowledge`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (chRes.ok) {
          const chData = await chRes.json()
          const loadedChannels = Array.isArray(chData) ? chData : chData.data || []
          setChannels(loadedChannels)
          setChannelCommerceDefaults(Object.fromEntries(
            loadedChannels
              .filter((channel: any) => !['salla', 'shopify', 'woocommerce'].includes(channel.type?.toLowerCase()))
              .map((channel: any) => [channel.id, channel.default_ecommerce_connection_id ?? null])
          ))
        }

        if (kRes.ok) {
          const kData = await kRes.json()
          setKnowledgeFiles(kData.files || [])
        }
      } catch (err) {
        console.error('Failed to fetch modal data:', err)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please provide a Bot name')
      return
    }

    setLoading(true)
    try {
      const token = getToken()
      const payload = {
        name,
        status,
        ai_provider: aiProvider,
        ai_model: aiModel,
        ai_instructions: aiInstructions,
        reply_style: replyStyle,
        ai_confidence_threshold: confidenceThreshold,
        ecommerce_connection_ids: ecommerceConnectionIds,
        default_ecommerce_connection_id: defaultEcommerceConnectionId,
        channel_ids: selectedChannelIds,
        primary_channel_ids: primaryChannelIds,
        knowledge_assignments: assignments,
      }

      const url = bot ? `${API}/api/bots/${bot.id}` : `${API}/api/bots`
      const method = bot ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to save Bot')
      }

      const communicationChannels = channels.filter((channel) =>
        selectedChannelIds.includes(channel.id)
        && !['salla', 'shopify', 'woocommerce'].includes(channel.type?.toLowerCase())
      )
      const routeResults = await Promise.allSettled(communicationChannels.map(async (channel) => {
        const routeRes = await fetch(`${API}/api/channels/${channel.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            default_ecommerce_connection_id: channelCommerceDefaults[channel.id] ?? null,
          }),
        })
        return routeRes.ok
      }))

      onSaved()
      if (routeResults.some((result) => result.status === 'rejected' || !result.value)) {
        alert('The Bot was saved, but one or more channel store routes could not be saved. Edit the Bot to retry those routes.')
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error saving Bot')
    } finally {
      setLoading(false)
    }
  }

  const toggleChannel = (id: number) => {
    if (selectedChannelIds.includes(id)) {
      setSelectedChannelIds(selectedChannelIds.filter((cId) => cId !== id))
    } else {
      setSelectedChannelIds([...selectedChannelIds, id])
    }
  }

  const toggleFileAssignment = (fileId: number, channelId: number | null) => {
    const exists = assignments.some(
      (a) => a.file_id === fileId && a.channel_id === channelId
    )
    if (exists) {
      setAssignments(
        assignments.filter((a) => !(a.file_id === fileId && a.channel_id === channelId))
      )
    } else {
      setAssignments([...assignments, { file_id: fileId, channel_id: channelId }])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {bot ? 'Edit AI Bot Configuration' : 'Create New AI Bot'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure persona, connect multi-channel accounts, and assign knowledge RAG scope.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-text-secondary"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center gap-3 mb-6">
          {[
            { id: 1, title: '1. AI Persona & Prompt' },
            { id: 2, title: '2. Channel Mapping' },
            { id: 3, title: '3. Knowledge & RAG Scope' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id as any)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center border"
              style={
                step === s.id
                  ? { background: 'var(--accent-subtle)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
              }
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Modal Body Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* STEP 1: Persona */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Bot Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sales Qualifier Bot"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-accent"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    options={[
                      { value: 'active', label: 'Active (Processing Live Conversations)' },
                      { value: 'inactive', label: 'Inactive (Paused)' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="AI Provider"
                    value={aiProvider}
                    onChange={(e) => {
                      const newProvider = e.target.value
                      setAiProvider(newProvider)
                      const models = AI_PROVIDERS[newProvider]?.models
                      if (models?.length) setAiModel(models[0].value)
                    }}
                    options={Object.entries(AI_PROVIDERS).map(([key, cfg]) => ({
                      value: key,
                      label: cfg.label,
                    }))}
                  />
                </div>

                <div>
                  <Select
                    label="AI Model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    options={(AI_PROVIDERS[aiProvider]?.models || []).map((m) => ({
                      value: m.value,
                      label: m.label,
                    }))}
                  />
                </div>
              </div>

              {/* Template Presets */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Preset Persona Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => {
                        setAiInstructions(tmpl.instructions)
                        setReplyStyle(tmpl.replyStyle)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-accent transition-all"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      ⚡ {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  System Instructions (Prompt)
                </label>
                <textarea
                  rows={4}
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Describe your AI bot's goals, guidelines, and behavioral boundaries..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-accent"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Confidence Threshold Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    AI Confidence Threshold
                  </label>
                  <span className="text-xs font-black text-accent">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="1.00"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Answers with confidence below this threshold will automatically escalate to human agents.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Channel Mapping */}
          {step === 2 && (
            <div className="space-y-5">
              {/* E-Commerce Store Binding */}
              <div className="p-4 rounded-2xl border space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <label className="block text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  🛒 Commerce connections
                </label>
                <p className="text-[11px] text-text-secondary">
                  Select every store this Bot can use. The default is used unless a conversation channel has its own store mapping.
                </p>
                {channels.filter((c) => ['salla', 'shopify', 'woocommerce'].includes(c.type?.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-text-tertiary">No connected commerce stores yet.</p>
                ) : (
                  <div className="space-y-2">
                    {channels.filter((c) => ['salla', 'shopify', 'woocommerce'].includes(c.type?.toLowerCase())).map((store) => {
                      const selected = ecommerceConnectionIds.includes(store.id)
                      return (
                        <div key={store.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                          <label className="flex min-w-0 items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {
                                const next = selected
                                  ? ecommerceConnectionIds.filter((id) => id !== store.id)
                                  : [...ecommerceConnectionIds, store.id]
                                setEcommerceConnectionIds(next)
                                if (selected && defaultEcommerceConnectionId === store.id) {
                                  setDefaultEcommerceConnectionId(next[0] ?? null)
                                } else if (!selected && defaultEcommerceConnectionId === null) {
                                  setDefaultEcommerceConnectionId(store.id)
                                }
                              }}
                            />
                            <span className="truncate">{store.type?.toUpperCase()} — {store.page_name || store.page_id || `Store #${store.id}`}</span>
                          </label>
                          <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-text-secondary">
                            <input
                              type="radio"
                              name="default-commerce-connection"
                              checked={selected && defaultEcommerceConnectionId === store.id}
                              disabled={!selected}
                              onChange={() => setDefaultEcommerceConnectionId(store.id)}
                            />
                            Default
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  💬 Communication Channels
                </label>
                <p className="text-xs text-text-secondary mb-3">
                  Select which connected channel accounts this Bot should handle. If multiple bots are attached to the same account, mark one as <strong>Primary Responder</strong> for new incoming threads.
                </p>

                {channels.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs text-text-secondary">No connected channel accounts found. Please connect accounts in Channels tab first.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {channels.map((ch) => {
                    const isSelected = selectedChannelIds.includes(ch.id)
                    const isPrimary = primaryChannelIds.includes(ch.id)

                    return (
                      <div
                        key={ch.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected ? 'border-accent bg-accent/10' : 'hover:border-accent/50'
                        }`}
                        style={{ background: isSelected ? undefined : 'var(--surface)' }}
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleChannel(ch.id)}>
                          <div className="flex items-center gap-3">
                            <ChannelIcon type={ch.type as any} size={24} />
                            <div>
                              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                {ch.page_name || ch.page_id || `Account #${ch.id}`}
                              </div>
                              <div className="text-[10px] text-text-tertiary capitalize">
                                {ch.type} · ID: {ch.page_id || ch.id}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              isSelected ? 'bg-accent border-accent text-white' : 'border-border'
                            }`}
                          >
                            {isSelected && <CheckIcon size={12} />}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                            <span className="text-[10px] text-text-secondary">Multi-Bot Priority:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isPrimary) {
                                  setPrimaryChannelIds(primaryChannelIds.filter((id) => id !== ch.id))
                                } else {
                                  setPrimaryChannelIds([...primaryChannelIds, ch.id])
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                isPrimary
                                  ? 'bg-warning/20 text-warning border-warning/40'
                                  : 'bg-surface-elevated text-text-tertiary border-border hover:text-text-primary'
                              }`}
                            >
                              {isPrimary ? '★ Primary Responder' : 'Set as Primary'}
                            </button>
                          </div>
                        )}
                        {isSelected && !['salla', 'shopify', 'woocommerce'].includes(ch.type?.toLowerCase()) && (
                          <div className="mt-3">
                            <Select
                              size="sm"
                              label="Default commerce store for this channel"
                              value={channelCommerceDefaults[ch.id] ? String(channelCommerceDefaults[ch.id]) : ''}
                              onChange={(event) => setChannelCommerceDefaults({
                                ...channelCommerceDefaults,
                                [ch.id]: event.target.value ? Number(event.target.value) : null,
                              })}
                              options={[
                                { value: '', label: 'Use Bot default / automatic resolution' },
                                ...channels
                                  .filter((store) => ecommerceConnectionIds.includes(store.id))
                                  .map((store) => ({
                                    value: String(store.id),
                                    label: `${store.type?.toUpperCase()} — ${store.page_name || store.page_id || `Store #${store.id}`}`,
                                  })),
                              ]}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              </div>
            </div>
          )}

          {/* STEP 3: Knowledge RAG Scope */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-xs text-text-secondary">
                Assign knowledge files to this Bot. You can assign files as <strong>Shared</strong> (available across all of this Bot&apos;s channels) or <strong>Channel-Specific</strong>.
              </p>

              {knowledgeFiles.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs text-text-secondary">No uploaded knowledge files found. Upload files in the AI Knowledge dashboard.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-4 rounded-2xl border space-y-3"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            📄 {file.filename}
                          </div>
                          <div className="text-[10px] text-text-tertiary uppercase">
                            Type: {file.file_type} · Chunks: {file.chunks_count || 0}
                          </div>
                        </div>
                      </div>

                      {/* Assignment Toggles */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        {/* Shared Option */}
                        {(() => {
                          const isShared = assignments.some(
                            (a) => a.file_id === file.id && a.channel_id === null
                          )
                          return (
                            <button
                              type="button"
                              onClick={() => toggleFileAssignment(file.id, null)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                isShared ? 'bg-accent text-white border-accent' : 'bg-surface-elevated text-text-secondary border-border'
                              }`}
                            >
                              {isShared ? '✓ Shared (All Channels)' : '+ Shared (All Channels)'}
                            </button>
                          )
                        })()}

                        {/* Channel Specific Options */}
                        {channels
                          .filter((c) => selectedChannelIds.includes(c.id))
                          .map((ch) => {
                            const isAssigned = assignments.some(
                              (a) => a.file_id === file.id && a.channel_id === ch.id
                            )
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => toggleFileAssignment(file.id, ch.id)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                  isAssigned ? 'bg-success text-white border-success' : 'bg-surface-elevated text-text-secondary border-border'
                                }`}
                              >
                                {isAssigned ? `✓ ${ch.page_name || ch.type}` : `+ ${ch.page_name || ch.type}`}
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-4 mt-6" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : bot ? 'Save Bot Changes' : 'Create Bot'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
