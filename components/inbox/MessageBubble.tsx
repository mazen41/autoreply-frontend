'use client'

import React, { useState, useRef, memo } from 'react'
import DOMPurify from 'dompurify'

interface MessageBubbleProps {
  msg: {
    id: number
    conversation_id: number
    content: string
    content_html?: string | null
    direction: 'inbound' | 'outbound'
    is_ai: boolean
    status: string
    created_at: string
    media_url?: string | null
    media_type?: 'image' | 'audio' | 'video' | 'document' | null
    whatsapp_message_id?: string | null
  }
  channelType?: string
  isRTL: boolean
  onReact?: (messageId: number, emoji: string) => void
  conv?: {
    sender_name: string | null
    sender_email: string | null
    subject: string | null
  }
  onSubmitFeedback?: (messageId: number, feedback: 'positive' | 'negative') => void
}

function absoluteMediaUrl(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiBase.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function EmailIframe({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(200)

  React.useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const resizeScript = `<script>
  function _sendH() {
    parent.postMessage({ type: 'iframe-height', height: document.documentElement.scrollHeight }, '*');
  }
  document.addEventListener('DOMContentLoaded', _sendH);
  window.addEventListener('load', _sendH);
  document.querySelectorAll('img').forEach(function(img) {
    img.addEventListener('load', _sendH);
    img.addEventListener('error', _sendH);
  });
  setTimeout(_sendH, 100);
  setTimeout(_sendH, 600);
<\/script>`

    const isFullDoc = /^\s*(<(!DOCTYPE|html)[^>]*>|<!DOCTYPE)/i.test(content.trim())
    let html: string
    if (isFullDoc) {
      html = content.includes('</body>')
        ? content.replace(/<\/body>/i, resizeScript + '</body>')
        : content + resizeScript
    } else {
      html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>body{margin:0;padding:16px;background:var(--surface);color:var(--text-primary);font-family:sans-serif}</style>
</head>
<body>${content}
${resizeScript}
</body>
</html>`
    }

    doc.open()
    doc.write(html)
    doc.close()
  }, [content])

  React.useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'iframe-height' && typeof e.data.height === 'number') {
        setHeight(Math.max(60, e.data.height + 8))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <iframe
      ref={iframeRef}
      title="Email Content"
      style={{ width: '100%', height, border: 'none', display: 'block', background: 'transparent', borderRadius: 8 }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    />
  )
}

const MessageBubble = memo(function MessageBubble({ 
  msg, 
  channelType, 
  isRTL, 
  onReact, 
  conv,
  onSubmitFeedback 
}: MessageBubbleProps) {
  const isIn = msg.direction === 'inbound'
  const [lightbox, setLightbox] = useState(false)

  const isWhatsApp = channelType === 'whatsapp'
  const isGmail = channelType === 'gmail'
  const canReact = isWhatsApp && !!msg.whatsapp_message_id
  const isAIMessage = msg.is_ai

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (onSubmitFeedback) {
      onSubmitFeedback(msg.id, feedback)
    }
  }

  // Gmail message rendering
  if (isGmail) {
    const hasHtml = !!(msg.content_html && msg.content_html.trim())
    const sanitizedHtml = hasHtml ? DOMPurify.sanitize(msg.content_html!) : null
    const senderName = conv?.sender_name || conv?.sender_email || 'Unknown'
    const subject = conv?.subject || '(No Subject)'
    const formattedDate = new Date(msg.created_at).toLocaleDateString('en-US', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    return (
      <div className="mb-4 w-full">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="bg-[var(--surface-elevated)] border-b border-[var(--divider)] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                {senderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] leading-none">{senderName}</div>
                <div className="text-[10px] text-[var(--text-secondary)] mt-1">{isIn ? 'to me' : 'from me'}</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">{formattedDate}</div>
          </div>
          <div className="p-5 text-sm text-[var(--text-primary)]">
            {subject && <div className="font-bold mb-3">{subject}</div>}
            {sanitizedHtml ? <EmailIframe content={sanitizedHtml} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
          </div>
        </div>
      </div>
    )
  }

  // Regular message rendering
  const mediaUrl = absoluteMediaUrl(msg.media_url)
  const hasMedia = !!mediaUrl && !!msg.media_type

  // Status indicator
  const statusIndicator = () => {
    if (msg.status === 'delivered') return <span className="text-[8px] text-emerald-400">✓✓</span>
    if (msg.status === 'sent') return <span className="text-[8px] text-[var(--text-tertiary)]">✓</span>
    if (msg.status === 'failed') return <span className="text-[8px] text-rose-400">✗</span>
    if (msg.status === 'pending') return <span className="text-[8px] text-[var(--text-tertiary)]">⟳</span>
    return null
  }

  return (
    <div className={`w-full flex ${isIn ? 'justify-start' : 'justify-end'} mb-4 group`}>
      <div className="max-w-[70%] flex items-end gap-2">
        
        {/* Message bubble */}
        <div className="relative">
          <div
            className={`border transition-all duration-150 ${
              isIn
                ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] rounded-[20px_20px_20px_4px]'
                : msg.is_ai
                ? 'bg-gradient-to-br from-accent to-[#8B3FFB] border-accent/20 text-white rounded-[20px_20px_4px_20px]'
                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] rounded-[20px_20px_4px_20px]'
            } ${hasMedia ? 'p-1.5' : 'px-4.5 py-3 text-xs leading-relaxed'}`}
          >
            {isAIMessage && (
              <div className="text-[8px] font-black uppercase tracking-wider text-accent/80 mb-1 flex items-center gap-1">
                ⚡ AI Drafted
              </div>
            )}
            
            {hasMedia && msg.media_type === 'image' && (
              <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightbox(true)}>
                <img src={mediaUrl} alt="attachment" className="max-w-full max-h-60 object-cover" />
              </div>
            )}
            
            {hasMedia && msg.media_type === 'audio' && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  ▶
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">Audio attachment</span>
              </div>
            )}
            
            {hasMedia && msg.media_type === 'video' && (
              <div className="rounded-xl overflow-hidden cursor-pointer">
                <video src={mediaUrl} controls className="max-w-full max-h-60 rounded-xl" />
              </div>
            )}
            
            {hasMedia && msg.media_type === 'document' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-elevated)]">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[var(--text-primary)] truncate">Document</div>
                  <div className="text-[8px] text-[var(--text-secondary)]">Tap to view</div>
                </div>
              </div>
            )}
            
            {!hasMedia && <div className="whitespace-pre-wrap">{msg.content}</div>}
          </div>

          <div className={`text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-2 ${isIn ? 'justify-start' : 'justify-end'}`}>
            <span>{formatMsgTime(msg.created_at)}</span>
            {!isIn && statusIndicator()}
            {isAIMessage && (
              <div className="flex items-center gap-1.5 ml-1">
                <button onClick={() => handleFeedback('positive')} className="hover:text-emerald-400 transition-colors" title="Helpful">👍</button>
                <button onClick={() => handleFeedback('negative')} className="hover:text-rose-400 transition-colors" title="Not helpful">👎</button>
              </div>
            )}
          </div>
        </div>

        {canReact && (
          <button
            onClick={() => {
              if (onReact) onReact(msg.id, '❤️')
            }}
            className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="React with ❤️"
          >
            ❤️
          </button>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={mediaUrl} alt="attachment fullsize" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
})

export default MessageBubble