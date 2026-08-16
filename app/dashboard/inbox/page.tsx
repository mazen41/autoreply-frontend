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
  if (type === 'facebook')  return { label: 'FB',  color: '#0E7AFE', glow: 'rgba(14,122,254,0.15)' }
  if (type === 'instagram') return { label: 'IG',  color: '#D62976', glow: 'rgba(214,41,118,0.15)' }
  if (type === 'gmail')     return { label: 'GM',  color: '#EA4335', glow: 'rgba(234,67,53,0.15)'  }
  if (type === 'whatsapp')  return { label: 'WA',  color: '#25D366', glow: 'rgba(37,211,102,0.15)' }
  return { label: '??', color: 'var(--text-secondary)', glow: 'var(--border)' }
}

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

function mediaTypeFromFile(file: File): 'image' | 'audio' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

function renderHtmlContent(content: string, channelType?: string, contentHtml?: string | null) {
  const htmlSource = contentHtml && contentHtml.trim() ? contentHtml : null
  if (channelType === 'gmail' && htmlSource) {
    const sanitizedContent = DOMPurify.sanitize(htmlSource, {
      ALLOWED_TAGS: ['*'],
      ALLOWED_ATTR: ['*'],
      ALLOWED_URI_REGEXP: /^(?:...)/i,
      ALLOW_DATA_ATTR: true,
      WHOLE_DOCUMENT: true,
    })
    return <EmailIframe content={sanitizedContent} />
  }
  if (channelType === 'gmail' && !htmlSource && content && content.includes('<') && /<\/?[a-z][\s\S]*>/i.test(content)) {
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['*'],
      ALLOWED_ATTR: ['*'],
      WHOLE_DOCUMENT: true,
    })
    return <EmailIframe content={sanitizedContent.toString()} />
  }
  return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{content}</div>
}

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
<style>body{margin:0;padding:0;background:#14151D;color:#fff;font-family:sans-serif}</style>
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
      style={{ width: '100%', height, border: 'none', display: 'block', background: 'transparent', borderRadius: 8 }}
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
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-white/[0.03] rounded w-1/2 mb-2" />
        <div className="h-2 bg-white/[0.02] rounded w-5/6" />
      </div>
    </div>
  )
}

function ConvRow({ conv, active, onClick, onToggleAi, tags, isEscalated, isAssigned }: { 
  conv: ApiConversation; 
  active: boolean; 
  onClick: () => void; 
  onToggleAi: (id: number) => void;
  tags?: Array<{ id: number; tag: string }>;
  isEscalated?: boolean;
  isAssigned?: boolean;
}) {
  const preview = conv.latest_message?.content ?? conv.subject ?? '—'
  const isAI = conv.latest_message?.is_ai
  const isHighPriority = conv.priority === 'high'
  const isClassified = !!conv.category

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, x: 2 }}
      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/[0.03] text-left transition-all duration-300 relative group cursor-pointer ${
        active
          ? 'bg-white/[0.03]'
          : isEscalated
            ? 'bg-amber-500/5'
            : 'bg-transparent hover:bg-white/[0.01]'
      }`}
    >
      {/* Indicator bar */}
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-accent to-[#8B3FFB]" />
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <ChannelIcon type={(conv.channel?.type || 'facebook') as any} size={38} className="rounded-xl border border-white/[0.05]" />
          
          {/* Status dots */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#14151D] flex items-center justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${isEscalated ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold text-white truncate">
              {senderLabel(conv)}
            </span>
            <span className="text-[10px] text-text-secondary flex-shrink-0">
              {formatTimestamp(conv.last_message_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            {isEscalated && <span className="text-[9px] text-amber-400 font-bold uppercase">🔥 Escalated</span>}
            {isAI && <span className="text-[9px] text-accent font-bold uppercase">⚡ AI</span>}
            {conv.category && <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent">{conv.category}</span>}
          </div>

          <p className="text-xs text-text-secondary truncate">
            {preview}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {tags.slice(0, 2).map(tag => (
                <span key={tag.id} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] text-text-secondary border border-white/[0.04]">
                  {tag.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleAi(conv.id) }}
        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all duration-300 flex-shrink-0 ${
          conv.ai_enabled
            ? 'bg-accent/15 border-accent/30 text-accent hover:bg-accent/25'
            : 'bg-white/[0.02] border-white/[0.06] text-text-tertiary hover:border-white/[0.15] hover:text-text-secondary'
        }`}
      >
        AI
      </button>
    </motion.div>
  )
}

function MsgBubble({ msg, channelType, isRTL, onReact, conv, onSubmitFeedback }: { 
  msg: ApiMessage; 
  channelType?: string; 
  isRTL: boolean; 
  onReact?: (messageId: number, emoji: string) => void; 
  conv?: ApiConversation;
  onSubmitFeedback?: (messageId: number, feedback: 'positive' | 'negative') => void;
}) {
  const isIn = msg.direction === 'inbound'
  const [showPicker, setShowPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const [lightbox, setLightbox] = useState(false)
  const reactButtonRef = useRef<HTMLButtonElement>(null)

  const isWhatsApp = channelType === 'whatsapp'
  const isGmail = channelType === 'gmail'
  const canReact = isWhatsApp && !!msg.whatsapp_message_id
  const isAIMessage = msg.is_ai

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (onSubmitFeedback) {
      onSubmitFeedback(msg.id, feedback)
    }
  }

  if (isGmail) {
    const hasHtml = !!(msg.content_html && msg.content_html.trim())
    const sanitizedHtml = hasHtml ? DOMPurify.sanitize(msg.content_html!) : null
    const senderName = conv?.sender_name || conv?.sender_email || 'Unknown'
    const subject = conv?.subject || '(No Subject)'
    const formattedDate = new Date(msg.created_at).toLocaleDateString('en-US', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 w-full"
      >
        <div className="bg-[#14151D] border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="bg-white/[0.01] border-b border-white/[0.04] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                {senderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-none">{senderName}</div>
                <div className="text-[10px] text-text-secondary mt-1">{isIn ? 'to me' : 'from me'}</div>
              </div>
            </div>
            <div className="text-[10px] text-text-secondary">{formattedDate}</div>
          </div>
          <div className="p-5 text-sm text-white/95">
            {subject && <div className="font-bold mb-3">{subject}</div>}
            {sanitizedHtml ? <EmailIframe content={sanitizedHtml} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
          </div>
        </div>
      </motion.div>
    )
  }

  const mediaUrl = absoluteMediaUrl(msg.media_url)
  const hasMedia = !!mediaUrl && !!msg.media_type

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full flex ${isIn ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`max-w-[70%] flex items-end gap-2 group/msg ${isIn ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Chat message content bubble */}
        <div className="relative">
          <div
            className={`border transition-all duration-200 ${
              isIn
                ? 'bg-[#14151D] border-white/[0.06] text-white rounded-[20px_20px_20px_4px]'
                : msg.is_ai
                ? 'bg-gradient-to-br from-accent to-[#8B3FFB] border-accent/20 text-white shadow-xl shadow-accent/5 rounded-[20px_20px_4px_20px]'
                : 'bg-white/[0.03] border-white/[0.06] text-white rounded-[20px_20px_4px_20px]'
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
            
            {!hasMedia && <div className="whitespace-pre-wrap">{msg.content}</div>}
          </div>

          <div className={`text-[9px] text-text-secondary mt-1 flex items-center gap-2 ${isIn ? 'justify-start' : 'justify-end'}`}>
            <span>{formatMsgTime(msg.created_at)}</span>
            {isAIMessage && (
              <div className="flex items-center gap-1.5 ml-1">
                <button onClick={() => handleFeedback('positive')} className="hover:text-emerald-400">👍</button>
                <button onClick={() => handleFeedback('negative')} className="hover:text-rose-400">👎</button>
              </div>
            )}
          </div>
        </div>

        {canReact && (
          <button
            ref={reactButtonRef}
            onClick={() => {
              if (onReact) onReact(msg.id, '❤️')
            }}
            className="w-7 h-7 rounded-lg border border-white/[0.06] bg-white/[0.02] text-text-secondary hover:text-white flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-opacity"
          >
            ❤️
          </button>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={mediaUrl} alt="attachment fullsize" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </motion.div>
  )
}

export default function InboxPage() {
  const { isRTL, t } = useLang()
  const {
    conversations,
    selectedId,
    selectedConv,
    messages,
    loadingConvs,
    loadingMsgs,
    sending,
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
  const [reply, setReply] = useState('')
  const [toast, setToast] = useState('')
  const [optimistic, setOptimistic] = useState<ApiMessage[]>([])
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [aiEnabledFilter, setAiEnabledFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showEscalationQueue, setShowEscalationQueue] = useState(false)
  const [showMyAssignments, setShowMyAssignments] = useState(false)

  // Tags state
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [conversationTags, setConversationTags] = useState<Map<number, Array<{ id: number; tag: string }>>>(new Map())

  // File attachments state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Fetch with advanced filters
  const fetchConversations = React.useCallback(async () => {
    // Relying on useInbox logic
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [search, channelFilter, statusFilter, aiEnabledFilter, dateFrom, dateTo, showEscalationQueue, showMyAssignments, showAdvancedFilters, fetchConversations])

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

  const allMessages = [...messages, ...optimistic]
  const grouped = groupMessagesByDate(allMessages)
  
  const filtered = conversations.filter(c => {
    const matchType = filter === 'all' || c.channel?.type === filter
    if (showAdvancedFilters || showEscalationQueue || showMyAssignments) return matchType
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
    <div className="flex h-[calc(100vh-100px)] rounded-2xl border border-white/[0.05] bg-[#14151D]/60 backdrop-blur-md overflow-hidden">
      
      {/* ── Conversations list (Left Side) ── */}
      <div className={`w-80 border-r border-white/[0.05] bg-[#14151D]/80 flex flex-col flex-shrink-0 ${
        mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* List Header */}
        <div className="p-4 border-b border-white/[0.04] space-y-3 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white tracking-tight">
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
                    ? 'bg-accent border-accent text-white shadow-md shadow-accent/15'
                    : 'bg-white/[0.02] text-text-secondary border-white/[0.04] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم أو المحتوى...' : 'Search inbox...'}
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* List Display */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02] scrollbar-none">
          {loadingConvs ? (
            Array(5).fill(0).map((_, i) => <ConvSkeleton key={i} />)
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
                tags={conversationTags.get(conv.id)}
                isEscalated={showEscalationQueue}
                isAssigned={showMyAssignments}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Active Conversation (Right Side) ── */}
      <div className={`flex-1 flex flex-col bg-[#04061A]/40 relative ${
        mobilePane === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-accent mb-4">
              <Send size={20} className="opacity-80" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {isRTL ? 'اختر محادثة للبدء' : 'Select a conversation'}
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              {t.inbox.selectConversation}
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4.5 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobilePane('list')}
                  className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-white"
                >
                  ←
                </button>
                <div className="relative flex-shrink-0">
                  <ChannelIcon type={(selectedConv.channel?.type || 'facebook') as any} size={38} className="rounded-xl border border-white/[0.05]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {senderLabel(selectedConv)}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5 flex items-center gap-1.5">
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
                      ? 'bg-accent/15 border-accent/30 text-accent shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.05] text-text-secondary hover:border-white/[0.15]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedConv.ai_enabled ? 'bg-accent animate-pulse' : 'bg-text-secondary'}`} />
                  <span>AI {selectedConv.ai_enabled ? 'ACTIVE' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/[0.02] border border-white/[0.05] text-text-secondary hover:border-white/[0.15] transition-all"
                >
                  🏷️ Tags
                </button>
              </div>
            </div>

            {/* Tag Management Panel */}
            {showTagInput && selectedId && (
              <div className="px-6 py-3.5 border-b border-white/[0.04] bg-[#14151D]/60 space-y-2 animate-slide-down">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder={isRTL ? 'أضف وسماً...' : 'Add tag name...'}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-text-secondary focus:outline-none focus:border-accent/40"
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
                      <div key={tag.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] text-text-secondary border border-white/[0.05] text-[10px]">
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
                <div className="text-center py-16 text-xs text-text-tertiary">
                  {t.inbox.noMessages}
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date} className="space-y-4">
                    <div className="flex items-center gap-4 my-2">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">{group.date}</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    {group.messages.map(msg => (
                      <MsgBubble
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

            {/* Chat Composer / Message Input Panel */}
            <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
              
              {selectedFile && (
                <div className="mb-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3 animate-slide-up">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center overflow-hidden text-accent">
                    {mediaTypeFromFile(selectedFile) === 'image' && filePreview ? (
                      <img src={filePreview} alt={selectedFile.name} className="w-full h-full object-cover" />
                    ) : mediaTypeFromFile(selectedFile) === 'video' ? (
                      <Video size={18} />
                    ) : mediaTypeFromFile(selectedFile) === 'audio' ? (
                      <Mic size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{selectedFile.name}</div>
                    <div className="text-[9px] text-text-secondary mt-0.5">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <button onClick={clearSelectedFile} className="w-8 h-8 rounded-lg bg-white/[0.03] text-text-secondary hover:text-red-400 flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] focus-within:border-accent/40 rounded-2xl p-1.5 transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => handleFilePicked(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  className="p-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-white/[0.03] transition-all disabled:opacity-30"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={toggleRecording}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  className={`p-2.5 rounded-xl transition-all disabled:opacity-30 ${
                    isRecording ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'text-text-secondary hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {isRecording ? <Pause size={16} /> : <Mic size={16} />}
                </button>

                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={selectedFile ? (isRTL ? 'تعليق...' : 'Add a caption...') : (isRTL ? 'اكتب رسالتك...' : 'Type message...')}
                  disabled={sending}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-0 px-2.5"
                />

                <button
                  onClick={handleSend}
                  disabled={sending || (!reply.trim() && !selectedFile)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    sending || (!reply.trim() && !selectedFile)
                      ? 'bg-transparent text-text-tertiary'
                      : 'bg-accent text-white hover:brightness-110 shadow-lg shadow-accent/10'
                  }`}
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-accent/15 border border-accent/25 text-accent text-xs font-bold z-[1000] shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
