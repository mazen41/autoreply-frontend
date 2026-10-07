'use client'

import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import ChannelIcon from '../ui/ChannelIcon'
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react'

export interface ChannelOption {
  id: string
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'email'
  brandColor: string
  isPopular?: boolean
}

export const ALL_CHANNELS: ChannelOption[] = [
  { id: 'instagram', name: 'Instagram', description: 'Direct Messages, Story mentions & Comment replies', category: 'social', brandColor: '#E4405F', isPopular: true },
  { id: 'facebook', name: 'Facebook Messenger', description: 'Facebook Page messages and automated post replies', category: 'social', brandColor: '#1877F2', isPopular: true },
  { id: 'gmail', name: 'Gmail & Google Workspace', description: 'Customer email ticketing and AI draft auto-responder', category: 'email', brandColor: '#EA4335' },
  { id: 'salla', name: 'Salla', description: 'Connect a Salla store and sync commerce activity', category: 'ecommerce', brandColor: '#00B4D8', isPopular: true },
  { id: 'tiktok', name: 'TikTok Direct Messages', description: 'Engage TikTok shop buyers and direct messages', category: 'social', brandColor: '#FF0050' },
]

export interface ChannelConnectWizardProps {
  isOpen: boolean
  onClose: () => void
  initialChannel?: ChannelOption | null
  onTriggerOAuth: (channel: ChannelOption) => Promise<void>
}

export default function ChannelConnectWizard({ isOpen, onClose, initialChannel, onTriggerOAuth }: ChannelConnectWizardProps) {
  const [step, setStep] = useState<1 | 2>(initialChannel ? 2 : 1)
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>(initialChannel || ALL_CHANNELS[0])
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')

  const handleSelectChannel = (channel: ChannelOption) => {
    setSelectedChannel(channel)
    setAuthError(null)
    setStep(2)
  }

  const handleAuthenticate = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await onTriggerOAuth(selectedChannel)
      onClose()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'This integration could not be started.')
    } finally {
      setAuthLoading(false)
    }
  }

  const filteredChannels = ALL_CHANNELS.filter((channel) => {
    const matchesCategory = activeCategory === 'all' || channel.category === activeCategory
    const query = searchFilter.toLowerCase()
    return matchesCategory && (channel.name.toLowerCase().includes(query) || channel.description.toLowerCase().includes(query))
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0 overflow-hidden">
      <div className="px-6 py-4 bg-surface-elevated/40 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">{step}</div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              {step === 1 ? 'Step 1: Choose Integration' : `Step 2: Authenticate ${selectedChannel.name}`}
            </h3>
            <p className="text-[11px] text-text-tertiary">
              {step === 1 ? 'Select which channel or store you want to connect' : 'Continue to the provider to authorize this connection'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[1, 2].map((item) => <div key={item} className={`h-1.5 rounded-full transition-all ${item === step ? 'w-6 bg-brand' : item < step ? 'w-2 bg-success' : 'w-2 bg-border'}`} />)}
        </div>
      </div>

      {step === 1 && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Channels' },
                { id: 'social', label: 'Social' },
                { id: 'messaging', label: 'Direct Messaging' },
                { id: 'ecommerce', label: 'E-Commerce' },
                { id: 'email', label: 'Email' },
              ].map((category) => (
                <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${activeCategory === category.id ? 'bg-brand/10 border-brand/30 text-brand font-semibold' : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'}`}>
                  {category.label}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-56"><Input placeholder="Search platforms..." value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredChannels.map((channel) => (
              <button key={channel.id} type="button" onClick={() => handleSelectChannel(channel)} className="p-4 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-brand/40 text-left transition-all flex flex-col justify-between group shadow-xs">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center p-2 bg-surface-card border" style={{ borderColor: `color-mix(in srgb, ${channel.brandColor} 30%, var(--border))` }}>
                      <ChannelIcon type={channel.id as any} size={22} />
                    </div>
                    {channel.isPopular && <Badge variant="brand" size="xs">Popular</Badge>}
                  </div>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors">{channel.name}</h4>
                  <p className="text-[11px] text-text-tertiary mt-1 line-clamp-2 leading-relaxed">{channel.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-semibold text-brand"><span>Connect</span><ArrowRight className="w-3.5 h-3.5" /></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-elevated border border-border">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-surface-card border" style={{ borderColor: `color-mix(in srgb, ${selectedChannel.brandColor} 30%, var(--border))` }}>
              <ChannelIcon type={selectedChannel.id as any} size={28} />
            </div>
            <div><h4 className="text-sm font-bold text-text-primary">Connect {selectedChannel.name} to NazBiz</h4><p className="text-xs text-text-secondary mt-0.5">You will authorize access directly with {selectedChannel.name}.</p></div>
          </div>
          <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
            <div className="text-xs font-semibold text-text-primary flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /><span>Connection permissions</span></div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /><span>Receive messages or store updates supported by this integration</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /><span>Send replies or sync data allowed by the permissions you approve</span></li>
            </ul>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs"><Lock className="w-4 h-4 shrink-0" /><span>Review the provider authorization screen to see the exact permissions requested.</span></div>
          {authError && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">{authError}</div>}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" size="md" loading={authLoading} onClick={handleAuthenticate}>Continue to {selectedChannel.name}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
