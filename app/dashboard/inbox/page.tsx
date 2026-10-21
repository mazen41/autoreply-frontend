'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useInbox, type ApiMessage } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'

// Components
import ConversationList from '../../../components/inbox/ConversationList'
import ConversationHeader from '../../../components/inbox/ConversationHeader'
import AIStatusBar from '../../../components/inbox/AIStatusBar'
import MessageTimeline from '../../../components/inbox/MessageTimeline'
import ChatComposer from '../../../components/inbox/ChatComposer'
import AICopilot from '../../../components/inbox/AICopilot'
import CustomerPanel from '../../../components/inbox/CustomerPanel'
import HandoffTaskQueue from '../../../components/inbox/HandoffTaskQueue'
import { MessageSquare, PanelRight, MoreHorizontal, Ban, Trash2, Archive, Clock, Bot } from 'lucide-react'
import Select from '../../../components/ui/Select'

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
    toggleAi, updateConversationStatus, updateConversationBot, updateConversationBlockStatus, deleteConversation, deleteWhatsAppMessage, reactToMessage, submitFeedback,
    getConversationTags, addTag, removeTag
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
  const [replyToMessage, setReplyToMessage] = useState<ApiMessage | null>(null)
  const [creatingFeedbackLink, setCreatingFeedbackLink] = useState(false)
  const [feedbackNotice, setFeedbackNotice] = useState('')
  const [bots, setBots] = useState<Array<{ id: number; name: string; status: string; channel_ids: number[] }>>([])
  const [channels, setChannels] = useState<Array<{ id: number; type: string; page_name: string | null; page_id?: string | null }>>([])
  const [isUpdatingBot, setIsUpdatingBot] = useState(false)
  const [isDeletingConversation, setIsDeletingConversation] = useState(false)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)

  // Fetch bots and channels for filters — untouched API logic
  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch(`${API}/api/bots`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data?.bots)) {
          setBots(data.bots.map((bot: { id: number; name: string; status?: string; channels?: Array<{ id: number }> }) => ({
            id: bot.id,
            name: bot.name,
            status: bot.status ?? 'inactive',
            channel_ids: Array.isArray(bot.channels) ? bot.channels.map(channel => channel.id) : [],
          })))
        }
      })
      .catch(() => {})

    fetch(`${API}/api/channels`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
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

  const requestCustomerFeedback = useCallback(async () => {
    if (!selectedConv) return
    setCreatingFeedbackLink(true); setFeedbackNotice('')
    try {
      const response = await fetch(`${API}/api/conversations/${selectedConv.id}/csat-survey`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not create a feedback link.')
      const feedbackUrl = `${window.location.origin}/feedback/${body.token}`
      setComposerInitialText(`Thanks for chatting with us. Please share quick feedback: ${feedbackUrl}`)
      setFeedbackNotice('Feedback link added to the reply box. Review and send it using the normal channel reply controls.')
    } catch (cause) {
      setFeedbackNotice(cause instanceof Error ? cause.message : 'Could not create a feedback link.')
    } finally { setCreatingFeedbackLink(false) }
  }, [selectedConv])

  // Update copilot visibility — untouched logic
  useEffect(() => {
    if (selectedConv?.ai_enabled) setShowCopilot(true)
    else setShowCopilot(false)
    setReplyToMessage(null)
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
    // Conversation-level assignment is intentionally independent of a bot's
    // channel-wide assignment. The backend still validates business ownership.
    return bots.filter(bot => bot.status.toLowerCase() === 'active')
  }, [bots, selectedConv?.channel?.id])

  const handleBlockChange = useCallback(async (blocked: boolean) => {
    if (!selectedConv) return
    if (blocked && !window.confirm(isRTL
      ? 'هل تريد حظر جهة الاتصال هذه على واتساب؟ لن تتمكن من مراسلتك من هذا الرقم.'
      : 'Block this WhatsApp contact? They will no longer be able to message this number.')) return
    const success = await updateConversationBlockStatus(selectedConv.id, blocked)
    if (!success) window.alert(isRTL ? 'تعذر تحديث حالة الحظر.' : 'Could not update the contact block status.')
  }, [isRTL, selectedConv, updateConversationBlockStatus])

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedConv || isDeletingConversation) return
    if (!window.confirm(isRTL
      ? 'حذف هذه المحادثة من صندوق الوارد؟ ستُحفظ السجلات ويمكن استعادتها من النظام.'
      : 'Remove this conversation from the inbox? Its records are retained and can be recovered by an administrator.')) return
    setIsDeletingConversation(true)
    const success = await deleteConversation(selectedConv.id)
    setIsDeletingConversation(false)
    if (!success) window.alert(isRTL ? 'تعذر حذف المحادثة.' : 'Could not delete the conversation.')
  }, [deleteConversation, isDeletingConversation, isRTL, selectedConv])

  const handleDeleteWhatsAppMessage = useCallback(async (message: ApiMessage) => {
    if (!window.confirm(isRTL
      ? 'حذف هذه الرسالة للجميع؟'
      : 'Delete this message for everyone?')) return
    const success = await deleteWhatsAppMessage(message.id)
    if (!success) window.alert(isRTL
      ? 'تعذر حذف الرسالة للجميع.'
      : 'Could not delete this message for everyone.')
  }, [deleteWhatsAppMessage, isRTL])

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
            onRequestFeedback={() => void requestCustomerFeedback()}
            isCreatingFeedbackLink={creatingFeedbackLink}
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
            onBlockChange={handleBlockChange}
            onDeleteConversation={handleDeleteConversation}
            isDeletingConversation={isDeletingConversation}
          />

          {feedbackNotice && <p role="status" className="border-b border-border bg-surface px-3 py-2 text-xs text-text-secondary">{feedbackNotice}</p>}

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
            onReplyToMessage={setReplyToMessage}
            canDeleteWhatsAppMessages={!!selectedConv.can_delete_messages}
            onDeleteWhatsAppMessage={handleDeleteWhatsAppMessage}
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
              onSendText={(text, replyToId) => sendReply(selectedConv.id, text, replyToId)}
              onSendMedia={async (file, cap, type, voice) => {
                const res = await sendMediaReply(selectedConv.id, file, cap, type, voice)
                return res !== null
              }}
              disabled={sending}
              initialText={composerInitialText}
              replyTo={replyToMessage ? {
                id: replyToMessage.id,
                senderName: replyToMessage.direction === 'inbound'
                  ? selectedConv.sender_name || (isRTL ? 'العميل' : 'Customer')
                  : (isRTL ? 'أنت' : 'You'),
                content: replyToMessage.content,
                mediaType: replyToMessage.media_type,
              } : null}
              onClearReply={() => setReplyToMessage(null)}
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
          <div className="flex flex-shrink-0 h-full flex-col overflow-hidden" style={{ width: 280 }}>
            <HandoffTaskQueue onSelect={handleSelectConversation} onResolved={() => fetchConversations()} />
            <div className="min-h-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              loading={loadingConvs}
              error={error}
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
              getConversationTags={getConversationTags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
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
                getConversationTags={getConversationTags}
                onAddTag={addTag}
                onRemoveTag={removeTag}
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
            <HandoffTaskQueue onSelect={handleSelectConversation} onResolved={() => fetchConversations()} />
            <div className="min-h-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              loading={loadingConvs}
              error={error}
              isRTL={isRTL}
              onSelect={handleSelectConversation}
              onRefresh={() => fetchConversations()}
              onFilterChange={handleFilterChange}
              collapsed={false}
              bots={bots}
              channels={channels}
            />
            </div>
          </div>
        )}

        {/* Step 2: Thread */}
        {mobileView === 'thread' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile thread top bar with back arrow */}
            <div dir={isRTL ? 'rtl' : 'ltr'} className="relative flex items-center gap-2 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
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
                <>
                  <div className="w-28 shrink-0">
                    <Select
                      id={`mobile-conversation-${selectedConv.id}-bot`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      ariaLabel={isRTL ? 'تعيين بوت للمحادثة' : 'Assign a bot to this conversation'}
                      value={selectedConv.bot_id ? String(selectedConv.bot_id) : ''}
                      onValueChange={value => void handleBotChange(value ? Number(value) : null)}
                      options={[
                        { value: '', label: isRTL ? 'بدون بوت' : 'No bot', icon: <Bot size={12} /> },
                        ...availableBotsForConv.map(bot => ({ value: String(bot.id), label: bot.name, icon: <Bot size={12} /> })),
                      ]}
                      disabled={isUpdatingBot}
                      size="sm"
                      className="w-full"
                      triggerClassName="h-8 rounded-lg bg-surface px-2 text-[10px]"
                    />
                  </div>
                  <button
                    onClick={() => setMobileActionsOpen(open => !open)}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
                    aria-label={isRTL ? 'إجراءات المحادثة' : 'Conversation actions'}
                  ><MoreHorizontal size={16} /></button>
                  <button
                    onClick={() => setMobileView('context')}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
                    title={isRTL ? 'سياق العميل' : 'Customer context'}
                  ><PanelRight size={16} /></button>
                  {mobileActionsOpen && (
                    <div className="absolute end-3 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl">
                      <button type="button" onClick={() => { void updateConversationStatus(selectedConv.id, 'pending'); setMobileActionsOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-xs text-text-secondary hover:bg-surface"><Clock size={13} />{isRTL ? 'تأجيل' : 'Snooze'}</button>
                      <button type="button" onClick={() => { void updateConversationStatus(selectedConv.id, selectedConv.status === 'closed' ? 'open' : 'closed'); setMobileActionsOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-xs text-text-secondary hover:bg-surface"><Archive size={13} />{isRTL ? (selectedConv.status === 'closed' ? 'إعادة فتح المحادثة' : 'أرشفة المحادثة') : (selectedConv.status === 'closed' ? 'Reopen conversation' : 'Archive conversation')}</button>
                      {selectedConv.can_block_contact && <button type="button" onClick={() => { void handleBlockChange(!selectedConv.is_blocked); setMobileActionsOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-xs text-text-secondary hover:bg-surface"><Ban size={13} />{isRTL ? (selectedConv.is_blocked ? 'إلغاء الحظر' : 'حظر جهة الاتصال') : (selectedConv.is_blocked ? 'Unblock contact' : 'Block contact')}</button>}
                      <button type="button" disabled={isDeletingConversation} onClick={() => { void handleDeleteConversation(); setMobileActionsOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-xs text-error hover:bg-surface disabled:opacity-50"><Trash2 size={13} />{isRTL ? 'حذف المحادثة' : 'Delete conversation'}</button>
                    </div>
                  )}
                </>
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
                  onReplyToMessage={setReplyToMessage}
                  canDeleteWhatsAppMessages={!!selectedConv.can_delete_messages}
                  onDeleteWhatsAppMessage={handleDeleteWhatsAppMessage}
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
                    onSendText={(text, replyToId) => sendReply(selectedConv.id, text, replyToId)}
                    onSendMedia={async (file, cap, type, voice) => {
                      const res = await sendMediaReply(selectedConv.id, file, cap, type, voice)
                      return res !== null
                    }}
                    disabled={sending}
                    initialText={composerInitialText}
                    replyTo={replyToMessage ? {
                      id: replyToMessage.id,
                      senderName: replyToMessage.direction === 'inbound'
                        ? selectedConv.sender_name || (isRTL ? 'العميل' : 'Customer')
                        : (isRTL ? 'أنت' : 'You'),
                      content: replyToMessage.content,
                      mediaType: replyToMessage.media_type,
                    } : null}
                    onClearReply={() => setReplyToMessage(null)}
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
                getConversationTags={getConversationTags}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
