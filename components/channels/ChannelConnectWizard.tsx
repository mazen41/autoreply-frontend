'use client'

import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import ChannelIcon from '../ui/ChannelIcon'
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Bot,
  Clock,
  UserCheck,
  Zap,
} from 'lucide-react'

export interface ChannelOption {
  id: string
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'email'
  brandColor: string
  isPopular?: boolean
}

export const ALL_CHANNELS: ChannelOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Direct Messages, Story mentions & Comment replies',
    category: 'social',
    brandColor: '#E4405F',
    isPopular: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Official Cloud API & automated conversational flows',
    category: 'messaging',
    brandColor: '#25D366',
    isPopular: true,
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Facebook Page messages and automated post replies',
    category: 'social',
    brandColor: '#1877F2',
    isPopular: true,
  },
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace',
    description: 'Customer email ticketing and AI draft auto-responder',
    category: 'email',
    brandColor: '#EA4335',
  },
  {
    id: 'reviews',
    name: 'Google Reviews',
    description: 'Auto-reply to Google Business profile reviews with AI',
    category: 'social',
    brandColor: '#4285F4',
  },
  {
    id: 'salla',
    name: 'Salla',
    description: 'Saudi Arabia #1 e-commerce order messaging sync',
    category: 'ecommerce',
    brandColor: '#00B4D8',
    isPopular: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Telegram Bot API integration for customer support',
    category: 'messaging',
    brandColor: '#0088CC',
  },
  {
    id: 'tiktok',
    name: 'TikTok Direct Messages',
    description: 'Engage TikTok shop buyers and direct messages',
    category: 'social',
    brandColor: '#FF0050',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync store orders, abandoned checkouts & buyer DMs',
    category: 'ecommerce',
    brandColor: '#96BF48',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress store order updates and AI support agent',
    category: 'ecommerce',
    brandColor: '#96588A',
  },
  {
    id: 'webchat',
    name: 'Web Chat Widget',
    description: 'Embeddable customizable AI live chat widget for your website',
    category: 'messaging',
    brandColor: '#8B3FFB',
  },
]

export interface ChannelConnectWizardProps {
  isOpen: boolean
  onClose: () => void
  initialChannel?: ChannelOption | null
  onSuccess: (channelId: string) => void
  onTriggerOAuth: (channel: ChannelOption) => Promise<void>
}

export default function ChannelConnectWizard({
  isOpen,
  onClose,
  initialChannel,
  onSuccess,
  onTriggerOAuth,
}: ChannelConnectWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialChannel ? 2 : 1)
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>(
    initialChannel || ALL_CHANNELS[0]
  )
  const [authLoading, setAuthLoading] = useState(false)

  // Configuration state
  const [accountName, setAccountName] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [selectedBot, setSelectedBot] = useState('omnisales-v1')
  const [workingHours, setWorkingHours] = useState('24/7')
  const [humanHandoff, setHumanHandoff] = useState(true)
  const [fallbackBehavior, setFallbackBehavior] = useState('agent')

  // Filter in step 1
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState('')

  const handleSelectChannel = (channel: ChannelOption) => {
    setSelectedChannel(channel)
    setAccountName(`${channel.name} Account`)
    setStep(2)
  }

  const handleAuthenticate = async () => {
    setAuthLoading(true)
    try {
      await onTriggerOAuth(selectedChannel)
      setStep(3)
    } catch (e) {
      console.error(e)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleFinishConfig = () => {
    setStep(4)
  }

  const handleComplete = () => {
    onSuccess(selectedChannel.id)
    onClose()
    setStep(1)
  }

  const filteredChannels = ALL_CHANNELS.filter((ch) => {
    const matchesCat =
      activeCategory === 'all' || ch.category === activeCategory
    const matchesSearch =
      ch.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchFilter.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="p-0 overflow-hidden"
    >
      {/* ─── Wizard Header & Steps Stepper ─────────────────────────────── */}
      <div className="px-6 py-4 bg-surface-elevated/40 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
            {step}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              {step === 1 && 'Step 1: Choose Integration'}
              {step === 2 && `Step 2: Authenticate ${selectedChannel.name}`}
              {step === 3 && `Step 3: Configure AI & Routing`}
              {step === 4 && 'Step 4: Connection Successful'}
            </h3>
            <p className="text-[11px] text-text-tertiary">
              {step === 1 && 'Select which channel or store you want to connect'}
              {step === 2 && 'Review required permissions and link your credentials'}
              {step === 3 && 'Customize AI auto-reply preferences and handoff rules'}
              {step === 4 && 'Your channel is live and ready to automate'}
            </p>
          </div>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step
                  ? 'w-6 bg-brand-primary'
                  : i < step
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── Step 1: Choose Channel ───────────────────────────────────── */}
      {step === 1 && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Channels' },
                { id: 'social', label: 'Social & Reviews' },
                { id: 'messaging', label: 'Direct Messaging' },
                { id: 'ecommerce', label: 'E-Commerce' },
                { id: 'email', label: 'Email' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary font-semibold'
                      : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Input */}
            <div className="w-full sm:w-56">
              <Input
                placeholder="Search platforms..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredChannels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleSelectChannel(ch)}
                className="p-4 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-brand-primary/40 text-left transition-all duration-150 flex flex-col justify-between group active:scale-[0.99] shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center p-2 bg-surface-card border"
                      style={{
                        borderColor: `color-mix(in srgb, ${ch.brandColor} 30%, var(--border))`,
                      }}
                    >
                      <ChannelIcon type={ch.id as any} size={22} />
                    </div>
                    {ch.isPopular && (
                      <Badge variant="brand" size="xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                    {ch.name}
                  </h4>
                  <p className="text-[11px] text-text-tertiary mt-1 line-clamp-2 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-semibold text-brand-primary">
                  <span>Connect</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step 2: Authentication & Permissions ─────────────────────── */}
      {step === 2 && (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-elevated border border-border">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-surface-card border"
              style={{
                borderColor: `color-mix(in srgb, ${selectedChannel.brandColor} 30%, var(--border))`,
              }}
            >
              <ChannelIcon type={selectedChannel.id as any} size={28} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Connect {selectedChannel.name} to NazBiz
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                We'll link your official {selectedChannel.name} account to enable automated conversational AI.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
            <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Permissions NazBiz will request:</span>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Receive incoming direct messages and comments in real-time</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dispatch automated replies via configured AI bots & workflows</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sync customer names, contact info, and conversation history</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Assign conversation tags and sentiment classifications</span>
              </li>
            </ul>
          </div>

          {/* Security Guarantee */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Enterprise grade 256-bit encryption. Your credentials and customer data remain strictly private and GDPR-compliant.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={authLoading}
              onClick={handleAuthenticate}
            >
              Authenticate & Continue
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Configure AI & Working Rules ──────────────────────── */}
      {step === 3 && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Account Display Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. VIP Customer Support"
              helperText="Internal name for your team"
            />

            <Select
              label="Assigned AI Agent"
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
              options={[
                { value: 'omnisales-v1', label: 'OmniSales AI Agent (Recommended)' },
                { value: 'support-v2', label: '24/7 Customer Care Copilot' },
                { value: 'lead-triage', label: 'Lead Qualification & Booking' },
                { value: 'manual', label: 'No AI (Human Agents Only)' },
              ]}
              helperText="The AI model that handles incoming replies"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Enable AI Auto-Reply immediately</span>
                </div>
                <div className="text-[11px] text-text-tertiary">
                  When toggled on, the assigned bot will respond automatically to new messages.
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 accent-brand-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Operating Schedule"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              options={[
                { value: '24/7', label: '24/7 Always Active (Default)' },
                { value: 'after-hours', label: 'After-Hours Only (Nights & Weekends)' },
                { value: 'business-hours', label: 'Business Hours (9am - 6pm)' },
              ]}
            />

            <Select
              label="Fallback Behavior"
              value={fallbackBehavior}
              onChange={(e) => setFallbackBehavior(e.target.value)}
              options={[
                { value: 'agent', label: 'Notify & assign to Human Agent' },
                { value: 'snooze', label: 'Send custom offline message' },
                { value: 'ai-confidence', label: 'Only respond if confidence > 85%' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/80">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button variant="primary" size="md" onClick={handleFinishConfig}>
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Connection Success ───────────────────────────────── */}
      {step === 4 && (
        <div className="p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              {selectedChannel.name} Connected Successfully!
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Your channel is active and listening for customer conversations. The AI Copilot is armed with your knowledge base.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleComplete}
              icon={<Zap className="w-4 h-4" />}
            >
              Go to Channels
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onClose()
                window.location.href = '/dashboard/ai-knowledge'
              }}
              icon={<Bot className="w-4 h-4" />}
            >
              Configure AI Knowledge
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
