'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useInbox } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'

// Components
import ConversationList from '../../../components/inbox/ConversationList'
import ConversationHeader from '../../../components/inbox/ConversationHeader'
import AIStatusBar from '../../../components/inbox/AIStatusBar'
import MessageTimeline from '../../../components/inbox/MessageTimeline'
import ChatComposer from '../../../components/inbox/ChatComposer'
import AICopilot from '../../../components/inbox/AICopilot'
import CustomerPanel from '../../../components/inbox/CustomerPanel'
import { MessageSquare, PanelRight } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function InboxPage() {
  const { isRTL } = useLang()
  const {
    conversations, messages, selectedId, selectedConv,
    loadingConvs, loadingMsgs, sending, error,
    fetchConversations, selectConversation, sendReply, sendMediaReply,
    toggleAi, updateConversationStatus, updateConversationBot, reactToMessage, submitFeedback
  } = useInbox()

  // Panel visibility state
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  // Mobile: which view is active — 'list' | 'thread' | 'context'
  const [mobileView, setMobileView] = useState<'list' | 'thread' | 'context'>('list')
  // Tablet: context slides in as a drawer
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false)

  const [showCopilot, setShowCopilot] = useState(false)
  const [composerInitialText, setComposerInitialText] = useState('')
  const [bots, setBots] = useState<Array<{ id: number; name: string }>>([])
  const [channels, setChannels] = useState<Array<{ id: number; type: string; page_name: string | null; page_id?: string | null }>>([])
  const [isUpdatingBot, setIsUpdatingBot] = useState(false)

  // Fetch bots and channels for filters — untouched API logic
  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch(`${API}/api/bots`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.bots) setBots(data.bots.map((b: any) => ({ id: b.id, name: b.name })))
      })
      .catch(() => {})

    fetch(`${API}/api/channels`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const chs = Array.isArray(data) ? data : data?.data || []
        setChannels(chs.map((c: any) => ({ id: c.id, type: c.type, page_name: c.page_name, page_id: c.page_id })))
      })
      .catch(() => {})
  }, [])

  // Responsive panel collapse — tablets hide right, mobile shows list-first
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        setLeftCollapsed(false)
        setRightCollapsed(true)
      } else if (w < 1024) {
        setLeftCollapsed(false)
        setRightCollapsed(true)
      } else {
        setRightCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // When a conversation is selected on mobile, switch to thread view
  const handleSelectConversation = useCallback((id: number) => {
    selectConversation(id)
    if (window.innerWidth < 768) {
      setMobileView('thread')
    }
  }, [selectConversation])

  // Update copilot visibility — untouched logic
  useEffect(() => {
    if (selectedConv?.ai_enabled) setShowCopilot(true)
    else setShowCopilot(false)
  }, [selectedId, selectedConv?.ai_enabled])

  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    fetchConversations(false, filters)
  }, [fetchConversations])

  const handleBotChange = useCallback(async (botId: number | null) => {
    if (!selectedConv) return
    setIsUpdatingBot(true)
    try {
      await updateConversationBot(selectedConv.id, botId)
    } finally {
      setIsUpdatingBot(false)
    }
  }, [selectedConv, updateConversationBot])

  const availableBotsForConv = useMemo(() => {
    if (!selectedConv?.channel?.id) return []
    return bots.filter(() => true)
  }, [bots, selectedConv])

  const handleCorrectAI = useCallback(async (
    messageId: number,
    aiDraft: string,
    correction: string,
    learningType: string
  ): Promise<void> => {
    const token = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1]
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/training/corrections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token ? decodeURIComponent(token) : ''}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        original_message_id: messageId,
        ai_draft: aiDraft,
        human_correction: correction,
        learning_type: learningType,
      }),
    })
    if (!res.ok) throw new Error(`Failed to submit correction: HTTP ${res.status}`)
  }, [])

  // ─── Empty State (no conversation selected) ────────────────────────────────
  const EmptyThread = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background text-text-tertiary select-none">
      <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <MessageSquare size={24} className="opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text-secondary mb-0.5">
          {isRTL ? 'اختر محادثة' : 'Select a conversation'}
        </p>
        <p className="text-xs text-text-tertiary">
          {isRTL ? 'ستظهر الرسائل هنا' : 'Messages will appear here'}
        </p>
      </div>
    </div>
  )

  // ─── Thread Center Panel ───────────────────────────────────────────────────
  const ThreadPanel = () => (
    <div className="flex-1 flex flex-col min-w-0 bg-background border-x border-border overflow-hidden">
      {selectedConv ? (
        <>
          <ConversationHeader
            conv={selectedConv}
            isRTL={isRTL}
            onToggleAI={() => toggleAi(selectedConv.id)}
            onStatusChange={(s) => updateConversationStatus(selectedConv.id, s)}
            onToggleLeftPanel={() => setLeftCollapsed(v => !v)}
            onToggleRightPanel={() => {
              // On tablet, open the drawer instead
              if (window.innerWidth < 1024) {
                setContextDrawerOpen(v => !v)
              } else {
                setRightCollapsed(v => !v)
              }
            }}
            leftCollapsed={leftCollapsed}
            rightCollapsed={rightCollapsed && !contextDrawerOpen}
            availableBots={availableBotsForConv}
            onBotChange={handleBotChange}
            isUpdatingBot={isUpdatingBot}
          />

          <AIStatusBar conv={selectedConv} isRTL={isRTL} />

          <MessageTimeline
            messages={messages}
            loading={loadingMsgs}
            isRTL={isRTL}
            selectedConv={selectedConv}
            channelType={selectedConv.channel?.type}
            reactToMessage={reactToMessage}
            submitFeedback={submitFeedback}
            onCorrectAI={handleCorrectAI}
          />

          <div className="flex-shrink-0 z-10 relative border-t border-border">
            {showCopilot && (
              <div className="absolute bottom-full left-0 right-0">
                <AICopilot
                  conv={selectedConv}
                  isRTL={isRTL}
                  onInsertReply={(t) => setComposerInitialText(t)}
                  onClose={() => setShowCopilot(false)}
                />
              </div>
            )}
            <ChatComposer
              channelType={selectedConv.channel?.type}
              isRTL={isRTL}
              onSendText={(text) => sendReply(selectedConv.id, text)}
              onSendMedia={async (file, cap, type, voice) => {
                const res = await sendMediaReply(selectedConv.id, file, cap, type, voice)
                return res !== null
              }}
              disabled={sending}
              initialText={composerInitialText}
            />
          </div>
        </>
      ) : (
        <EmptyThread />
      )}
    </div>
  )

  // ─── MOBILE LAYOUT (<768px) ────────────────────────────────────────────────
  // Full-screen step-by-step: list → thread → context sheet
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          DESKTOP & TABLET — Three (or two) panel side-by-side layout
          ───────────────────────────────────────────────────────────────────── */}
      <div
        className="hidden sm:flex w-full h-full bg-background overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Panel 1 — Conversation List */}
        {!leftCollapsed && (
          <div className="flex-shrink-0 h-full overflow-hidden" style={{ width: 280 }}>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              loading={loadingConvs}
              isRTL={isRTL}
              onSelect={handleSelectConversation}
              onRefresh={() => fetchConversations()}
              onFilterChange={handleFilterChange}
              collapsed={false}
              onToggleCollapse={() => setLeftCollapsed(true)}
              bots={bots}
              channels={channels}
            />
          </div>
        )}

        {/* Collapsed list rail */}
        {leftCollapsed && (
          <div className="flex flex-col items-center py-3 flex-shrink-0 w-12 border-r border-border bg-surface gap-2">
            <button
              onClick={() => setLeftCollapsed(false)}
              className="p-2 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
              title={isRTL ? 'توسيع القائمة' : 'Expand list'}
            >
              <MessageSquare size={16} />
            </button>
          </div>
        )}

        {/* Panel 2 — Thread */}
        <ThreadPanel />

        {/* Panel 3 — Context (desktop: side panel; tablet: drawer overlay) */}
        {/* Desktop: always visible if not collapsed */}
        <div
          className={`hidden lg:flex flex-col h-full flex-shrink-0 overflow-hidden border-l border-border bg-surface transition-all duration-200 ${
            rightCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ width: rightCollapsed ? 0 : 300 }}
        >
          {selectedConv && (
            <CustomerPanel
              conv={selectedConv}
              isRTL={isRTL}
              onClose={() => setRightCollapsed(true)}
            />
          )}
        </div>

        {/* Tablet: slide-in drawer from right */}
        {contextDrawerOpen && selectedConv && (
          <>
            <div
              className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-sm"
              onClick={() => setContextDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 z-40 lg:hidden flex flex-col bg-surface border-l border-border shadow-2xl overflow-hidden" style={{ width: 300 }}>
              <CustomerPanel
                conv={selectedConv}
                isRTL={isRTL}
                onClose={() => setContextDrawerOpen(false)}
              />
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MOBILE LAYOUT (<640px) — stacked full-screen views
          ───────────────────────────────────────────────────────────────────── */}
      <div
        className="flex sm:hidden w-full h-full bg-background overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Step 1: Conversation list */}
        {mobileView === 'list' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              loading={loadingConvs}
              isRTL={isRTL}
              onSelect={handleSelectConversation}
              onRefresh={() => fetchConversations()}
              onFilterChange={handleFilterChange}
              collapsed={false}
              bots={bots}
              channels={channels}
            />
          </div>
        )}

        {/* Step 2: Thread */}
        {mobileView === 'thread' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile thread top bar with back arrow */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
              <button
                onClick={() => setMobileView('list')}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-text-primary flex-1 truncate">
                {selectedConv?.sender_name || (isRTL ? 'المحادثة' : 'Conversation')}
              </span>
              {selectedConv && (
                <button
                  onClick={() => setMobileView('context')}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
                  title={isRTL ? 'سياق العميل' : 'Customer context'}
                >
                  <PanelRight size={16} />
                </button>
              )}
            </div>
            {selectedConv ? (
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AIStatusBar conv={selectedConv} isRTL={isRTL} />
                <MessageTimeline
                  messages={messages}
                  loading={loadingMsgs}
                  isRTL={isRTL}
                  selectedConv={selectedConv}
                  channelType={selectedConv.channel?.type}
                  reactToMessage={reactToMessage}
                  submitFeedback={submitFeedback}
                  onCorrectAI={handleCorrectAI}
                />
                <div className="flex-shrink-0 z-10 relative border-t border-border">
                  {showCopilot && (
                    <div className="absolute bottom-full left-0 right-0">
                      <AICopilot
                        conv={selectedConv}
                        isRTL={isRTL}
                        onInsertReply={(t) => setComposerInitialText(t)}
                        onClose={() => setShowCopilot(false)}
                      />
                    </div>
                  )}
                  <ChatComposer
                    channelType={selectedConv.channel?.type}
                    isRTL={isRTL}
                    onSendText={(text) => sendReply(selectedConv.id, text)}
                    onSendMedia={async (file, cap, type, voice) => {
                      const res = await sendMediaReply(selectedConv.id, file, cap, type, voice)
                      return res !== null
                    }}
                    disabled={sending}
                    initialText={composerInitialText}
                  />
                </div>
              </div>
            ) : (
              <EmptyThread />
            )}
          </div>
        )}

        {/* Step 3: Context — slides up as a bottom sheet on mobile */}
        {mobileView === 'context' && selectedConv && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
              <button
                onClick={() => setMobileView('thread')}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-text-primary">{isRTL ? 'معلومات العميل' : 'Customer Info'}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CustomerPanel
                conv={selectedConv}
                isRTL={isRTL}
                onClose={() => setMobileView('thread')}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
