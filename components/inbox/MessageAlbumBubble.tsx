'use client'

import React, { memo } from 'react'
import { Reply, Copy, MessageCircle } from 'lucide-react'
import { ApiMessage } from '../../hooks/useInbox'
import { TimelineClusterItem } from '../../lib/mediaClustering'
import MediaAlbumGrid from './MediaAlbumGrid'

interface MessageAlbumBubbleProps {
  cluster: TimelineClusterItem
  channelType?: string
  isRTL: boolean
  onReact?: (messageId: number, emoji: string) => void
  onReply?: (message: ApiMessage) => void
  conv?: {
    sender_name: string | null
    sender_email: string | null
    subject: string | null
  }
  onOpenMedia?: (messageId: number) => void
  quotedMessage?: { senderName: string; content: string } | null
}

function formatMsgTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return ''
  }
}

const MessageAlbumBubble = memo(function MessageAlbumBubble({
  cluster,
  channelType,
  isRTL,
  onReact,
  onReply,
  conv,
  onOpenMedia,
  quotedMessage,
}: MessageAlbumBubbleProps) {
  const primaryMsg = cluster.primaryMessage
  const canReact = channelType === 'whatsapp' && !!primaryMsg.whatsapp_message_id

  return (
    <div className="group flex w-full py-0.5 justify-start">
      <div className="flex max-w-[min(82%,44rem)] items-end gap-2 flex-row sm:max-w-[min(76%,46rem)]">
        <div className="relative min-w-0">
          <div className="inline-block w-fit max-w-full rounded-[1.1rem] rounded-es-sm border border-border/70 bg-surface-elevated p-2.5 text-[14.5px] leading-[1.55] tracking-[-0.003em] shadow-sm text-text-primary">
            {quotedMessage && (
              <div className="mb-2 rounded-lg border-s-2 border-brand/70 bg-black/5 px-2.5 py-1.5 text-start">
                <div className="truncate text-[10px] font-semibold text-brand">
                  {quotedMessage.senderName}
                </div>
                <div className="truncate text-[11px] opacity-75">
                  {quotedMessage.content || (isRTL ? 'رسالة مرفقة' : 'Attachment')}
                </div>
              </div>
            )}

            {/* Responsive Media Album Grid */}
            <MediaAlbumGrid
              messages={cluster.messages}
              onOpenMedia={onOpenMedia}
              isRTL={isRTL}
              caption={cluster.caption}
            />
          </div>

          {/* Timestamp footer */}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-text-secondary justify-start">
            <span>{formatMsgTime(cluster.created_at)}</span>
            <span className="text-[10px] text-text-tertiary">
              {cluster.messages.length} {isRTL ? 'صور' : 'photos'}
            </span>
          </div>
        </div>

        {/* Hover action toolbar */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(primaryMsg)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-brand"
              title={isRTL ? 'الرد على هذه الرسالة' : 'Reply to this message'}
              aria-label={isRTL ? 'الرد على هذه الرسالة' : 'Reply to this message'}
            >
              <Reply size={14} className={isRTL ? 'scale-x-[-1]' : ''} />
            </button>
          )}

          {cluster.caption && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(cluster.caption!)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary"
              title={isRTL ? 'نسخ النص' : 'Copy caption'}
              aria-label={isRTL ? 'نسخ النص' : 'Copy caption'}
            >
              <Copy size={14} />
            </button>
          )}

          {canReact && (
            <button
              type="button"
              onClick={() => onReact?.(primaryMsg.id, '❤')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary"
              title={isRTL ? 'تفاعل' : 'React'}
              aria-label={isRTL ? 'تفاعل' : 'React'}
            >
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

export default MessageAlbumBubble
