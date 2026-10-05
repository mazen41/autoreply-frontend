'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ApiConversation, ApiBot } from '../../hooks/useInbox'
import ConversationCard from './ConversationCard'
import {
  Search, X, SlidersHorizontal, RefreshCw, Inbox, Bot, User,
  AlertTriangle, Clock, CheckCircle, MessageSquare, Filter, ChevronDown
} from 'lucide-react'

const TABS = [
  { key: 'all',        label: 'All',        labelAr: 'الكل',       icon: Inbox },
  { key: 'unread',     label: 'Unread',     labelAr: 'غير مقروء',  icon: MessageSquare },
  { key: 'mine',       label: 'Mine',       labelAr: 'لي',          icon: User },
  { key: 'ai_active',  label: 'AI Active',  labelAr: 'AI نشط',     icon: Bot },
  { key: 'human',      label: 'Human',      labelAr: 'يدوي',        icon: User },
  { key: 'escalated',  label: 'Escalated',  labelAr: 'مصعّد',       icon: AlertTriangle },
  { key: 'resolved',   label: 'Resolved',   labelAr: 'محلول',       icon: CheckCircle },
]

const CHANNEL_OPTIONS = ['whatsapp','instagram','messenger','telegram','gmail','webchat','tiktok']
const SORT_OPTIONS = [
  { key: 'newest',   label: 'Newest first' },
  { key: 'oldest',   label: 'Oldest first' },
  { key: 'unread',   label: 'Unread first' },
  { key: 'priority', label: 'Priority' },
]

interface ConversationListProps {
  conversations: ApiConversation[]
  selectedId: number | null
  loading: boolean
  isRTL: boolean
  onSelect: (id: number) => void
  onRefresh: () => void
  onFilterChange: (filters: Record<string, any>) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  bots?: ApiBot[]
  channels?: Array<{ id: number; type: string; page_name: string | null; page_id?: string | null }>
}

export default function ConversationList({
  conversations, selectedId, loading, isRTL, onSelect, onRefresh, onFilterChange, collapsed, onToggleCollapse,
  bots = [], channels = []
}: ConversationListProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [channelFilter, setChannelFilter] = useState('')
  const [channelIdFilter, setChannelIdFilter] = useState<number | ''>('')
  const [botFilter, setBotFilter] = useState<number | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const L = (en: string, ar: string) => isRTL ? ar : en

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  // Fire filter change upward
  useEffect(() => {
    const filters: Record<string, any> = {}
    if (debouncedSearch) filters.search = debouncedSearch
    if (channelFilter) filters.channel_type = channelFilter
    if (channelIdFilter !== '') filters.channel_id = channelIdFilter
    if (botFilter !== '') filters.bot_id = botFilter
    if (activeTab === 'unread') filters.unread = true
    if (activeTab === 'ai_active') filters.ai_enabled = true
    if (activeTab === 'human') filters.ai_enabled = false
    if (activeTab === 'escalated') filters.requires_human = true
    if (activeTab === 'mine') filters.assigned_to_me = true
    if (activeTab === 'resolved') filters.status = 'closed'
    onFilterChange(filters)
  }, [activeTab, debouncedSearch, channelFilter, channelIdFilter, botFilter, onFilterChange])

  // Client-side sort
  const sorted = useMemo(() => {
    let list = [...conversations]
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime())
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.last_message_at ?? 0).getTime() - new Date(b.last_message_at ?? 0).getTime())
    if (sortBy === 'unread') list.sort((a, b) => ((b as any).unread_count ?? 0) - ((a as any).unread_count ?? 0))
    if (sortBy === 'priority') {
      const p: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
      list.sort((a, b) => (p[a.priority ?? 'normal'] ?? 2) - (p[b.priority ?? 'normal'] ?? 2))
    }
    return list
  }, [conversations, sortBy])

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 10,
  })

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 gap-2 w-14 border-r border-border bg-surface h-full">
        <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-surface-elevated text-text-secondary">
          <Inbox size={18} />
        </button>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); onToggleCollapse?.() }}
            title={t.label}
            className={`p-2 rounded-lg transition-colors ${activeTab === t.key ? 'bg-accent-subtle text-accent' : 'text-text-tertiary hover:bg-surface-elevated'}`}
          >
            <t.icon size={14} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border" style={{ width: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-black text-text-primary">{L('Inbox', 'الرسائل')}</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary disabled:opacity-40 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-accent' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-accent-subtle text-accent' : 'hover:bg-surface-elevated text-text-secondary'}`}
            title="Filters"
          >
            <SlidersHorizontal size={14} />
          </button>
          {onToggleCollapse && (
            <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary" title="Collapse">
              <ChevronDown size={14} className="rotate-90" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L('Search conversations...', 'بحث في المحادثات...')}
            className="w-full h-8 bg-surface-elevated border border-border rounded-lg pl-7 pr-7 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter strip */}
      {showFilters && (
        <div className="px-3 py-2 border-b border-border bg-surface-elevated space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Channel</span>
            <div className="flex gap-1 flex-wrap">
              {CHANNEL_OPTIONS.map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(v => v === ch ? '' : ch)}
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md transition-colors ${
                    channelFilter === ch ? 'bg-accent text-white' : 'bg-border text-text-secondary hover:bg-accent-subtle hover:text-accent'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          {/* Channel account filter */}
          {channels.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Account</span>
              <select
                value={channelIdFilter}
                onChange={e => setChannelIdFilter(e.target.value ? Number(e.target.value) : '')}
                className="text-[10px] font-medium px-2 py-1 rounded-md bg-surface border border-border text-text-primary outline-none focus:border-accent"
              >
                <option value="">All Accounts</option>
                {channels.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    {ch.page_name || ch.page_id || `Account #${ch.id}`} ({ch.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Bot filter */}
          {bots.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Bot</span>
              <select
                value={botFilter}
                onChange={e => setBotFilter(e.target.value ? Number(e.target.value) : '')}
                className="text-[10px] font-medium px-2 py-1 rounded-md bg-surface border border-border text-text-primary outline-none focus:border-accent"
              >
                <option value="">All Bots</option>
                {bots.map(bot => (
                  <option key={bot.id} value={bot.id}>{bot.name}</option>
                ))}
              </select>
            </div>
          )}
          {(channelFilter || channelIdFilter !== '' || botFilter !== '') && (
            <button onClick={() => { setChannelFilter(''); setChannelIdFilter(''); setBotFilter('') }} className="text-[10px] text-accent hover:underline flex items-center gap-1">
              <X size={10} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-border px-1 pt-1 gap-0.5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-t-lg border border-transparent transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? 'text-accent border-b-2 border-b-accent bg-accent-subtle'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <tab.icon size={11} />
            {L(tab.label, tab.labelAr)}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-divider">
        <span className="text-[10px] text-text-tertiary font-medium">
          {sorted.length} {L('conversations', 'محادثة')}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(v => !v)}
            className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <Filter size={10} />
            {SORT_OPTIONS.find(s => s.key === sortBy)?.label}
            <ChevronDown size={10} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSortMenu(false) }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    sortBy === opt.key ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Virtual list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ contain: 'strict' }}>
        {loading && sorted.length === 0 ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-3 border-b border-divider animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-surface-elevated rounded w-2/5" />
                    <div className="h-2 bg-surface-elevated rounded w-1/6" />
                  </div>
                  <div className="h-2.5 bg-surface-elevated rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-text-tertiary" />
            </div>
            <p className="text-sm font-semibold text-text-secondary mb-1">{L('No conversations', 'لا توجد محادثات')}</p>
            <p className="text-xs text-text-tertiary">{search ? L('Try a different search', 'جرب بحثاً آخر') : L('Conversations will appear here', 'ستظهر المحادثات هنا')}</p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vi => (
              <div key={vi.key} data-index={vi.index} ref={virtualizer.measureElement} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vi.start}px)` }}>
                <ConversationCard
                  conv={sorted[vi.index]}
                  selected={sorted[vi.index].id === selectedId}
                  onClick={() => onSelect(sorted[vi.index].id)}
                  isRTL={isRTL}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
