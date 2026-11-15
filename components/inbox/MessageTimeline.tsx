'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { ApiMessage, ApiConversation } from '../../hooks/useInbox'
import MessageBubble from './MessageBubble'
import MessageAlbumBubble from './MessageAlbumBubble'
import MediaViewer, { type MediaViewerItem } from './MediaViewer'
import { absoluteMediaUrl } from '../../lib/mediaUrls'
import { clusterMessages, type TimelineItem } from '../../lib/mediaClustering'
import { ArrowDown } from 'lucide-react'

interface MessageTimelineProps {
  messages: ApiMessage[]
  loading: boolean
  isRTL: boolean
  selectedConv: ApiConversation
  channelType: string | undefined
  reactToMessage: (id: number, emoji: string) => void
  submitFeedback: (id: number, type: 'positive'|'negative') => void
  onCorrectAI: (id: number, draft: string, corr: string, type: string) => Promise<void>
  onReplyToMessage?: (message: ApiMessage) => void
  canDeleteWhatsAppMessages?: boolean
  onDeleteWhatsAppMessage?: (message: ApiMessage) => void
}

interface DateTimelineGroup {
  date: string
  items: TimelineItem[]
}

// Group messages by date
function groupMessages(messages: ApiMessage[]) {
  const groups: { date: string; messages: ApiMessage[] }[] = []
  let currentDate = ''

  messages.forEach(msg => {
    const d = new Date(msg.created_at)
    // Check if valid date
    if (isNaN(d.getTime())) return

    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

export default function MessageTimeline({
  messages, loading, isRTL, selectedConv, channelType,
  reactToMessage, submitFeedback, onCorrectAI, onReplyToMessage,
  canDeleteWhatsAppMessages = false, onDeleteWhatsAppMessage
}: MessageTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const lastMessageId = useRef<number | null>(null)

  const L = (en: string, ar: string) => isRTL ? ar : en

  // Group by date, then cluster consecutive inbound media into albums
  const grouped: DateTimelineGroup[] = useMemo(() => {
    const dateGroups = groupMessages(messages)
    return dateGroups.map(g => ({
      date: g.date,
      items: clusterMessages(g.messages),
    }))
  }, [messages])

  // Full-screen viewer: gather every image/sticker in this conversation, in
  // order, so prev/next can navigate across message boundaries.
  const imageItems: MediaViewerItem[] = useMemo(() => messages
    .filter(m => {
      if (m.metadata?.deleted_for_everyone === true) return false
      const mime = (m.mime_type || '').toLowerCase()
      return m.media_type === 'image' || mime.startsWith('image/') || (m.media_type === 'sticker' && mime.startsWith('image/')) || m.media_type === 'video' || mime.startsWith('video/')
    })
    .map(m => {
      const mime = (m.mime_type || '').toLowerCase()
      const isVid = m.media_type === 'video' || mime.startsWith('video/')
      return {
        id: m.id,
        directUrl: absoluteMediaUrl(m.media_url),
        isRemote: /^https?:\/\//i.test(m.media_url || ''),
        name: m.file_name || (isVid ? 'Video' : 'Image'),
        fileSize: m.file_size,
        kind: (isVid ? 'video' : 'image') as 'video' | 'image',
      }
    }), [messages])

  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const openMedia = (messageId: number) => {
    const idx = imageItems.findIndex(it => it.id === messageId)
    if (idx >= 0) setViewerIndex(idx)
  }

  // Scroll logic
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollDown(distanceToBottom > 150)
  }

  // Auto-scroll on new messages if we were already at bottom
  useEffect(() => {
    const isNewMessage = messages.length > 0 && messages[messages.length - 1].id !== lastMessageId.current
    if (isNewMessage) {
      lastMessageId.current = messages[messages.length - 1].id
      if (!showScrollDown) {
        scrollToBottom('smooth')
      }
    }
  }, [messages, showScrollDown])

  // Initial load scroll
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 50)
    }
  }, [loading, selectedConv.id])

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden p-6 space-y-6 bg-background flex flex-col justify-end">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`w-64 h-16 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-brand/10' : 'bg-surface-elevated'}`} />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-background flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-brand dark:bg-brand/20 flex items-center justify-center mb-4">
          <MessageBubbleIcon className="w-8 h-8 text-brand" />
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-1">
          {L('Start of conversation', 'بداية المحادثة')}
        </h3>
        <p className="text-xs text-text-tertiary max-w-[250px]">
          {L('Send a message to start chatting with this customer.', 'أرسل رسالة لبدء الدردشة مع هذا العميل.')}
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-h-0 bg-background">
      <div 
        ref={scrollRef}
        data-lenis-prevent
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {grouped.map(group => (
          <div key={group.date} className="space-y-4">
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-divider" />
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-2 py-1 rounded-full bg-surface">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-divider" />
            </div>
            
            <div className="space-y-2">
              {group.items.map(item => {
                if (item.type === 'cluster') {
                  const primaryMsg = item.primaryMessage
                  const localId = Number(primaryMsg.metadata?.reply_to_message_id)
                  const quoted = localId ? messages.find(c => c.id === localId) : null

                  return (
                    <MessageAlbumBubble
                      key={item.id}
                      cluster={item}
                      channelType={channelType}
                      isRTL={isRTL}
                      onReact={reactToMessage}
                      onReply={onReplyToMessage}
                      conv={selectedConv as any}
                      onOpenMedia={openMedia}
                      quotedMessage={quoted ? {
                        senderName: quoted.direction === 'inbound'
                          ? selectedConv.sender_name || L('Customer', 'العميل')
                          : L('You', 'أنت'),
                        content: quoted.content || '',
                      } : null}
                    />
                  )
                }

                const msg = item.message
                const localId = Number(msg.metadata?.reply_to_message_id)
                const quoted = localId ? messages.find(candidate => candidate.id === localId) : null

                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    channelType={channelType}
                    isRTL={isRTL}
                    onReact={reactToMessage}
                    onReply={onReplyToMessage}
                    canDeleteWhatsAppMessages={canDeleteWhatsAppMessages}
                    onDeleteWhatsAppMessage={onDeleteWhatsAppMessage}
                    quotedMessage={quoted ? {
                      senderName: quoted.direction === 'inbound'
                        ? selectedConv.sender_name || L('Customer', 'العميل')
                        : L('You', 'أنت'),
                      content: quoted.content || '',
                    } : null}
                    conv={selectedConv as any}
                    onSubmitFeedback={submitFeedback}
                    onCorrectAI={onCorrectAI}
                    onOpenMedia={openMedia}
                  />
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating scroll down button */}
      {showScrollDown && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface-elevated border border-border shadow-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-all z-10 animate-in fade-in slide-in-from-bottom-4"
        >
          <ArrowDown size={14} />
        </button>
      )}

      {viewerIndex !== null && (
        <MediaViewer
          items={imageItems}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          isRTL={isRTL}
        />
      )}
    </div>
  )
}

function MessageBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}
