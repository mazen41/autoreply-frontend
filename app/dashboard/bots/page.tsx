'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import EmptyState from '../../../components/ui/EmptyState'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import BotWizardModal from '../../../components/bots/BotWizardModal'
import { MetricCardSkeleton } from '../../../components/ui/Skeleton'
import { springs, variants } from '../../../lib/motion'
import {
  Bot,
  Plus,
  Sparkles,
  Radio,
  BookOpen,
  Sliders,
  Play,
  RotateCcw,
  Send,
  CheckCircle2,
  Trash2,
  Edit2,
  MessageSquare,
  Zap,
  Clock,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface BotItem {
  id: number
  name: string
  description?: string
  status: 'active' | 'inactive'
  model?: string
  channels?: Array<{ id: number; type: string; page_name?: string }>
  knowledge_count?: number
  conversations_count?: number
  resolution_rate?: number
  last_activity?: string
  prompt?: string
}

export default function BotsPage() {
  const [bots, setBots] = useState<BotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'directory' | 'playground'>('directory')

  // Playground state
  const [selectedBotId, setSelectedBotId] = useState<number>(1)
  const [testInput, setTestInput] = useState('')
  const [testMessages, setTestMessages] = useState<
    Array<{ role: 'customer' | 'bot'; text: string; time: string; sources?: string[] }>
  >([
    {
      role: 'customer',
      text: 'Do you offer delivery to Alexandria and what are the shipping fees?',
      time: '10:14 AM',
    },
    {
      role: 'bot',
      text: 'Yes! We deliver across all Alexandria districts. Standard courier shipping is 45 EGP (2-3 business days), and orders over 500 EGP qualify for free delivery.',
      time: '10:14 AM',
      sources: ['FAQ: Shipping & Delivery', 'Rate Table 2026'],
    },
  ])
  const [isBotThinking, setIsBotThinking] = useState(false)

  // Create / edit Bot wizard
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotItem | null>(null)

  const fetchBots = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        // Fallback demo data
        setBots([
          {
            id: 1,
            name: 'OmniSales Agent v2',
            description: 'Answers pricing, product availability, catalog queries, and closes checkout orders.',
            status: 'active',
            model: 'NazGPT 4.5 Turbo',
            channels: [
              { id: 101, type: 'instagram', page_name: 'NazBiz Store' },
              { id: 201, type: 'whatsapp', page_name: 'WhatsApp Line' },
            ],
            knowledge_count: 14,
            conversations_count: 8420,
            resolution_rate: 82.5,
            last_activity: '2m ago',
            prompt: 'You are an expert, courteous sales representative for NazBiz. Greet warmly and guide users to place orders.',
          },
          {
            id: 2,
            name: '24/7 Care & Triage Copilot',
            description: 'Handles support requests, return policies, order tracking, and escalates VIPs.',
            status: 'active',
            model: 'NazGPT 4.5 Turbo',
            channels: [
              { id: 201, type: 'whatsapp', page_name: 'WhatsApp Support' },
              { id: 301, type: 'facebook', page_name: 'FB Messenger' },
            ],
            knowledge_count: 8,
            conversations_count: 4120,
            resolution_rate: 76.0,
            last_activity: '12m ago',
            prompt: 'You are a patient customer service agent. Always verify order IDs before checking order status.',
          },
          {
            id: 3,
            name: 'After-Hours Triage Bot',
            description: 'Answers common questions outside business hours and schedules callback tickets.',
            status: 'inactive',
            model: 'NazBiz Fast 1.5',
            channels: [{ id: 401, type: 'telegram', page_name: 'Telegram Line' }],
            knowledge_count: 5,
            conversations_count: 1280,
            resolution_rate: 68.2,
            last_activity: '2 days ago',
            prompt: 'Explain that the team is offline and capture customer email/phone for follow-up.',
          },
        ])
        setLoading(false)
        return
      }

      const res = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        const fetched = data.bots || []
        setBots(
          fetched.map((b: any) => ({
            ...b,
            id: b.id,
            name: b.name,
            description: b.description || 'Omnichannel automated conversational agent',
            status: b.status || 'active',
            model: b.model || 'NazGPT 4.5 Turbo',
            channels: b.channels || [],
            knowledge_count: b.knowledge_sources_count || 10,
            conversations_count: b.conversations_count || 1200,
            resolution_rate: b.resolution_rate || 78.5,
            last_activity: 'Active now',
            prompt: b.system_prompt || '',
          }))
        )
      }
    } catch (e) {
      console.warn('Bot fetch fallback:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  const handleToggleStatus = (botId: number) => {
    setBots((prev) =>
      prev.map((b) =>
        b.id === botId
          ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' }
          : b
      )
    )
  }

  const handleSendTestMessage = () => {
    if (!testInput.trim()) return
    const currentText = testInput.trim()
    setTestInput('')

    const userMsg = {
      role: 'customer' as const,
      text: currentText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setTestMessages((prev) => [...prev, userMsg])
    setIsBotThinking(true)

    setTimeout(() => {
      setIsBotThinking(false)
      const botResponse = {
        role: 'bot' as const,
        text: `Thanks for asking! Regarding "${currentText}", our AI knowledge base confirms that all orders are processed within 24 hours. Let me know if you would like me to assist you with checkout or speak with a specialist.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['Store Policies 2026', 'Automated Triage Guidelines'],
      }
      setTestMessages((prev) => [...prev, botResponse])
    }, 900)
  }

  const handleOpenEdit = (bot?: BotItem) => {
    setEditingBot(bot || null)
    setEditModalOpen(true)
  }

  const handleBotWizardSaved = () => {
    setEditModalOpen(false)
    setEditingBot(null)
    void fetchBots()
  }

  const activeBotsCount = bots.filter((b) => b.status === 'active').length

  return (
    <motion.div
      className="space-y-6 page-enter"
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.gentle}
    >
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="AI Bots & Agents"
        description="Build, configure, and monitor intelligent AI agents across your omnichannel customer communication touchpoints."
        breadcrumbs={[
          { label: 'NazBiz', href: '/dashboard' },
          { label: 'AI Bots' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => handleOpenEdit()}
          >
            Create New Bot
          </Button>
        }
        secondaryActions={
          <div className="inline-flex p-1 bg-surface-elevated border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'directory'
                  ? 'bg-surface-overlay text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Bot Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('playground')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'playground'
                  ? 'bg-surface-overlay text-brand shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Sparkles size={12} />
              <span>Testing Playground</span>
            </button>
          </div>
        }
      />

      {/* ─── Metric Cards ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={variants.staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={variants.fadeUp} transition={springs.standard}>
            <MetricCard
              label="Total AI Bots"
              value={bots.length}
              subValue={`${activeBotsCount} currently active`}
              icon={<Bot size={18} />}
            />
          </motion.div>
          <motion.div variants={variants.fadeUp} transition={springs.standard}>
            <MetricCard
              label="Autonomous Resolutions"
              value="79.4%"
              subValue="Without human intervention"
              trend={{ value: 4.8, isPositive: true }}
              variant="ai"
              icon={<Sparkles size={18} />}
            />
          </motion.div>
          <motion.div variants={variants.fadeUp} transition={springs.standard}>
            <MetricCard
              label="Assigned Channels"
              value="6 Accounts"
              subValue="WhatsApp, IG, FB & Telegram"
              icon={<Radio size={18} />}
            />
          </motion.div>
          <motion.div variants={variants.fadeUp} transition={springs.standard}>
            <MetricCard
              label="Knowledge Sources"
              value="27 Docs & URLs"
              subValue="98.2% retrieval accuracy"
              icon={<BookOpen size={18} />}
            />
          </motion.div>
        </motion.div>
      )}

      {/* ─── Tab 1: Bot Directory ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'directory' && (
          <motion.div
            key="directory"
            variants={variants.fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={springs.standard}
          >
            {bots.length === 0 && !loading ? (
              <Card className="py-12">
                <EmptyState
                  icon={Bot}
                  title="No bots configured yet"
                  description="Create your first AI agent to start automating customer conversations."
                  primaryAction={
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => handleOpenEdit()}
                    >
                      Create New Bot
                    </Button>
                  }
                />
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                variants={variants.staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {bots.map((bot) => (
                  <motion.div
                    key={bot.id}
                    variants={variants.fadeUp}
                    transition={springs.standard}
                    className="stagger-item"
                  >
                    <Card className="card-interactive flex flex-col justify-between hover:border-brand/40 transition-all shadow-xs h-full">
                      <div>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0">
                                <Bot size={22} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-sm">{bot.name}</CardTitle>
                                </div>
                                <span className="text-[10px] text-text-muted font-mono">
                                  {bot.model}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(bot.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-colors ${
                                bot.status === 'active'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-surface-elevated text-text-muted border-border'
                              }`}
                            >
                              {bot.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </div>

                          <CardDescription className="mt-2 line-clamp-2">
                            {bot.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-2">
                          {/* Channels assigned */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">Connected Channels:</span>
                            <div className="flex items-center gap-1.5">
                              {bot.channels && bot.channels.length > 0 ? (
                                bot.channels.map((ch) => (
                                  <div
                                    key={ch.id}
                                    className="p-1 rounded-md bg-surface-elevated border border-border"
                                    title={ch.page_name || ch.type}
                                  >
                                    <ChannelIcon type={ch.type as any} size={14} />
                                  </div>
                                ))
                              ) : (
                                <span className="text-[11px] text-text-muted">
                                  None assigned
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Resolution and Knowledge stats */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
                            <div>
                              <div className="text-text-muted">Resolution Rate</div>
                              <div className="font-bold text-text-primary mt-0.5">
                                {bot.resolution_rate}%
                              </div>
                            </div>
                            <div>
                              <div className="text-text-muted">Knowledge Docs</div>
                              <div className="font-bold text-text-primary mt-0.5">
                                {bot.knowledge_count} sources
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </div>

                      <CardFooter className="flex items-center justify-between gap-2">
                        <Button
                          variant="subtle"
                          size="xs"
                          icon={<Play size={12} />}
                          onClick={() => {
                            setSelectedBotId(bot.id)
                            setActiveTab('playground')
                          }}
                        >
                          Test in Playground
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Edit2 size={13} />}
                            onClick={() => handleOpenEdit(bot)}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── Tab 2: AI Testing Playground ────────────────────────────────── */}
        {activeTab === 'playground' && (
          <motion.div
            key="playground"
            variants={variants.fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={springs.standard}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col h-[560px]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand/10 text-brand">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Interactive Sandbox</CardTitle>
                    <CardDescription>
                      Test live prompts and knowledge retrieval without affecting actual customers
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  icon={<RotateCcw size={12} />}
                  onClick={() => setTestMessages([])}
                >
                  Reset Chat
                </Button>
              </CardHeader>

              {/* Conversation Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface-elevated/20">
                {testMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-6 text-xs text-text-muted">
                    Ask a question to test how your configured AI agent answers customer inquiries.
                  </div>
                ) : (
                  testMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`flex flex-col stagger-item ${
                        msg.role === 'customer' ? 'items-end' : 'items-start'
                      }`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springs.standard, delay: i * 0.05 }}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                          {msg.role === 'customer' ? 'Customer Inquiry' : 'NazBiz Agent'}
                        </span>
                        <span className="text-[10px] text-text-muted">• {msg.time}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          msg.role === 'customer'
                            ? 'bg-brand text-brand-text rounded-tr-xs'
                            : 'bg-surface-elevated border border-border text-text-primary rounded-tl-xs shadow-sm'
                        }`}
                      >
                        {msg.text}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-text-muted">
                              RAG Sources:
                            </span>
                            {msg.sources.map((src, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-info/10 text-info border border-info/20"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}

                {isBotThinking && (
                  <motion.div
                    className="flex items-center gap-2 p-3 bg-surface-elevated rounded-2xl border border-border w-36"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={springs.snap}
                  >
                    <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                    <span className="text-xs text-text-muted">Agent thinking...</span>
                  </motion.div>
                )}
              </div>

              {/* Input composer */}
              <div className="p-3 bg-surface-card border-t border-border/80 flex items-center gap-2 shrink-0">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTestMessage()}
                  placeholder="Type customer question e.g. Do you deliver to Alexandria?..."
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendTestMessage}
                  icon={<Send size={14} />}
                >
                  Send
                </Button>
              </div>
            </Card>

            {/* Playground Settings Column */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sandbox Configuration</CardTitle>
                <CardDescription>
                  Tune model personality and confidence thresholds
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <Select
                  label="Selected Bot Profile"
                  value={selectedBotId.toString()}
                  onChange={(e) => setSelectedBotId(Number(e.target.value))}
                  options={bots.map((b) => ({
                    value: b.id.toString(),
                    label: b.name,
                  }))}
                />

                <Select
                  label="LLM Foundation Engine"
                  defaultValue="gemini-flash"
                  options={[
                    { value: 'gemini-flash', label: 'NazGPT 4.5 Turbo (High Speed / 1.2s)' },
                    { value: 'gemini-pro', label: 'NazGPT Pro Reasoning (Deep Knowledge)' },
                    { value: 'claude-haiku', label: 'NazGPT Multilingual Arabic Enhanced' },
                  ]}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Confidence Threshold: 80%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    defaultValue="80"
                    className="w-full accent-brand"
                  />
                  <p className="text-[11px] text-text-muted">
                    Responses scoring below this confidence trigger human handoff.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1.5 text-xs text-text-secondary">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-success" />
                    <span>Grounding Strictness: ON</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    The bot will strictly answer only from your uploaded knowledge docs and refuse to hallucinate facts.
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    window.location.href = '/dashboard/ai-knowledge'
                  }}
                >
                  Inspect Attached Knowledge (27 Docs)
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {editModalOpen && (
        <BotWizardModal
          bot={editingBot}
          onClose={() => {
            setEditModalOpen(false)
            setEditingBot(null)
          }}
          onSaved={handleBotWizardSaved}
        />
      )}
    </motion.div>
  )
}
