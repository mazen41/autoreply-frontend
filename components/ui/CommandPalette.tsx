'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface CommandItem {
  id: string
  title: string
  description?: string
  category: 'Navigation' | 'Actions' | 'Channels' | 'AI & Automation'
  href?: string
  action?: () => void
  icon?: React.ReactNode
  shortcut?: string
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const items: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', title: 'Dashboard', description: 'Overview and analytics command center', category: 'Navigation', href: '/dashboard' },
    { id: 'nav-inbox', title: 'Inbox', description: 'Live omnichannel conversations', category: 'Navigation', href: '/inbox', shortcut: 'G I' },
    { id: 'nav-channels', title: 'Channels', description: 'Connected social & messaging channels', category: 'Navigation', href: '/dashboard/channels', shortcut: 'G C' },
    { id: 'nav-whatsapp', title: 'WhatsApp Hub', description: 'WhatsApp Business API & templates', category: 'Navigation', href: '/dashboard/whatsapp' },
    { id: 'nav-bots', title: 'AI Bots', description: 'Agent configurations & testing playground', category: 'Navigation', href: '/dashboard/bots' },
    { id: 'nav-knowledge', title: 'AI Knowledge', description: 'Documents, URLs, and vector knowledge', category: 'Navigation', href: '/dashboard/ai-knowledge' },
    { id: 'nav-training', title: 'AI Training', description: 'Review and improve AI replies', category: 'Navigation', href: '/dashboard/training' },
    { id: 'nav-campaigns', title: 'Campaigns', description: 'Outbound messaging broadcasts', category: 'Navigation', href: '/dashboard/campaigns' },
    { id: 'nav-workflows', title: 'Workflows', description: 'Visual automation builder', category: 'Navigation', href: '/dashboard/workflows' },
    { id: 'nav-analytics', title: 'Analytics', description: 'Resolution rates & response metrics', category: 'Navigation', href: '/dashboard/analytics' },
    { id: 'nav-team', title: 'Team Management', description: 'Members, roles, and assignments', category: 'Navigation', href: '/dashboard/team' },
    { id: 'nav-settings', title: 'Settings', description: 'Workspace preferences & security', category: 'Navigation', href: '/dashboard/settings', shortcut: 'G S' },
    { id: 'nav-billing', title: 'Billing & Plans', description: 'Subscription & usage meters', category: 'Navigation', href: '/dashboard/billing' },
    { id: 'nav-api', title: 'API Keys', description: 'Developer tokens & webhooks', category: 'Navigation', href: '/dashboard/api-keys' },

    // Actions
    { id: 'act-connect', title: 'Connect New Channel', description: 'Integrate Instagram, WhatsApp, TikTok, etc.', category: 'Actions', href: '/dashboard/channels?connect=true' },
    { id: 'act-bot', title: 'Create New AI Bot', description: 'Build an automated AI responder agent', category: 'Actions', href: '/dashboard/bots?new=true' },
    { id: 'act-doc', title: 'Upload Knowledge Doc', description: 'Train bot on PDF, text, or FAQ URL', category: 'Actions', href: '/dashboard/ai-knowledge?upload=true' },
    { id: 'act-campaign', title: 'New Broadcast Campaign', description: 'Send targeted omnichannel outreach', category: 'Actions', href: '/dashboard/campaigns?create=true' },

    // Channels
    { id: 'ch-ig', title: 'Instagram DMs', description: 'Automate comments and direct messages', category: 'Channels', href: '/dashboard/channels#instagram' },
    { id: 'ch-wa', title: 'WhatsApp Business', description: 'Official Cloud API messaging', category: 'Channels', href: '/dashboard/whatsapp' },
    { id: 'ch-fb', title: 'Facebook Messenger', description: 'Page messaging and auto-replies', category: 'Channels', href: '/dashboard/channels#facebook' },
    { id: 'ch-tg', title: 'Telegram Bot', description: 'Customer support bot channels', category: 'Channels', href: '/dashboard/channels#telegram' },
  ]

  const filtered = items.filter((item) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    } else {
      setQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item: CommandItem) => {
    onClose()
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  // Group filtered items by category
  const categories = Array.from(new Set(filtered.map((item) => item.category)))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Box */}
      <div
        className="relative w-full max-w-xl bg-surface-overlay border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[75vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border/80 gap-3">
          <svg
            className="w-4 h-4 text-text-tertiary shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-surface-elevated text-text-tertiary border border-border rounded font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary">
              No matching commands or pages found.
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filtered.filter((i) => i.category === cat)
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    {cat}
                  </div>
                  {catItems.map((item) => {
                    const globalIdx = filtered.indexOf(item)
                    const isSelected = globalIdx === selectedIndex

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-brand-primary' : 'text-text-primary'
                            }`}
                          >
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-text-tertiary truncate">
                              {item.description}
                            </div>
                          )}
                        </div>

                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-[10px] bg-surface-elevated text-text-tertiary border border-border rounded font-mono shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-surface-elevated/40 border-t border-border/80 flex items-center justify-between text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> select
            </span>
          </div>
          <span>NazBiz Command Bar</span>
        </div>
      </div>
    </div>
  )
}
