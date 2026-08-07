'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInbox, ApiConversation, ApiMessage } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import ReactionPicker from '../../../components/inbox/ReactionPicker'
import { Download, FileText, Mic, Paperclip, Pause, Send, SmilePlus, Trash2, Video, X } from 'lucide-react'
import DOMPurify from 'dompurify'

function channelMeta(type: string) {
  if (type === 'facebook')  return { label: 'FB',  color: 'var(--accent)', glow: 'var(--accent-focus)' }
  if (type === 'instagram') return { label: 'IG',  color: 'var(--accent)', glow: 'var(--accent-focus)' }
  if (type === 'gmail')     return { label: 'GM',  color: 'var(--accent)', glow: 'var(--accent-focus)'  }
  if (type === 'whatsapp') return { label: 'WA',  color: 'var(--accent)', glow: 'var(--accent-focus)' }
  return { label: '??', color: 'var(--text-secondary)', glow: 'var(--border)' }
}

function senderLabel(conv: ApiConversation) {
  if (conv.sender_name && conv.sender_name.trim()) return conv.sender_name.trim()
  if (conv.sender_email) return conv.sender_email
  return `Â·Â·Â·${conv.sender_id.slice(-4)}`
}

function senderInitial(conv: ApiConversation) {
  return senderLabel(conv).charAt(0).toUpperCase()
}

function formatTimestamp(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffH < 24)   return `${diffH}h`
  if (diffD < 7)    return `${diffD}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function absoluteMediaUrl(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiBase.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}

function formatFileSize(size?: number | null) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function mediaTypeFromFile(file: File): 'image' | 'audio' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

// Helper function to safely render HTML content (for Gmail emails).
//
// `contentHtml` is the real HTML body extracted server-side from the
// email's text/html MIME part (see GmailController::extractHtmlBody).
// `content` is always plain text and is only used as a display fallback
// (e.g. for emails that genuinely have no HTML part, or messages synced
// before content_html existed).
function renderHtmlContent(content: string, channelType?: string, contentHtml?: string | null) {
  const htmlSource = contentHtml && contentHtml.trim() ? contentHtml : null

  // Preferred path: a real HTML body came back from the API.
  if (channelType === 'gmail' && htmlSource) {
    const sanitizedContent = DOMPurify.sanitize(htmlSource, {
      ALLOWED_TAGS: ['*'],
      ALLOWED_ATTR: ['*'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: true,
      WHOLE_DOCUMENT: true,
    })
    return <EmailIframe content={sanitizedContent} />
  }

  // Fallback for Gmail messages synced before `content_html` existed, where
  // the plain-text `content` field happens to still contain raw markup.
  if (channelType === 'gmail' && !htmlSource && content && content.includes('<') && /<\/?[a-z][\s\S]*>/i.test(content)) {
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['*'],
      ALLOWED_ATTR: ['*'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: true,
      WHOLE_DOCUMENT: true,
    })
    return <EmailIframe content={sanitizedContent.toString()} />
  }

  // For non-Gmail or plain text content, render as-is
  return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{content}</div>
}

// Renders email HTML in a sandboxed auto-sizing iframe — exactly like Gmail does.
// Handles both full HTML documents (with <html><head>...) and body-only fragments.
function EmailIframe({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(200)

  useEffect(() => {
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

    // If the email is already a full HTML document, inject the resize script
    // just before </body> rather than double-wrapping it.
    const isFullDoc = /^\s*(<(!DOCTYPE|html)[^>]*>|<!DOCTYPE)/i.test(content.trim())
    let html: string
    if (isFullDoc) {
      html = content.includes('</body>')
        ? content.replace(/<\/body>/i, resizeScript + '</body>')
        : content + resizeScript
    } else {
      // Body fragment — wrap in a minimal document with no opinionated styles
      // so the email's own CSS is 100% in charge of the layout (just like Gmail).
      html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{margin:0;padding:0}</style>
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

  useEffect(() => {
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
      style={{ width: '100%', height, border: 'none', display: 'block', background: '#fff', borderRadius: 4 }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
    />
  )
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
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-surface-elevated flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-surface-elevated rounded w-1/2 mb-2" />
        <div className="h-2 bg-surface-elevated/70 rounded w-5/6" />
      </div>
    </div>
  )
}

function ConvRow({ conv, active, onClick, onToggleAi }: { conv: ApiConversation; active: boolean; onClick: () => void; onToggleAi: (id: number) => void }) {
  const ch = channelMeta(conv.channel?.type)
  const preview = conv.latest_message?.content ?? conv.subject ?? '—'
  const isAI = conv.latest_message?.is_ai

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/60 text-left transition-all duration-300 relative group cursor-pointer ${
        active
          ? 'bg-accent/10 border-l-2 border-l-accent'
          : 'bg-transparent border-l-2 border-l-transparent hover:bg-surface-elevated/40'
      }`}
    >
      <div className="relative flex-shrink-0">
        <ChannelIcon type={(conv.channel?.type || 'facebook') as any} size={40} className="rounded-xl border border-border" />
        {/* Live / Status Indicator */}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-surface-elevated flex items-center justify-center border border-background">
          <div className="w-2 h-2 rounded-full bg-emerald-500 status-live" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-bold text-text-primary truncate">
            {senderLabel(conv)}
          </span>
          <span className="text-[10px] text-text-tertiary flex-shrink-0">
            {formatTimestamp(conv.last_message_at)}
          </span>
        </div>
        {conv.subject && conv.channel?.type === 'gmail' && (
          <div className="text-[11px] text-text-secondary mb-1 truncate italic">
            {conv.subject}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {isAI && <span className="text-[10px] text-accent font-bold">⚡ AI</span>}
            <span className="text-xs text-text-secondary truncate flex-1">
              {preview}
            </span>
          </div>
          {conv.ai_enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 shadow-sm shadow-accent/50 animate-pulse" />
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleAi(conv.id) }}
        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all duration-300 flex-shrink-0 ${
          conv.ai_enabled
            ? 'bg-accent/15 border-accent/30 text-accent hover:bg-accent/25'
            : 'bg-surface-elevated border-border text-text-tertiary hover:border-accent/40 hover:text-text-secondary'
        }`}
        title={conv.ai_enabled ? 'Disable AI for this conversation' : 'Enable AI for this conversation'}
      >
        <span className="flex items-center gap-1">
          {conv.ai_enabled ? '✓' : '○'} AI
        </span>
      </button>
    </motion.button>
  )
}

function MsgBubble({ msg, channelType, isRTL, onReact, conv }: { msg: ApiMessage; channelType?: string; isRTL: boolean; onReact?: (messageId: number, emoji: string) => void; conv?: ApiConversation }) {
  const isIn = msg.direction === 'inbound'
  const [showPicker, setShowPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const [lightbox, setLightbox] = useState(false)
  const reactButtonRef = useRef<HTMLButtonElement>(null)

  const isWhatsApp = channelType === 'whatsapp'
  const isGmail = channelType === 'gmail'
  const canReact = isWhatsApp && !!msg.whatsapp_message_id

  // Gmail emails render as full-width cards, not chat bubbles
  if (isGmail) {
    const hasHtml = !!(msg.content_html && msg.content_html.trim())
    const sanitizedHtml = hasHtml
      ? DOMPurify.sanitize(msg.content_html!, {
          ALLOWED_TAGS: ['*'],
          ALLOWED_ATTR: ['*'],
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
          ALLOW_DATA_ATTR: true,
          WHOLE_DOCUMENT: true,
        })
      : null

    const senderName = conv?.sender_name || conv?.sender_email || 'Unknown'
    const subject = conv?.subject || '(No Subject)'
    const formattedDate = new Date(msg.created_at).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="mb-4 w-full"
      >
        <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/10">
          {/* Email header */}
          <div className="bg-surface border-b border-border/60 px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm border border-accent/15">
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary leading-none">
                    {senderName}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-1">
                    {isIn ? (isRTL ? 'إلي' : 'to me') : (isRTL ? 'مني' : 'from me')}
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-tertiary sm:text-right">
                {formattedDate}
              </div>
            </div>
            {subject && (
              <div className="text-sm font-bold text-text-primary mt-2">
                {subject}
              </div>
            )}
          </div>

          {/* Email body */}
          <div className="p-5 bg-white text-gray-900 rounded-b-2xl">
            {sanitizedHtml ? (
              <EmailIframe content={sanitizedHtml} />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const openPicker = () => {
    if (!canReact || !reactButtonRef.current) return
    const rect = reactButtonRef.current.getBoundingClientRect()
    const pickerWidth = 292
    setPickerPosition({
      x: Math.min(Math.max(12, rect.left - pickerWidth / 2 + rect.width / 2), window.innerWidth - pickerWidth - 12),
      y: Math.max(12, rect.top - 54),
    })
    setShowPicker(true)
  }

  const handleReact = (emoji: string) => {
    if (onReact) onReact(msg.id, emoji)
  }

  const reactions = msg.reactions || []
  const uniqueReactions = reactions.filter((r, i, a) => a.findIndex(b => b.emoji === r.emoji) === i)
  const mediaUrl = absoluteMediaUrl(msg.media_url)
  const hasMedia = !!mediaUrl && !!msg.media_type

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      className={`w-full flex ${isIn ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div
        className={`max-w-[75%] sm:max-w-[65%] flex items-end gap-2 group/msg ${
          isIn ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        {canReact && (
          <button
            ref={reactButtonRef}
            onClick={openPicker}
            title={isRTL ? 'تفاعل' : 'React'}
            className="w-7 h-7 rounded-full border border-border bg-surface-elevated text-text-secondary hover:text-text-primary flex items-center justify-center flex-shrink-0 cursor-pointer opacity-0 group-hover/msg:opacity-100 transition-all duration-200"
          >
            <SmilePlus size={14} />
          </button>
        )}

        <div className="relative">
          <div
            className={`transition-all duration-200 border ${
              isIn
                ? 'bg-surface border-border text-text-primary shadow-sm rounded-[18px_18px_18px_4px]'
                : msg.is_ai
                ? 'bg-gradient-to-br from-accent to-accent-end border-accent/20 text-white shadow-md shadow-accent/10 rounded-[18px_18px_4px_18px]'
                : 'bg-accent border-accent/20 text-white shadow-md shadow-accent/15 rounded-[18px_18px_4px_18px]'
            } ${hasMedia ? 'p-1.5' : 'px-4 py-2.5 text-sm leading-relaxed'}`}
            onContextMenu={(e) => { e.preventDefault(); openPicker() }}
          >
            {hasMedia && msg.media_type === 'image' && (
              <button onClick={() => setLightbox(true)} className="block p-0 border-none background-transparent cursor-zoom-in overflow-hidden rounded-xl">
                <img src={mediaUrl} alt={msg.file_name || 'WhatsApp image'} className="block w-full max-w-[340px] max-h-[300px] object-cover transition-transform duration-300 hover:scale-105" />
              </button>
            )}

            {hasMedia && msg.media_type === 'audio' && (
              <div className="w-[280px] p-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-accent">
                    <Mic size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-6 flex items-center gap-1 overflow-hidden">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="w-[3px] rounded-full bg-text-tertiary" style={{ height: `${4 + ((i * 5) % 16)}px` }} />
                      ))}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-1">{formatDuration(msg.duration) || (isRTL ? 'تسجيل صوتي' : 'Voice note')}</div>
                  </div>
                </div>
                <audio controls src={mediaUrl} className="w-full h-8 opacity-90" />
              </div>
            )}

            {hasMedia && msg.media_type === 'video' && (
              <div className="overflow-hidden rounded-xl">
                <video controls src={mediaUrl} className="block w-full max-w-[340px] max-h-[300px] bg-black" />
              </div>
            )}

            {hasMedia && msg.media_type === 'document' && (
              <a
                href={mediaUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 text-inherit no-underline rounded-xl bg-surface-elevated/40 border border-border/50 hover:bg-surface-elevated transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 text-accent">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate text-text-primary">{msg.file_name || (isRTL ? 'ملف' : 'Document')}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{formatFileSize(msg.file_size) || msg.mime_type || ''}</div>
                </div>
                <Download size={16} className="text-text-secondary flex-shrink-0" />
              </a>
            )}

            {msg.content && <div className={`${hasMedia ? 'p-2 text-sm leading-relaxed' : ''}`}>{renderHtmlContent(msg.content, channelType, msg.content_html)}</div>}

            {uniqueReactions.length > 0 && (
              <div className="absolute -bottom-2 right-2 flex gap-1 items-center bg-surface border border-border rounded-full px-2 py-0.5 shadow-md z-10 text-[11px] animate-scale-in">
                {uniqueReactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 px-1 justify-end">
            {!isIn && msg.is_ai && <span className="text-[9px] text-accent font-bold uppercase tracking-wider">AI</span>}
            {!isIn && !msg.is_ai && <span className="text-[9px] text-text-secondary font-semibold uppercase tracking-wider">{isRTL ? 'يدوي' : 'manual'}</span>}
            <span className="text-[10px] text-text-tertiary">{formatMsgTime(msg.created_at)}</span>
          </div>
        </div>
      </div>

      {showPicker && canReact && <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} position={pickerPosition} />}

      <AnimatePresence>
        {lightbox && msg.media_type === 'image' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'color-mix(in srgb, var(--text-primary) 88%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <img src={mediaUrl} alt={msg.file_name || 'WhatsApp image'} style={{ maxWidth: '96vw', maxHeight: '92vh', borderRadius: 8, objectFit: 'contain' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'facebook', label: 'FB' },
  { id: 'instagram', label: 'IG' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

export default function InboxPage() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const {
    conversations, messages, selectedId, selectedConv,
    loadingConvs, loadingMsgs, sending, error,
    fetchConversations, selectConversation, sendReply, sendMediaReply, toggleAi, reactToMessage,
  } = useInbox()

  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [reply, setReply]           = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [optimistic, setOptimistic] = useState<ApiMessage[]>([])
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list')
  const [toast, setToast]           = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, optimistic])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) } }, [toast])
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  const allMessages = [...messages, ...optimistic]
  const grouped = groupMessagesByDate(allMessages)
  const filtered = conversations.filter(c => {
    const matchType = filter === 'all' || c.channel?.type === filter
    const q = search.toLowerCase()
    return matchType && (!q || senderLabel(c).toLowerCase().includes(q) || (c.subject ?? '').toLowerCase().includes(q) || (c.latest_message?.content ?? '').toLowerCase().includes(q))
  })

  function handleSelect(id: number) {
    setOptimistic([])
    clearSelectedFile()
    selectConversation(id)
    setMobilePane('chat')
  }

  function clearSelectedFile() {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFilePicked(file: File | null) {
    clearSelectedFile()
    if (!file) return
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }

  async function handleSend() {
    if (!selectedId) return
    if (selectedFile) {
      const mediaType = mediaTypeFromFile(selectedFile)
      const uploaded = await sendMediaReply(selectedId, selectedFile, reply.trim(), mediaType, selectedFile.type.startsWith('audio/'))
      if (!uploaded) {
        setToast(isRTL ? 'تعذر إرسال الملف. حاول مرة أخرى.' : 'Failed to send media. Try again.')
        return
      }
      setReply('')
      clearSelectedFile()
      return
    }

    if (!reply.trim()) return
    const text = reply.trim()
    setReply('')
    const temp: ApiMessage = { id: Date.now(), conversation_id: selectedId, content: text, direction: 'outbound', is_ai: false, status: 'manual', created_at: new Date().toISOString() }
    setOptimistic(p => [...p, temp])
    const ok = await sendReply(selectedId, text)
    if (!ok) { setOptimistic(p => p.filter(m => m.id !== temp.id)); setReply(text); setToast(isRTL ? 'تعذر الإرسال. حاول مرة أخرى.' : 'Failed to send. Try again.') }
    else setOptimistic([])
  }

  async function toggleRecording() {
    if (isRecording) {
      recorderRef.current?.stop()
      recorderRef.current?.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type })
        handleFilePicked(file)
      }
      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setToast(isRTL ? 'تعذر تشغيل الميكروفون.' : 'Could not start microphone.')
    }
  }

  const ch = selectedConv ? channelMeta(selectedConv.channel?.type) : null

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden relative border-t border-border/80">
      {/* LEFT: conversation list */}
      <div
        className={`w-80 border-r border-border/60 bg-surface flex flex-col flex-shrink-0 transition-all duration-300 relative z-20 ${
          mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/60 bg-surface-elevated/40 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              {t.inbox.title}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/25">
              {filtered.length} {isRTL ? 'محادثات' : 'chats'}
            </span>
          </div>

          {/* Filters Row */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer flex-shrink-0 border ${
                  filter === f.id
                    ? 'bg-accent border-accent text-white shadow-md shadow-accent/15'
                    : 'bg-surface-elevated/60 text-text-secondary border-border/50 hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث...' : 'Search...'}
              className="w-full bg-surface-elevated border border-border/70 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/20 scrollbar-thin">
          {loadingConvs ? (
            <div className="p-2 space-y-1">
              {[1, 2, 3, 4, 5].map(i => <ConvSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-tertiary">
              {search ? t.inbox.noResults : t.inbox.noConversations}
            </div>
          ) : (
            filtered.map(conv => (
              <ConvRow
                key={conv.id}
                conv={conv}
                active={selectedId === conv.id}
                onClick={() => handleSelect(conv.id)}
                onToggleAi={toggleAi}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT: chat view */}
      <div
        className={`flex-1 flex flex-col bg-background relative z-10 transition-all duration-300 ${
          mobilePane === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background relative">
            {/* Control panel background matrix */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="flex flex-col items-center max-w-sm relative z-10 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-accent-subtle/30 flex items-center justify-center text-accent mb-4 border border-accent/20">
                <Send size={24} className="opacity-80" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                {isRTL ? 'لوحة التحكم بالمحادثات' : 'Control Center'}
              </h3>
              <p className="text-xs text-text-tertiary leading-relaxed px-4">
                {t.inbox.selectConversation}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-6 py-3.5 border-b border-border/60 bg-surface/30 backdrop-blur-md flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobilePane('list')}
                  className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                  style={{ cursor: 'pointer' }}
                >
                  ←
                </button>
                <div className="relative flex-shrink-0">
                  <ChannelIcon type={(selectedConv.channel?.type || 'facebook') as any} size={40} className="rounded-xl border border-border" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate">
                    {senderLabel(selectedConv)}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="capitalize">{ch?.label}</span>
                    <span>•</span>
                    <span>{isRTL ? 'نشط الآن' : 'Active'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleAi(selectedConv.id)}
                className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                  selectedConv.ai_enabled
                    ? 'bg-accent/15 border-accent/30 text-accent shadow-sm shadow-accent/10'
                    : 'bg-surface-elevated border-border text-text-tertiary hover:border-accent/40'
                }`}
                title={selectedConv.ai_enabled ? 'Disable AI for this conversation' : 'Enable AI for this conversation'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.ai_enabled ? 'bg-accent animate-pulse' : 'bg-text-tertiary'}`} />
                <span>AI {selectedConv.ai_enabled ? (isRTL ? 'مفعّل' : 'Active') : (isRTL ? 'معطل' : 'Disabled')}</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin bg-background/50">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-tertiary">
                  {t.inbox.noMessages}
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date} className="space-y-4">
                    <div className="flex items-center gap-4 my-2">
                      <div className="flex-1 h-px bg-border/20" />
                      <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">
                        {group.date}
                      </div>
                      <div className="flex-1 h-px bg-border/20" />
                    </div>
                    {group.messages.map(msg => (
                      <MsgBubble
                        key={msg.id}
                        msg={msg}
                        channelType={selectedConv?.channel?.type}
                        isRTL={isRTL}
                        onReact={reactToMessage}
                        conv={selectedConv}
                      />
                    ))}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Container */}
            <div className="p-4 border-t border-border/60 bg-surface/40 backdrop-blur-md">
              {selectedFile && (
                <div className="mb-3 p-3 rounded-2xl bg-surface border border-border/70 flex items-center gap-3 animate-slide-up">
                  <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center overflow-hidden flex-shrink-0 text-accent">
                    {mediaTypeFromFile(selectedFile) === 'image' && filePreview ? (
                      <img src={filePreview} alt={selectedFile.name} className="w-full h-full object-cover" />
                    ) : mediaTypeFromFile(selectedFile) === 'video' ? (
                      <Video size={20} />
                    ) : mediaTypeFromFile(selectedFile) === 'audio' ? (
                      <Mic size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-primary truncate">{selectedFile.name}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <button
                    onClick={clearSelectedFile}
                    title={isRTL ? 'إلغاء' : 'Cancel'}
                    className="w-8 h-8 rounded-full border border-border bg-surface-elevated text-text-secondary hover:text-rose-500 hover:border-rose-500/30 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 bg-surface-elevated/70 border border-border/70 focus-within:border-accent/40 rounded-2xl p-1.5 transition-all duration-200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                  onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  title={isRTL ? 'إرفاق ملف' : 'Attach file'}
                  className={`p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer`}
                >
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={toggleRecording}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  title={isRecording ? (isRTL ? 'إيقاف التسجيل' : 'Stop recording') : (isRTL ? 'تسجيل صوت' : 'Record voice note')}
                  className={`p-2.5 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25 animate-pulse'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {isRecording ? <Pause size={16} /> : <Mic size={16} />}
                </button>
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={selectedFile ? (isRTL ? 'أضف تعليقاً...' : 'Add a caption...') : (isRTL ? 'اكتب رسالتك...' : 'Type your message...')}
                  disabled={sending}
                  className="flex-1 bg-transparent border-none text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-0 px-2 py-1"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!reply.trim() && !selectedFile)}
                  className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                    sending || (!reply.trim() && !selectedFile)
                      ? 'bg-transparent text-text-tertiary cursor-not-allowed'
                      : 'bg-accent text-[var(--on-accent-text,#FFFFFF)] hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/15 hover:-translate-y-[1px] active:translate-y-0'
                  }`}
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-accent/10 border border-accent/25 text-accent text-xs font-bold z-[1000] shadow-lg shadow-accent/5 backdrop-blur-md flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
