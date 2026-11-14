'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'
import WizardTopNav from './WizardTopNav'
import WizardBottomNav from './WizardBottomNav'
import BotCharacterVisual, { BotMood } from './BotCharacterVisual'
import Step01Identity from './Step01Identity'
import Step02Channels from './Step02Channels'
import Step03Knowledge from './Step03Knowledge'
import Step04Personality from './Step04Personality'
import Step05Capabilities from './Step05Capabilities'
import Step06Simulator from './Step06Simulator'
import Step07Review from './Step07Review'
import {
  BOT_AVATARS,
  BotAvatarOption,
  ChannelRecord,
  KnowledgeFile,
  KnowledgeAssignment,
  BotCapabilitiesState,
  CommentSettings,
  WizardStepId,
} from './types'
import { isCommunicationChannel, getCommunicationChannels } from '../botWizardUtils'
import { LoaderCircle, AlertCircle, ArrowLeft } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

export interface BotWizardStudioProps {
  mode: 'create' | 'edit'
  botId?: number
}

export default function BotWizardStudio({ mode = 'create', botId }: BotWizardStudioProps) {
  const router = useRouter()
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  // ── Step Navigation ────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1)
  const [dirty, setDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [createdBotId, setCreatedBotId] = useState<number | null>(botId || null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [botMood, setBotMood] = useState<BotMood>('idle')

  // Edit Mode Loading & Error State
  const [loadingBot, setLoadingBot] = useState(mode === 'edit')
  const [botLoadError, setBotLoadError] = useState<string | null>(null)

  // ── Step 1: Identity ───────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarId, setAvatarId] = useState<string>(
    botId ? BOT_AVATARS[Math.abs(botId - 1) % 4].id : 'robot-01'
  )
  const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>('active')

  // ── Step 2: Channels & Stores ──────────────────────────────────────────────
  const [channels, setChannels] = useState<ChannelRecord[]>([])
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([])
  const [primaryChannelIds, setPrimaryChannelIds] = useState<number[]>([])
  const [ecommerceConnectionIds, setEcommerceConnectionIds] = useState<number[]>([])
  const [defaultEcommerceConnectionId, setDefaultEcommerceConnectionId] = useState<number | null>(null)
  const [channelCommerceDefaults, setChannelCommerceDefaults] = useState<Record<number, number | null>>({})

  // ── Step 3: Knowledge Base ─────────────────────────────────────────────────
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([])
  const [loadingKnowledge, setLoadingKnowledge] = useState(true)
  const [assignments, setAssignments] = useState<KnowledgeAssignment[]>([])
  const [businessAiProvider, setBusinessAiProvider] = useState<string | null>(null)
  const [businessAiModel, setBusinessAiModel] = useState<string | null>(null)

  // ── Step 4: Personality ────────────────────────────────────────────────────
  const [instructions, setInstructions] = useState(
    isRTL
      ? 'أنت مساعد خدمة عملاء ودود ومحترف. تجيب بدقة وإيجاز مستنداً إلى معلومات وقواعد النشاط التجاري.'
      : 'You are a friendly, professional customer support assistant. Provide concise, helpful answers grounded in store knowledge.'
  )
  const [replyStyle, setReplyStyle] = useState(isRTL ? 'ودود ومهني' : 'Friendly & Professional')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.8)
  const [escalationKeywords, setEscalationKeywords] = useState<string[]>([
    isRTL ? 'تحدث مع موظف' : 'human agent',
    isRTL ? 'شكوى' : 'complaint',
    isRTL ? 'مدير' : 'manager',
  ])
  const [escalationIntents, setEscalationIntents] = useState<string[]>([])

  // ── Step 5: Capabilities ───────────────────────────────────────────────────
  const [capabilities, setCapabilities] = useState<BotCapabilitiesState>({
    autoReply: true,
    faqGrounding: true,
    commerceRouting: true,
    humanHandoff: true,
    commentAutomation: false,
  })
  const [commentSettings, setCommentSettings] = useState<Record<number, CommentSettings>>({})

  // Determine active Bot Avatar configuration
  const activeAvatar = BOT_AVATARS.find((a) => a.id === avatarId) || BOT_AVATARS[0]

  // ── Fetch Existing Bot if in Edit Mode ─────────────────────────────────────
  useEffect(() => {
    if (mode !== 'edit' || !botId) return
    let active = true

    const fetchBotData = async () => {
      setLoadingBot(true)
      setBotLoadError(null)
      try {
        const token = getToken()
        if (!token) throw new Error('Unauthenticated')

        // Fetch bots list to locate the bot
        const res = await fetch(`${API}/api/bots`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const botList: any[] = Array.isArray(data.bots) ? data.bots : []
        const currentBot = botList.find((b) => b.id === Number(botId))

        if (!currentBot) {
          throw new Error(isRTL ? 'لم يتم العثور على الوكيل المحدد.' : 'Bot not found.')
        }

        if (!active) return

        // Prepopulate identity
        setName(currentBot.name || '')
        if (currentBot.status === 'inactive' || currentBot.status === 'draft') {
          setStatus(currentBot.status)
        } else {
          setStatus('active')
        }

        // Prepopulate instructions & persona
        if (currentBot.ai_instructions) {
          setInstructions(currentBot.ai_instructions)
        }
        if (currentBot.reply_style) {
          setReplyStyle(currentBot.reply_style)
        }
        if (typeof currentBot.ai_confidence_threshold === 'number') {
          setConfidenceThreshold(currentBot.ai_confidence_threshold)
        }
        if (currentBot.escalation_config?.keywords) {
          setEscalationKeywords(currentBot.escalation_config.keywords)
        }
        if (currentBot.escalation_config?.intents) {
          setEscalationIntents(currentBot.escalation_config.intents)
        }

        // Prepopulate channels & commerce
        const savedChannels = currentBot.channels || []
        setSelectedChannelIds(savedChannels.map((c: any) => Number(c.id)))
        setPrimaryChannelIds(
          savedChannels.filter((c: any) => c.pivot?.is_primary).map((c: any) => Number(c.id))
        )

        const savedRoutes: Record<number, number | null> = {}
        savedChannels.forEach((c: any) => {
          if (c.pivot?.ecommerce_connection_id != null) {
            savedRoutes[Number(c.id)] = Number(c.pivot.ecommerce_connection_id)
          }
        })
        setChannelCommerceDefaults(savedRoutes)

        // Prepopulate commerce stores
        const storeConns = currentBot.ecommerce_connections || []
        const storeIds = storeConns.map((s: any) => Number(s.id))
        if (currentBot.ecommerce_channel_id && !storeIds.includes(currentBot.ecommerce_channel_id)) {
          storeIds.push(currentBot.ecommerce_channel_id)
        }
        setEcommerceConnectionIds(storeIds)

        const defStore =
          storeConns.find((s: any) => s.pivot?.is_default)?.id || currentBot.ecommerce_channel_id || null
        setDefaultEcommerceConnectionId(defStore)

        // Prepopulate knowledge assignments
        const rawAssignments =
          currentBot.knowledge_assignments || currentBot.knowledgeAssignments || []
        const parsedAssignments: KnowledgeAssignment[] = rawAssignments.flatMap((a: any) =>
          a.business_knowledge_file_id == null
            ? []
            : [{ file_id: Number(a.business_knowledge_file_id), channel_id: a.channel_id ?? null }]
        )
        setAssignments(parsedAssignments)

        // Prepopulate comment settings from channel pivots
        const parsedCommentSettings: Record<number, CommentSettings> = {}
        for (const ch of savedChannels) {
          const pivot = ch.pivot || {}
          let settingsObj: any = {}
          if (typeof pivot.comment_settings === 'string') {
            try {
              settingsObj = JSON.parse(pivot.comment_settings)
            } catch {
              settingsObj = {}
            }
          } else if (pivot.comment_settings && typeof pivot.comment_settings === 'object') {
            settingsObj = pivot.comment_settings
          }
          parsedCommentSettings[Number(ch.id)] = {
            enabled: Boolean(pivot.comment_automation_enabled),
            public_reply_enabled: pivot.public_comment_reply_enabled !== false,
            private_reply_enabled: false,
            settings: {
              public_information: Array.isArray(settingsObj.public_information)
                ? settingsObj.public_information
                : [],
              fallback_response:
                typeof settingsObj.fallback_response === 'string'
                  ? settingsObj.fallback_response
                  : '',
              trigger_keywords: Array.isArray(settingsObj.trigger_keywords)
                ? settingsObj.trigger_keywords
                : [],
              excluded_keywords: Array.isArray(settingsObj.excluded_keywords)
                ? settingsObj.excluded_keywords
                : [],
            },
          }
        }
        setCommentSettings(parsedCommentSettings)

        // Derive capabilities
        const hasCommentAuto = Object.values(parsedCommentSettings).some((s) => s.enabled)
        setCapabilities({
          autoReply: currentBot.status === 'active',
          faqGrounding: parsedAssignments.length > 0,
          commerceRouting: storeIds.length > 0,
          humanHandoff: (currentBot.escalation_config?.keywords?.length || 0) > 0,
          commentAutomation: hasCommentAuto,
        })
      } catch (err: any) {
        if (active) {
          setBotLoadError(err.message || (isRTL ? 'تعذر تحميل بيانات الوكيل.' : 'Could not load bot data.'))
        }
      } finally {
        if (active) setLoadingBot(false)
      }
    }

    void fetchBotData()
    return () => {
      active = false
    }
  }, [mode, botId, isRTL])

  // ── Load Channels from API ────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const fetchChannels = async () => {
      setLoadingChannels(true)
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch(`${API}/api/channels`, {
          headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
        })
        if (res.ok) {
          const data = await res.json()
          const items: ChannelRecord[] = Array.isArray(data) ? data : data.data || []
          if (active) {
            setChannels(items)
            // If Create mode, pre-select default communication channels
            if (mode === 'create') {
              const commChannels = getCommunicationChannels(items)
              if (commChannels.length > 0 && selectedChannelIds.length === 0) {
                setSelectedChannelIds(commChannels.map((c) => c.id))
                setPrimaryChannelIds([commChannels[0].id])
              }
              const stores = items.filter((c) => !isCommunicationChannel(c) && c.status === 'connected')
              if (stores.length > 0 && ecommerceConnectionIds.length === 0) {
                setEcommerceConnectionIds(stores.map((s) => s.id))
                setDefaultEcommerceConnectionId(stores[0].id)
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load channels', err)
      } finally {
        if (active) setLoadingChannels(false)
      }
    }
    void fetchChannels()
    return () => {
      active = false
    }
  }, [mode])

  // ── Load Knowledge Files from API ──────────────────────────────────────────
  useEffect(() => {
    let active = true
    const fetchKnowledge = async () => {
      setLoadingKnowledge(true)
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch(`${API}/api/knowledge`, {
          headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
        })
        if (res.ok) {
          const data = await res.json()
          if (active) {
            setKnowledgeFiles(data.files || [])
            setBusinessAiProvider(data.profile?.ai_provider || null)
            setBusinessAiModel(data.profile?.ai_model || null)
            // If Create mode, auto-assign existing files to this bot
            if (
              mode === 'create' &&
              Array.isArray(data.files) &&
              data.files.length > 0 &&
              assignments.length === 0
            ) {
              setAssignments(data.files.map((f: KnowledgeFile) => ({ file_id: f.id, channel_id: null })))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load knowledge', err)
      } finally {
        if (active) setLoadingKnowledge(false)
      }
    }
    void fetchKnowledge()
    return () => {
      active = false
    }
  }, [mode])

  // ── Validation per step ────────────────────────────────────────────────────
  const validateStep = (step: WizardStepId): boolean => {
    const errors: Record<string, string> = {}
    if (step === 1) {
      if (!name.trim()) {
        errors.name = isRTL ? 'يرجى كتابة اسم الوكيل.' : 'Bot name is required.'
      }
    } else if (step === 4) {
      if (instructions.trim().length < 10) {
        errors.instructions = isRTL
          ? 'يرجى كتابة تعليمات لا تقل عن 10 أحرف.'
          : 'Instructions must be at least 10 characters.'
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Navigation Handlers ────────────────────────────────────────────────────
  const handleNext = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < 7) {
      setCurrentStep((cur) => (cur + 1) as WizardStepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      void handleSaveBot()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((cur) => (cur - 1) as WizardStepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleExit = () => {
    if (dirty && !isSuccess) {
      const confirmExit = window.confirm(
        copy.exitConfirm ||
          (isRTL
            ? 'هل أنت متأكد من الخروج من معالج الوكيل؟ التغييرات غير المحفوظة ستُفقد.'
            : 'Are you sure you want to exit? Unsaved progress will be lost.')
      )
      if (!confirmExit) return
    }
    router.push('/dashboard/bots')
  }

  // ── Final Save to Backend API ──────────────────────────────────────────────
  const handleSaveBot = async () => {
    if (!validateStep(1) || !validateStep(4)) {
      setCurrentStep(1)
      return
    }

    setIsSubmitting(true)
    setBotMood('thinking')

    try {
      const token = getToken()
      if (!token) throw new Error('Unauthenticated')

      const validCommIds = new Set(
        channels.filter((c) => isCommunicationChannel(c)).map((c) => c.id)
      )
      const chosenChannelIds = selectedChannelIds.filter((id) => validCommIds.has(id))

      const payload = {
        name: name.trim(),
        status,
        ai_provider: businessAiProvider || null,
        ai_model: businessAiModel || null,
        ai_instructions: instructions.trim(),
        reply_style: replyStyle,
        ai_confidence_threshold: confidenceThreshold,
        escalation_config: {
          keywords: escalationKeywords,
          intents: escalationIntents,
        },
        ecommerce_connection_ids: ecommerceConnectionIds,
        default_ecommerce_connection_id: defaultEcommerceConnectionId,
        channel_ids: chosenChannelIds,
        primary_channel_ids: primaryChannelIds.filter((id) => chosenChannelIds.includes(id)),
        channel_store_routing: channelCommerceDefaults,
        knowledge_assignments: assignments.map((a) => ({
          business_knowledge_file_id: a.file_id,
          channel_id: a.channel_id,
        })),
      }

      const endpoint = mode === 'edit' && botId ? `${API}/api/bots/${botId}` : `${API}/api/bots`
      const method = mode === 'edit' && botId ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          result.message ||
            (isRTL
              ? mode === 'edit' ? 'تعذر حفظ تعديلات الوكيل' : 'تعذر إنشاء الوكيل'
              : mode === 'edit' ? 'Failed to update bot' : 'Failed to create bot')
        )
      }

      const targetBotId = Number(result.bot?.id || result.id || botId)
      setCreatedBotId(targetBotId)

      // Save comment automation if enabled
      if (capabilities.commentAutomation && targetBotId) {
        const commentChannels = channels.filter(
          (c) => ['facebook', 'instagram'].includes(c.type) && chosenChannelIds.includes(c.id)
        )
        for (const ch of commentChannels) {
          const cfg = commentSettings[ch.id]
          if (cfg) {
            await fetch(`${API}/api/bots/${targetBotId}/comment-automation`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...getBusinessHeaders(),
              },
              body: JSON.stringify({
                channel_id: ch.id,
                comment_automation_enabled: cfg.enabled,
                public_comment_reply_enabled: cfg.public_reply_enabled,
                private_comment_reply_enabled: false,
                comment_settings: cfg.settings,
              }),
            }).catch(() => null)
          }
        }
      }

      setDirty(false)
      setBotMood('celebrating')
      setIsSuccess(true)
    } catch (err: any) {
      alert(
        err.message ||
          (isRTL
            ? 'تعذر حفظ بيانات الوكيل. يرجى المحاولة مرة أخرى.'
            : 'Could not save bot. Please try again.')
      )
      setBotMood('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading Screen for Edit Mode ───────────────────────────────────────────
  if (loadingBot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] p-6 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-surface-elevated shadow-xl">
          <LoaderCircle size={32} className="animate-spin text-brand" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {isRTL ? 'جارٍ تحميل إعدادات الوكيل...' : 'Loading bot configuration...'}
        </p>
      </div>
    )
  }

  // ── Error Screen for Edit Mode ─────────────────────────────────────────────
  if (botLoadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
          <AlertCircle size={24} />
        </div>
        <h1 className="mt-4 text-base font-bold text-white">{botLoadError}</h1>
        <button
          type="button"
          onClick={() => router.push('/dashboard/bots')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:brightness-110"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{isRTL ? 'الرجوع إلى الوكلاء' : 'Back to Bots'}</span>
        </button>
      </div>
    )
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="flex min-h-screen flex-col bg-[#070b14] text-white selection:bg-brand selection:text-white"
    >
      {/* Top Navigation */}
      <WizardTopNav
        currentStep={currentStep}
        totalSteps={7}
        onExit={handleExit}
        dirty={dirty}
        mode={mode}
      />

      {/* Main Full-Screen Split Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Ambient Dynamic Background Glows */}
        <div
          className="pointer-events-none absolute top-1/4 start-1/4 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 transition-all duration-700"
          style={{ background: activeAvatar.themeColor }}
        />
        <div className="pointer-events-none absolute bottom-10 end-1/4 h-[400px] w-[400px] rounded-full bg-brand-violet/15 blur-[100px]" />

        {/* ── Left / Start Side: Interactive Configuration Forms ── */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-6 sm:px-12 py-8 lg:py-12 z-10 max-w-3xl">
          <div className="w-full">
            {currentStep === 1 && (
              <Step01Identity
                name={name}
                setName={(val) => {
                  setName(val)
                  setDirty(true)
                  if (formErrors.name) setFormErrors((cur) => ({ ...cur, name: '' }))
                }}
                description={description}
                setDescription={(val) => {
                  setDescription(val)
                  setDirty(true)
                }}
                avatarId={avatarId}
                setAvatarId={(id) => {
                  setAvatarId(id)
                  setDirty(true)
                }}
                status={status}
                setStatus={(st) => {
                  setStatus(st)
                  setDirty(true)
                }}
                errors={formErrors}
              />
            )}

            {currentStep === 2 && (
              <Step02Channels
                channels={channels}
                loadingChannels={loadingChannels}
                selectedChannelIds={selectedChannelIds}
                setSelectedChannelIds={setSelectedChannelIds}
                primaryChannelIds={primaryChannelIds}
                setPrimaryChannelIds={setPrimaryChannelIds}
                ecommerceConnectionIds={ecommerceConnectionIds}
                setEcommerceConnectionIds={setEcommerceConnectionIds}
                defaultEcommerceConnectionId={defaultEcommerceConnectionId}
                setDefaultEcommerceConnectionId={setDefaultEcommerceConnectionId}
                channelCommerceDefaults={channelCommerceDefaults}
                setChannelCommerceDefaults={setChannelCommerceDefaults}
              />
            )}

            {currentStep === 3 && (
              <Step03Knowledge
                knowledgeFiles={knowledgeFiles}
                loadingKnowledge={loadingKnowledge}
                assignments={assignments}
                setAssignments={setAssignments}
                selectedChannels={channels.filter((c) => selectedChannelIds.includes(c.id))}
              />
            )}

            {currentStep === 4 && (
              <Step04Personality
                instructions={instructions}
                setInstructions={(val) => {
                  setInstructions(val)
                  setDirty(true)
                  if (formErrors.instructions) setFormErrors((cur) => ({ ...cur, instructions: '' }))
                }}
                replyStyle={replyStyle}
                setReplyStyle={(val) => {
                  setReplyStyle(val)
                  setDirty(true)
                }}
                confidenceThreshold={confidenceThreshold}
                setConfidenceThreshold={(val) => {
                  setConfidenceThreshold(val)
                  setDirty(true)
                }}
                escalationKeywords={escalationKeywords}
                setEscalationKeywords={setEscalationKeywords}
                escalationIntents={escalationIntents}
                setEscalationIntents={setEscalationIntents}
                onPersonalityChange={() => setDirty(true)}
                errors={formErrors}
              />
            )}

            {currentStep === 5 && (
              <Step05Capabilities
                capabilities={capabilities}
                setCapabilities={(val) => {
                  setCapabilities(val)
                  setDirty(true)
                }}
                commentSettings={commentSettings}
                setCommentSettings={setCommentSettings}
                selectedChannelIds={selectedChannelIds}
              />
            )}

            {currentStep === 6 && (
              <Step06Simulator
                avatar={activeAvatar}
                botName={name}
                instructions={instructions}
                replyStyle={replyStyle}
                confidenceThreshold={confidenceThreshold}
                escalationKeywords={escalationKeywords}
                onBotTypingState={(typing) => setBotMood(typing ? 'typing' : 'idle')}
              />
            )}

            {currentStep === 7 && (
              <Step07Review
                avatar={activeAvatar}
                botName={name || (isRTL ? activeAvatar.nameAr : activeAvatar.nameEn)}
                description={description}
                status={status}
                channels={channels}
                selectedChannelIds={selectedChannelIds}
                ecommerceConnectionIds={ecommerceConnectionIds}
                assignments={assignments}
                instructions={instructions}
                replyStyle={replyStyle}
                confidenceThreshold={confidenceThreshold}
                escalationKeywords={escalationKeywords}
                capabilities={capabilities}
                onEditStep={(step) => setCurrentStep(step as WizardStepId)}
                isSuccess={isSuccess}
                createdBotId={createdBotId}
                mode={mode}
              />
            )}
          </div>
        </div>

        {/* ── Right / End Side: 3D Scene + Animated Bot Illustration ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative border-s border-white/[0.06] bg-gradient-to-b from-[#090e1c] to-[#050811]">
          <BotCharacterVisual
            avatar={activeAvatar}
            step={currentStep}
            botName={name}
            mood={botMood}
            selectedChannels={channels.filter((c) => selectedChannelIds.includes(c.id))}
            isRTL={isRTL}
            className="w-full max-w-xl"
          />
        </div>
      </main>

      {/* Bottom Navigation (Hidden on final success screen) */}
      {!isSuccess && (
        <WizardBottomNav
          currentStep={currentStep}
          totalSteps={7}
          onBack={handleBack}
          onNext={handleNext}
          isSubmitting={isSubmitting}
          canProceed={currentStep !== 1 || name.trim().length > 0}
          dirty={dirty}
          mode={mode}
        />
      )}
    </div>
  )
}
