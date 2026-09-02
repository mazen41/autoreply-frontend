'use client'

import React, { useState, useEffect, useCallback } from 'react'
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

export default function InboxPage() {
  const { isRTL } = useLang()
  const {
    conversations, messages, selectedId, selectedConv,
    loadingConvs, loadingMsgs, sending, error,
    fetchConversations, selectConversation, sendReply, sendMediaReply,
    toggleAi, updateConversationStatus, reactToMessage, submitFeedback
  } = useInbox()

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [showCopilot, setShowCopilot] = useState(false)
  const [composerInitialText, setComposerInitialText] = useState('')

  // Handle window resize for responsive panels
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setRightCollapsed(true)
      }
      if (window.innerWidth < 768) {
        setLeftCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update copilot visibility based on selected conversation
  useEffect(() => {
    if (selectedConv?.ai_enabled) setShowCopilot(true)
    else setShowCopilot(false)
  }, [selectedId, selectedConv?.ai_enabled])

  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    fetchConversations(false, filters)
  }, [fetchConversations])

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

  return (
    <div className="flex w-full h-full bg-[var(--background)] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* ── Left Panel: List ── */}
      {!leftCollapsed && (
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          loading={loadingConvs}
          isRTL={isRTL}
          onSelect={selectConversation}
          onRefresh={() => fetchConversations()}
          onFilterChange={handleFilterChange}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(v => !v)}
        />
      )}
      {leftCollapsed && (
        <div className="flex flex-col items-center py-3 w-14 border-r border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <button 
            onClick={() => setLeftCollapsed(false)}
            className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
            title={isRTL ? 'توسيع القائمة' : 'Expand list'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
        </div>
      )}

      {/* ── Center Panel: Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        {selectedConv ? (
          <>
            <ConversationHeader
              conv={selectedConv}
              isRTL={isRTL}
              onToggleAI={() => toggleAi(selectedConv.id)}
              onStatusChange={(s) => updateConversationStatus(selectedConv.id, s)}
              onToggleLeftPanel={() => setLeftCollapsed(v => !v)}
              onToggleRightPanel={() => setRightCollapsed(v => !v)}
              leftCollapsed={leftCollapsed}
              rightCollapsed={rightCollapsed}
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

            <div className="flex-shrink-0 z-10 relative">
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
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-tertiary)] bg-[var(--surface)]">
            <svg className="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm">{isRTL ? 'حدد محادثة للبدء' : 'Select a conversation to start'}</p>
          </div>
        )}
      </div>

      {/* ── Right Panel: Customer ── */}
      {!rightCollapsed && selectedConv && (
        <CustomerPanel
          conv={selectedConv}
          isRTL={isRTL}
          onClose={() => setRightCollapsed(true)}
        />
      )}
    </div>
  )
}
