'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useInbox, ApiConversation, ApiMessage } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import ReactionPicker from '../../../components/inbox/ReactionPicker'
import InboxComposer from '../../../components/inbox/InboxComposer'
import ConversationListItem from '../../../components/inbox/ConversationListItem'
import MessageBubble from '../../../components/inbox/MessageBubble'
import CustomerPanel from '../../../components/inbox/CustomerPanel'
import { Send, PanelLeft, PanelRight } from 'lucide-react'

function senderLabel(conv: ApiConversation) {
  if (conv.sender_name && conv.sender_name.trim()) return conv.sender_name.trim()
  if (conv.sender_email) return conv.sender_email
  return `···${conv.sender_id.slice(-4)}`
}

function formatTimestamp(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function channelMeta(type: string) {
  if (type === 'facebook') return { label: 'FB', color: '#0E7AFE' }
  if (type === 'instagram') return { label: 'IG', color: '#D62976' }
  if (type === 'gmail') return { label: 'GM', color: '#EA4335' }
  if (type === 'whatsapp') return { label: 'WA', color: '#25D366' }
  return { label: '??', color: 'var(--text-secondary)' }
}

function groupMessagesByDate(msgs: ApiMessage[]) {
  const groups: { date: string; messages: ApiMessage[] }[] = []
  msgs.forEach(msg => {
    const d = new Date(msg.created_at)
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === label) last.messages.push(msg)
    else groups.push({ date: label, messages: [msg] })
  })
  return groups
}

function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated)] flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-[var(--surface-elevated)] rounded w-1/2 mb-2" />
        <div className="h-2 bg-[var(--surface)] rounded w-5/6" />
      </div>
    </div>
  )
}

export default function InboxPage() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const {
    conversations,
    selectedId,
    selectedConv,
    messages,
    loadingConvs,
    loadingMsgs,
    selectConversation,
    sendReply,
    sendMediaReply,
    toggleAi,
    reactToMessage,
    submitFeedback,
    getConversationTags,
    addTag,
    removeTag
  } = useInbox()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list')
  const [toast, setToast] = useState('')
  const [optimistic, setOptimistic] = useState<ApiMessage[]>([])
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [aiEnabledFilter, setAiEnabledFilter] = useState(false)
  const [showEscalationQueue, setShowEscalationQueue] = useState(false)
  const [showMyAssignments, setShowMyAssignments] = useState(false)
  const [showCustomerPanel, setShowCustomerPanel] = useState(true)

  // Tags state
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [conversationTags, setConversationTags] = useState<Map<number, Array<{ id: number; tag: string }>>>(new Map())

  const bottomRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Fetch conversations with filters
  const fetchConversations = useCallback(async () => {
    // This will be handled by useInbox hook
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [search, channelFilter, statusFilter, aiEnabledFilter, showEscalationQueue, showMyAssignments, showAdvancedFilters, fetchConversations])

  useEffect(() => {
    if (selectedId) {
      getConversationTags(selectedId).then(tags => {
        setConversationTags(prev => new Map(prev).set(selectedId, tags))
      })
    }
  }, [selectedId, getConversationTags])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, optimistic])

  // Memoized filtered conversations with advanced filters
  const filtered = useMemo(() => {
    return conversations.filter(c => {
      // Basic channel filter
      const matchType = filter === 'all' || c.channel?.type === filter
      
      // Advanced channel filter (if different from basic)
      const matchAdvancedChannel = !channelFilter || c.channel?.type === channelFilter
      
      // Status filter
      const matchStatus = !statusFilter || c.status === statusFilter
      
      // AI enabled filter
      const matchAI = !aiEnabledFilter || c.ai_enabled
      
      // Escalation queue filter
      const matchEscalated = !showEscalationQueue || c.category === 'escalation_needed'
      
      // My assignments filter
      const matchAssigned = !showMyAssignments || c.assigned_agent_id
      
      // Search query
      const q = search.toLowerCase()
      const matchSearch = !q || 
        senderLabel(c).toLowerCase().includes(q) || 
        (c.subject ?? '').toLowerCase().includes(q) || 
        (c.latest_message?.content ?? '').toLowerCase().includes(q) ||
        (c.sender_email ?? '').toLowerCase().includes(q)
      
      // If advanced filters are not shown, use basic filter only
      if (!showAdvancedFilters && !showEscalationQueue && !showMyAssignments) {
        return matchType && matchSearch
      }
      
      // Otherwise apply all filters
      return matchType && matchAdvancedChannel && matchStatus && matchAI && matchEscalated && matchAssigned && matchSearch
    })
  }, [conversations, filter, search, showAdvancedFilters, channelFilter, statusFilter, aiEnabledFilter, showEscalationQueue, showMyAssignments])

  const allMessages = useMemo(() => [...messages, ...optimistic], [messages, optimistic])
  const grouped = useMemo(() => groupMessagesByDate(allMessages), [allMessages])
  
  const ch = selectedConv ? channelMeta(selectedConv.channel?.type) : null

  function handleSelect(id: number) {
    setOptimistic([])
    selectConversation(id)
    setMobilePane('chat')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Escape to close panels
      if (e.key === 'Escape') {
        if (showAdvancedFilters) setShowAdvancedFilters(false)
        if (showTagInput) setShowTagInput(false)
        if (showCustomerPanel) setShowCustomerPanel(false)
      }
      
      // Arrow key navigation for conversations
      if (filtered.length > 0 && !showAdvancedFilters && !showTagInput) {
        const currentIndex = filtered.findIndex(c => c.id === selectedId)
        
        if (e.key === 'ArrowDown' && currentIndex < filtered.length - 1) {
          e.preventDefault()
          handleSelect(filtered[currentIndex + 1].id)
        }
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault()
          handleSelect(filtered[currentIndex - 1].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedId, showAdvancedFilters, showTagInput, showCustomerPanel])

  // Composer handlers with isolated state
  const handleSendText = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedId) return false
    const temp: ApiMessage = { 
      id: Date.now(), 
      conversation_id: selectedId, 
      content: text, 
      direction: 'outbound', 
      is_ai: false, 
      status: 'manual', 
      created_at: new Date().toISOString() 
    }
    setOptimistic(p => [...p, temp])
    const ok = await sendReply(selectedId, text)
    if (!ok) { 
      setOptimistic(p => p.filter(m => m.id !== temp.id))
      return false
    }
    setOptimistic([])
    return true
  }, [selectedId, sendReply])

  const handleSendMedia = useCallback(async (file: File, caption: string, mediaType: string, isVoiceNote: boolean): Promise<boolean> => {
    if (!selectedId) return false
    const uploaded = await sendMediaReply(selectedId, file, caption, mediaType, isVoiceNote)
    return uploaded !== null
  }, [selectedId, sendMediaReply])

  const handleComposerError = useCallback((message: string) => {
    setToast(isRTL ? 'تعذر الإرسال. حاول مرة أخرى.' : message)
  }, [isRTL])

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm overflow-hidden">
      
      {/* Conversations list (Left Side) */}
      <div className={`w-80 border-r border-[var(--border)] bg-[var(--surface)]/80 flex flex-col flex-shrink-0 transition-all duration-300 ${
        mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* List Header */}
        <div className="p-4 border-b border-[var(--divider)] space-y-3 bg-[var(--surface-elevated)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[var(--text-primary)] tracking-tight">
              {t.inbox.title}
            </h2>
            <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent uppercase">
              {filtered.length} {isRTL ? 'محادثة' : 'chats'}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'facebook', 'instagram', 'gmail', 'whatsapp'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer flex-shrink-0 border ${
                  filter === f
                    ? 'bg-accent border-accent text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم أو المحتوى...' : 'Search inbox...'}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-accent/40"
              aria-label={isRTL ? 'بحث في المحادثات' : 'Search conversations'}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            aria-expanded={showAdvancedFilters}
            aria-controls="advanced-filters-panel"
          >
            <span className="font-bold uppercase tracking-wider">
              {isRTL ? 'فلاتر متقدمة' : 'Advanced Filters'}
            </span>
            <span className="text-accent">{showAdvancedFilters ? '▲' : '▼'}</span>
          </button>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div id="advanced-filters-panel" className="space-y-2 pt-2 border-t border-[var(--divider)]" role="region" aria-label="Advanced filters">
              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent/40"
              >
                <option value="">All Channels</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="gmail">Gmail</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent/40"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>

              {/* AI Enabled Filter */}
              <label className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabledFilter}
                  onChange={e => setAiEnabledFilter(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] accent-accent"
                />
                <span>{isRTL ? 'AI مفعل فقط' : 'AI Enabled Only'}</span>
              </label>

              {/* Escalation Queue Toggle */}
              <label className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEscalationQueue}
                  onChange={e => setShowEscalationQueue(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] accent-amber-500"
                />
                <span className="text-amber-400">{isRTL ? 'طابور التصعيد' : 'Escalation Queue'}</span>
              </label>

              {/* My Assignments Toggle */}
              <label className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyAssignments}
                  onChange={e => setShowMyAssignments(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] accent-accent"
                />
                <span>{isRTL ? 'تعييناتي' : 'My Assignments'}</span>
              </label>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setChannelFilter('')
                  setStatusFilter('')
                  setAiEnabledFilter(false)
                  setShowEscalationQueue(false)
                  setShowMyAssignments(false)
                }}
                className="w-full py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            </div>
          )}
        </div>

        {/* List Display */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--divider)] scrollbar-none">
          {loadingConvs ? (
            Array(5).fill(0).map((_, i) => <ConvSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
              {search ? t.inbox.noResults : t.inbox.noConversations}
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationListItem
                key={conv.id}
                conv={conv}
                active={selectedId === conv.id}
                onClick={() => handleSelect(conv.id)}
                onToggleAi={toggleAi}
                tags={conversationTags.get(conv.id)}
                isEscalated={showEscalationQueue}
                isAssigned={showMyAssignments}
              />
            ))
          )}
        </div>
      </div>

      {/* Active Conversation (Center) */}
      <div className={`flex-1 flex flex-col bg-[var(--background)]/40 relative transition-all duration-300 ${
        mobilePane === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-accent mb-4">
              <Send size={20} className="opacity-80" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              {isRTL ? 'اختر محادثة للبدء' : 'Select a conversation'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              {t.inbox.selectConversation}
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4.5 border-b border-[var(--divider)] bg-[var(--surface-elevated)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobilePane('list')}
                  className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ←
                </button>
                <div className="relative flex-shrink-0">
                  <ChannelIcon type={(selectedConv.channel?.type || 'facebook') as any} size={38} className="rounded-xl border border-[var(--border)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {senderLabel(selectedConv)}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="capitalize">{ch?.label} Channel</span>
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAi(selectedConv.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    selectedConv.ai_enabled
                      ? 'bg-accent/15 border-accent/30 text-accent'
                      : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.ai_enabled ? 'bg-accent' : 'bg-[var(--text-tertiary)]'}`} />
                  <span>AI {selectedConv.ai_enabled ? 'ACTIVE' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)] transition-all"
                >
                  🏷️ Tags
                </button>

                <button
                  onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                  className="hidden lg:block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)] transition-all"
                >
                  {showCustomerPanel ? 'Hide Panel' : 'Customer'}
                </button>
              </div>
            </div>

            {/* Tag Management Panel */}
            {showTagInput && selectedId && (
              <div className="px-6 py-3.5 border-b border-[var(--divider)] bg-[var(--surface)]/60 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder={isRTL ? 'أضف وسماً...' : 'Add tag name...'}
                    className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-accent/40"
                    onKeyPress={e => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        addTag(selectedId, newTag.trim()).then(tag => {
                          if (tag) {
                            setConversationTags(prev => new Map(prev).set(selectedId, [...(prev.get(selectedId) || []), tag]))
                            setNewTag('')
                          }
                        })
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim()) {
                        addTag(selectedId, newTag.trim()).then(tag => {
                          if (tag) {
                            setConversationTags(prev => new Map(prev).set(selectedId, [...(prev.get(selectedId) || []), tag]))
                            setNewTag('')
                          }
                        })
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110"
                  >
                    {isRTL ? 'إضافة' : 'Add'}
                  </button>
                </div>
                
                {conversationTags.get(selectedId) && conversationTags.get(selectedId)!.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {conversationTags.get(selectedId)!.map(tag => (
                      <div key={tag.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] text-[10px]">
                        <span>{tag.tag}</span>
                        <button
                          onClick={() => {
                            removeTag(selectedId, tag.id).then(success => {
                              if (success) {
                                setConversationTags(prev => new Map(prev).set(selectedId, (prev.get(selectedId) || []).filter(t => t.id !== tag.id)))
                              }
                            })
                          }}
                          className="hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Thread Message Bubbles */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center py-16 text-xs text-[var(--text-tertiary)]">
                  {t.inbox.noMessages}
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date} className="space-y-4">
                    <div className="flex items-center gap-4 my-2">
                      <div className="flex-1 h-px bg-[var(--divider)]" />
                      <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">{group.date}</span>
                      <div className="flex-1 h-px bg-[var(--divider)]" />
                    </div>
                    {group.messages.map(msg => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        channelType={selectedConv?.channel?.type}
                        isRTL={isRTL}
                        onReact={reactToMessage}
                        conv={selectedConv}
                        onSubmitFeedback={submitFeedback}
                      />
                    ))}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Chat Composer */}
            <InboxComposer
              disabled={false}
              channelType={selectedConv?.channel?.type}
              onSendText={handleSendText}
              onSendMedia={handleSendMedia}
              onError={handleComposerError}
            />
          </>
        )}

        {/* Customer Panel (Right Side) */}
        {showCustomerPanel && (
          <div className="hidden lg:block transition-all duration-300">
            <CustomerPanel
              conversation={selectedConv}
              tags={conversationTags.get(selectedId || 0)}
              onRemoveTag={(tagId) => {
                if (selectedId) {
                  removeTag(selectedId, tagId).then(success => {
                    if (success) {
                      setConversationTags(prev => new Map(prev).set(selectedId, (prev.get(selectedId) || []).filter(t => t.id !== tagId)))
                    }
                  })
                }
              }}
              onAddTag={(tag) => {
                if (selectedId) {
                  addTag(selectedId, tag).then(tag => {
                    if (tag) {
                      setConversationTags(prev => new Map(prev).set(selectedId, [...(prev.get(selectedId) || []), tag]))
                    }
                  })
                }
              }}
              onClose={() => setShowCustomerPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Mobile/Tablet Panel Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowCustomerPanel(!showCustomerPanel)}
          className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg"
          aria-label="Toggle customer panel"
        >
          {showCustomerPanel ? <PanelLeft size={20} /> : <PanelRight size={20} />}
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-accent/15 border border-accent/25 text-accent text-xs font-bold z-[1000] backdrop-blur-sm flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  )
}