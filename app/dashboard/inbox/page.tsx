'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInbox, ApiConversation, ApiMessage } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import ReactionPicker from '../../../components/inbox/ReactionPicker'
import { Download, FileText, Mic, Paperclip, Pause, Send, SmilePlus, Trash2, Video, X } from 'lucide-react'

function channelMeta(type: string) {
  if (type === 'facebook')  return { label: 'FB',  color: '#1877F2', glow: 'rgba(24,119,242,0.35)' }
  if (type === 'instagram') return { label: 'IG',  color: '#E1306C', glow: 'rgba(225,48,108,0.35)' }
  if (type === 'gmail')     return { label: 'GM',  color: '#EA4335', glow: 'rgba(234,67,53,0.35)'  }
  if (type === 'whatsapp') return { label: 'WA',  color: '#25D366', glow: 'rgba(37,211,102,0.35)' }
  return { label: '??', color: '#888', glow: 'rgba(136,136,136,0.2)' }
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '55%', marginBottom: 6 }} />
        <div style={{ height: 9, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '80%' }} />
      </div>
    </div>
  )
}

function ConvRow({ conv, active, onClick, onToggleAi }: { conv: ApiConversation; active: boolean; onClick: () => void; onToggleAi: (id: number) => void }) {
  const ch = channelMeta(conv.channel?.type)
  const preview = conv.latest_message?.content ?? conv.subject ?? 'â€”'
  const isAI = conv.latest_message?.is_ai
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '11px 16px', textAlign: 'left',
        background: active ? 'rgba(108,99,255,0.06)' : 'transparent',
        cursor: 'pointer', transition: 'background 0.15s', border: 'none',
        borderLeftWidth: 3, borderLeftStyle: 'solid',
        borderLeftColor: active ? 'var(--primary)' : 'transparent',
        borderBottomWidth: 1, borderBottomStyle: 'solid',
        borderBottomColor: 'var(--border)',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ChannelIcon type={(conv.channel?.type || 'facebook') as any} size={40} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
            {senderLabel(conv)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {formatTimestamp(conv.last_message_at)}
          </span>
        </div>
        {conv.subject && conv.channel?.type === 'gmail' && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            {conv.subject}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isAI && <span style={{ fontSize: 9, color: 'var(--primary)', opacity: 0.7 }}>âš¡</span>}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview.slice(0, 60)}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleAi(conv.id) }}
        style={{
          padding: '4px 8px',
          borderRadius: 6,
          background: conv.ai_enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${conv.ai_enabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
          color: conv.ai_enabled ? '#3B82F6' : 'rgba(255,255,255,0.4)',
          fontSize: 10,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {conv.ai_enabled ? 'AI ON' : 'AI OFF'}
      </button>
    </motion.button>
  )
}

function MsgBubble({ msg, channelType, isRTL, onReact }: { msg: ApiMessage; channelType?: string; isRTL: boolean; onReact?: (messageId: number, emoji: string) => void }) {
  const isIn = msg.direction === 'inbound'
  const [showPicker, setShowPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const [lightbox, setLightbox] = useState(false)
  const reactButtonRef = useRef<HTMLButtonElement>(null)

  const isWhatsApp = channelType === 'whatsapp'
  const canReact = isWhatsApp && !!msg.whatsapp_message_id

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
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
      style={{ display: 'flex', justifyContent: isIn ? 'flex-start' : 'flex-end', marginBottom: uniqueReactions.length ? 18 : 8, width: '100%' }}
    >
      <div
        className="message-row"
        style={{
          maxWidth: 'min(74%, 560px)',
          alignSelf: isIn ? 'flex-start' : 'flex-end',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexDirection: isIn ? 'row' : 'row-reverse',
        }}
      >
        {canReact && (
          <button
            ref={reactButtonRef}
            onClick={openPicker}
            title={isRTL ? 'تفاعل' : 'React'}
            className="reaction-trigger"
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(17,17,17,0.78)',
              color: 'rgba(255,255,255,0.72)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: 0.78,
            }}
          >
            <SmilePlus size={15} />
          </button>
        )}

        <div>
          <div
            style={{
              padding: hasMedia ? 6 : '12px 16px',
              borderRadius: isIn ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
              background: isIn ? 'rgba(17,17,17,0.8)' : msg.is_ai ? 'var(--accent)' : '#00D68F',
              border: `1px solid ${isIn ? 'rgba(255,255,255,0.08)' : msg.is_ai ? 'rgba(59,130,246,0.3)' : 'rgba(0,214,143,0.3)'}`,
              fontSize: 14,
              lineHeight: 1.5,
              color: isIn ? '#F0F0FF' : '#FFFFFF',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxShadow: isIn ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
              position: 'relative',
              minWidth: hasMedia ? 220 : 'auto',
            }}
            onContextMenu={(e) => { e.preventDefault(); openPicker() }}
          >
            {hasMedia && msg.media_type === 'image' && (
              <button onClick={() => setLightbox(true)} style={{ display: 'block', padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in', width: '100%' }}>
                <img src={mediaUrl} alt={msg.file_name || 'WhatsApp image'} style={{ display: 'block', width: '100%', maxWidth: 360, maxHeight: 360, objectFit: 'cover', borderRadius: 12 }} />
              </button>
            )}

            {hasMedia && msg.media_type === 'audio' && (
              <div style={{ width: 280, maxWidth: '66vw', padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 22, display: 'flex', alignItems: 'center', gap: 3 }}>
                      {Array.from({ length: 28 }).map((_, i) => (
                        <span key={i} style={{ width: 3, height: 5 + ((i * 7) % 18), borderRadius: 4, background: 'rgba(255,255,255,0.42)', display: 'inline-block' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.72 }}>{formatDuration(msg.duration) || (isRTL ? 'رسالة صوتية' : 'Voice note')}</div>
                  </div>
                </div>
                <audio controls src={mediaUrl} style={{ width: '100%', height: 32 }} />
              </div>
            )}

            {hasMedia && msg.media_type === 'video' && (
              <video controls src={mediaUrl} style={{ display: 'block', width: '100%', maxWidth: 380, maxHeight: 360, borderRadius: 12, background: '#000' }} />
            )}

            {hasMedia && msg.media_type === 'document' && (
              <a href={mediaUrl} download target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, width: 300, maxWidth: '66vw', padding: 10, color: 'inherit', textDecoration: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.file_name || (isRTL ? 'ملف' : 'Document')}</div>
                  <div style={{ fontSize: 10, opacity: 0.68 }}>{formatFileSize(msg.file_size) || msg.mime_type || ''}</div>
                </div>
                <Download size={18} />
              </a>
            )}

            {msg.content && <div style={{ padding: hasMedia ? '8px 8px 4px' : 0 }}>{msg.content}</div>}

            {uniqueReactions.length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '-13px',
                right: isIn ? 'auto' : 8,
                left: isIn ? 8 : 'auto',
                background: 'rgba(22,24,25,0.96)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 999,
                padding: uniqueReactions.length === 1 ? '2px 6px' : '2px 7px',
                display: 'flex',
                gap: 3,
                fontSize: 13,
                boxShadow: '0 3px 10px rgba(0,0,0,0.24)',
              }}>
                {uniqueReactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
              </div>
            )}
          </div>

          {showPicker && canReact && <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} position={pickerPosition} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingInline: 4, justifyContent: isIn ? 'flex-start' : 'flex-end' }}>
            {!isIn && msg.is_ai && <span style={{ fontSize: 9, color: '#3B82F6', fontWeight: 600 }}>AI</span>}
            {!isIn && !msg.is_ai && <span style={{ fontSize: 9, color: '#00D68F', fontWeight: 600 }}>{isRTL ? 'يدوي' : 'manual'}</span>}
            <span style={{ fontSize: 10, color: 'rgba(136,136,170,0.6)' }}>{formatMsgTime(msg.created_at)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && msg.media_type === 'image' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--background)', overflow: 'hidden', fontFamily: 'inherit' }}>
      {/* LEFT: conversation list */}
      <div style={{
        width: 300, flexShrink: 0, display: mobilePane === 'chat' ? 'none' : 'flex',
        flexDirection: 'column', borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
      }} className="md-inbox-list">
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            {t.inbox.title}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: filter === f.id ? 'var(--primary)' : 'transparent',
                  color: filter === f.id ? '#050508' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isRTL ? 'Ø¨Ø­Ø«...' : 'Search...'}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: 16 }}>
              {[1,2,3,4,5].map(i => <ConvSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
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
      <div style={{ flex: 1, display: mobilePane === 'list' ? 'none' : 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {t.inbox.selectConversation}
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface)',
            }}>
              <button onClick={() => setMobilePane('list')} className="md:hidden" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 20 }}>
                â†
              </button>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <ChannelIcon type={(selectedConv.channel?.type || 'facebook') as any} size={40} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {senderLabel(selectedConv)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ch?.label} â€¢ {isRTL ? 'ÙŠÙˆÙ…Ù†Ø§: ' : 'Today'}
                </div>
              </div>
              <button
                onClick={() => toggleAi(selectedConv.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: selectedConv.ai_enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${selectedConv.ai_enabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: selectedConv.ai_enabled ? '#3B82F6' : 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {selectedConv.ai_enabled ? 'âš¡ AI ON' : 'AI OFF'}
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : grouped.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  {t.inbox.noMessages}
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {group.date}
                    </div>
                    {group.messages.map(msg => (
                      <MsgBubble 
                        key={msg.id} 
                        msg={msg} 
                        channelType={selectedConv?.channel?.type}
                        isRTL={isRTL}
                        onReact={reactToMessage}
                      />
                    ))}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              {selectedFile && (
                <div style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {mediaTypeFromFile(selectedFile) === 'image' && filePreview ? (
                      <img src={filePreview} alt={selectedFile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : mediaTypeFromFile(selectedFile) === 'video' ? (
                      <Video size={22} />
                    ) : mediaTypeFromFile(selectedFile) === 'audio' ? (
                      <Mic size={22} />
                    ) : (
                      <FileText size={22} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <button onClick={clearSelectedFile} title={isRTL ? 'إلغاء' : 'Cancel'} style={{ width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                  onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  title={isRTL ? 'إرفاق ملف' : 'Attach file'}
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending ? 'not-allowed' : 'pointer', opacity: selectedConv.channel?.type === 'whatsapp' ? 1 : 0.45 }}
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={toggleRecording}
                  disabled={sending || selectedConv.channel?.type !== 'whatsapp'}
                  title={isRecording ? (isRTL ? 'إيقاف التسجيل' : 'Stop recording') : (isRTL ? 'تسجيل صوت' : 'Record voice note')}
                  style={{ width: 44, height: 44, borderRadius: 12, background: isRecording ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isRecording ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`, color: isRecording ? '#EF4444' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending ? 'not-allowed' : 'pointer', opacity: selectedConv.channel?.type === 'whatsapp' ? 1 : 0.45 }}
                >
                  {isRecording ? <Pause size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={selectedFile ? (isRTL ? 'أضف تعليقاً...' : 'Add a caption...') : (isRTL ? 'اكتب رسالتك...' : 'Type your message...')}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!reply.trim() && !selectedFile)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: sending ? 'rgba(108,99,255,0.3)' : 'var(--primary)',
                    color: sending ? 'rgba(255,255,255,0.5)' : '#050508',
                    border: 'none',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {sending ? '...' : <Send size={18} />}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '12px 20px',
              borderRadius: 12,
              background: 'rgba(108,99,255,0.15)',
              border: '1px solid rgba(108,99,255,0.3)',
              color: 'var(--primary)',
              fontSize: 14,
              fontWeight: 600,
              zIndex: 1000,
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
