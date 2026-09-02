'use client'

import React, { memo, useMemo, useRef, useState, useCallback } from 'react'
import DOMPurify from 'dompurify'
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  Copy,
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCw,
  XCircle,
  X,
  SendHorizonal,
  CheckCircle2,
} from 'lucide-react'

type MediaType = 'image' | 'audio' | 'video' | 'document' | null

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
    media_type?: MediaType
    mime_type?: string | null
    file_name?: string | null
    file_size?: number | null
    duration?: number | null
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
  onCorrectAI?: (messageId: number, aiDraft: string, correction: string, learningType: string) => Promise<void>
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function absoluteMediaUrl(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function messageMediaUrl(messageId: number, mode: 'inline' | 'download') {
  return `${API_ORIGIN}/api/messages/${messageId}/media?disposition=${mode}&token=${encodeURIComponent(getToken())}`
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatFileSize(size?: number | null) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function fileKind(mediaType?: MediaType, mimeType?: string | null, name?: string | null) {
  const mime = (mimeType || '').toLowerCase()
  const fileName = (name || '').toLowerCase()
  if (mediaType === 'image' || mime.startsWith('image/')) return 'image'
  if (mediaType === 'audio' || mime.startsWith('audio/')) return 'audio'
  if (mediaType === 'video' || mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf'
  if (/\.(zip|rar|7z|tar|gz)$/.test(fileName)) return 'archive'
  if (mediaType === 'document') return 'document'
  return 'unknown'
}

function AttachmentIcon({ kind }: { kind: string }) {
  const className = "h-5 w-5"
  if (kind === 'image') return <ImageIcon className={className} />
  if (kind === 'audio') return <FileAudio className={className} />
  if (kind === 'video') return <FileVideo className={className} />
  if (kind === 'pdf' || kind === 'document') return <FileText className={className} />
  if (kind === 'archive') return <FileArchive className={className} />
  return <File className={className} />
}

function AttachmentCard({ msg, isOutgoing }: { msg: MessageBubbleProps['msg']; isOutgoing: boolean }) {
  const [previewError, setPreviewError] = useState(false)
  const [loading, setLoading] = useState(true)
  const kind = fileKind(msg.media_type, msg.mime_type, msg.file_name)
  const directUrl = absoluteMediaUrl(msg.media_url)
  const inlineUrl = msg.id > 0 ? messageMediaUrl(msg.id, 'inline') : directUrl
  const downloadUrl = msg.id > 0 ? messageMediaUrl(msg.id, 'download') : directUrl
  const name = msg.file_name || (kind === 'pdf' ? 'PDF document' : 'Attachment')
  const meta = [kind.toUpperCase(), formatFileSize(msg.file_size)].filter(Boolean).join(' - ')

  const downloadButton = (
    <a
      href={downloadUrl}
      download={name}
      title="Download original file"
      aria-label={`Download ${name}`}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[11px] font-semibold transition-colors ${
        isOutgoing
          ? 'border-white/25 bg-white/10 text-white hover:bg-white/20'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      <Download size={14} />
      <span className="ml-1 hidden sm:inline">Download</span>
    </a>
  )

  if (kind === 'image' && !previewError) {
    return (
      <div className="space-y-2">
        <a href={inlineUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-black/5 bg-black/5">
          {loading && <div className="flex h-36 w-64 max-w-full items-center justify-center text-[var(--text-secondary)]"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          <img
            src={inlineUrl}
            alt={name}
            loading="lazy"
            onLoad={() => setLoading(false)}
            onError={() => { setPreviewError(true); setLoading(false) }}
            className={`${loading ? 'hidden' : 'block'} max-h-80 w-auto max-w-full object-contain`}
          />
        </a>
        <div className="flex items-center justify-between gap-2">{downloadButton}</div>
      </div>
    )
  }

  if (kind === 'audio' && !previewError) {
    return (
      <div className="w-[min(19rem,72vw)] space-y-2">
        <audio src={inlineUrl} controls preload="metadata" onError={() => setPreviewError(true)} className="w-full" />
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] opacity-75">{name}</span>
          {downloadButton}
        </div>
      </div>
    )
  }

  if (kind === 'video' && !previewError) {
    return (
      <div className="space-y-2">
        <video src={inlineUrl} controls preload="metadata" onError={() => setPreviewError(true)} className="max-h-80 max-w-full rounded-xl bg-black" />
        <div className="flex items-center justify-between gap-2">{downloadButton}</div>
      </div>
    )
  }

  return (
    <div className={`flex w-[min(21rem,76vw)] items-center gap-3 rounded-xl border p-3 ${
      isOutgoing ? 'border-white/20 bg-white/10' : 'border-[var(--border)] bg-[var(--surface-elevated)]'
    }`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        isOutgoing ? 'bg-white/15 text-white' : 'bg-accent/10 text-accent'
      }`}>
        {previewError ? <AlertCircle className="h-5 w-5" /> : <AttachmentIcon kind={kind} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="mt-0.5 text-[11px] opacity-70">{previewError ? 'Unable to preview file' : meta || 'File'}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {kind === 'pdf' && (
          <a href={inlineUrl} target="_blank" rel="noreferrer" title="Open PDF" aria-label={`Open ${name}`} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isOutgoing ? 'border-white/25 bg-white/10 text-white' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
            <ExternalLink size={14} />
          </a>
        )}
        {downloadButton}
      </div>
    </div>
  )
}

function EmailIframe({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(220)

  React.useEffect(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document
    if (!doc) return
    const resizeScript = `<script>function _h(){parent.postMessage({type:'iframe-height',height:document.documentElement.scrollHeight},'*')}document.addEventListener('DOMContentLoaded',_h);window.addEventListener('load',_h);setTimeout(_h,100);setTimeout(_h,600);<\/script>`
    const html = /^\s*(<(!DOCTYPE|html)[^>]*>|<!DOCTYPE)/i.test(content.trim())
      ? content.replace(/<\/body>/i, `${resizeScript}</body>`)
      : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:16px;background:transparent;color:#111;font:14px/1.6 sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style></head><body>${content}${resizeScript}</body></html>`
    doc.open()
    doc.write(html)
    doc.close()
  }, [content])

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-height' && typeof e.data.height === 'number') setHeight(Math.max(80, e.data.height + 8))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return <iframe ref={iframeRef} title="Email Content" style={{ width: '100%', height, border: 'none', display: 'block', background: 'transparent', borderRadius: 8 }} sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox" />
}

const MessageBubble = memo(function MessageBubble({
  msg,
  channelType,
  isRTL,
  onReact,
  conv,
  onSubmitFeedback,
  onCorrectAI,
}: MessageBubbleProps) {
  const isIn = msg.direction === 'inbound'
  const isGmail = channelType === 'gmail'
  const canReact = channelType === 'whatsapp' && !!msg.whatsapp_message_id
  const hasMedia = !!msg.media_url || !!msg.media_type
  const isFailed = msg.status === 'failed'
  const isPending = msg.status === 'pending'

  // Correction panel state
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [learningType, setLearningType] = useState<'knowledge' | 'faq' | 'tone'>('knowledge')
  const [submittingCorrection, setSubmittingCorrection] = useState(false)
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false)

  const handleSubmitCorrection = useCallback(async () => {
    if (!correctionText.trim() || !onCorrectAI || submittingCorrection) return
    setSubmittingCorrection(true)
    try {
      await onCorrectAI(msg.id, msg.content, correctionText.trim(), learningType)
      setCorrectionSubmitted(true)
      setCorrectionText('')
      setTimeout(() => {
        setShowCorrection(false)
        setCorrectionSubmitted(false)
      }, 2000)
    } catch {
      // keep panel open on error
    } finally {
      setSubmittingCorrection(false)
    }
  }, [correctionText, learningType, msg.id, msg.content, onCorrectAI, submittingCorrection])

  const textDirection = useMemo(() => {
    const sample = `${msg.content || ''} ${msg.file_name || ''}`
    if (/[\u0600-\u06FF]/.test(sample) && !/[A-Za-z]/.test(sample)) return 'rtl'
    return isRTL ? 'rtl' : 'auto'
  }, [isRTL, msg.content, msg.file_name])

  const statusIndicator = () => {
    if (msg.status === 'delivered') return <CheckCheck size={12} className="text-emerald-400" />
    if (msg.status === 'sent' || msg.status === 'manual') return <Check size={12} className="text-[var(--text-tertiary)]" />
    if (isFailed) return <XCircle size={12} className="text-rose-400" />
    if (isPending) return <Loader2 size={12} className="animate-spin text-[var(--text-tertiary)]" />
    return null
  }

  if (isGmail) {
    const hasHtml = !!(msg.content_html && msg.content_html.trim())
    const sanitizedHtml = hasHtml ? DOMPurify.sanitize(msg.content_html!) : null
    const senderName = conv?.sender_name || conv?.sender_email || 'Unknown'
    const subject = conv?.subject || '(No Subject)'
    const formattedDate = new Date(msg.created_at).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    return (
      <div className="my-4 w-full">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-2 border-b border-[var(--divider)] bg-[var(--surface-elevated)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">{senderName.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{senderName}</div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{isIn ? 'to me' : 'from me'}</div>
              </div>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{formattedDate}</div>
          </div>
          <div className="p-5 text-sm leading-6 text-[var(--text-primary)]">
            {subject && <div className="mb-3 font-bold">{subject}</div>}
            {sanitizedHtml ? <EmailIframe content={sanitizedHtml} /> : <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
          </div>
        </div>
      </div>
    )
  }

  const bubbleTone = isIn
    ? 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)]'
    : msg.is_ai
      ? 'border-accent/20 bg-accent text-white'
      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'

  return (
    <div className={`group flex w-full ${isIn ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[min(76%,42rem)] items-end gap-2 ${isIn ? 'flex-row' : 'flex-row-reverse'} sm:max-w-[min(72%,44rem)]`}>
        <div className="relative min-w-0">
          <div className={`inline-block w-fit max-w-full rounded-2xl border px-3.5 py-2.5 text-[14px] leading-[1.58] shadow-sm ${bubbleTone} ${isIn ? 'rounded-bl-md' : 'rounded-br-md'}`}>
            {msg.is_ai && (
              <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase text-current opacity-75">
                <Bot size={12} /> AI drafted
              </div>
            )}
            {hasMedia && <AttachmentCard msg={msg} isOutgoing={!isIn && msg.is_ai} />}
            {msg.content && (
              <div
                dir={textDirection as React.HTMLAttributes<HTMLDivElement>['dir']}
                className={`${hasMedia ? 'mt-2' : ''} whitespace-pre-wrap text-start [overflow-wrap:anywhere] [word-break:normal]`}
              >
                {msg.content}
              </div>
            )}
            {isFailed && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle size={13} /> Failed to send
              </div>
            )}
          </div>

          <div className={`mt-1 flex items-center gap-2 text-[11px] text-[var(--text-secondary)] ${isIn ? 'justify-start' : 'justify-end'}`}>
            <span>{formatMsgTime(msg.created_at)}</span>
            {!isIn && statusIndicator()}
            {msg.is_ai && onSubmitFeedback && (
              <div className="ml-1 flex items-center gap-1">
                <button onClick={() => onSubmitFeedback(msg.id, 'positive')} className="rounded p-0.5 hover:text-emerald-500" title="Helpful">+</button>
                <button onClick={() => onSubmitFeedback(msg.id, 'negative')} className="rounded p-0.5 hover:text-rose-500" title="Not helpful">-</button>
              </div>
            )}
          </div>

          {/* Inline AI Correction Panel */}
          {showCorrection && msg.is_ai && !isIn && (
            <div className="mt-2 w-full max-w-[min(76%,42rem)] rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-900/20 p-3 shadow-md">
              {correctionSubmitted ? (
                <div className="flex items-center gap-2 py-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Correction submitted for review!</span>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Correct this AI reply</span>
                    <button onClick={() => { setShowCorrection(false); setCorrectionText('') }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    placeholder="Write the correct response the AI should have given..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={learningType}
                      onChange={e => setLearningType(e.target.value as 'knowledge' | 'faq' | 'tone')}
                      className="flex-1 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="knowledge">Knowledge base</option>
                      <option value="faq">FAQ answer</option>
                      <option value="tone">Tone correction</option>
                    </select>
                    <button
                      onClick={handleSubmitCorrection}
                      disabled={!correctionText.trim() || submittingCorrection}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {submittingCorrection ? <Loader2 size={12} className="animate-spin" /> : <SendHorizonal size={12} />}
                      {submittingCorrection ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {msg.content && (
            <button onClick={() => navigator.clipboard?.writeText(msg.content)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Copy message" aria-label="Copy message">
              <Copy size={14} />
            </button>
          )}
          {msg.is_ai && !isIn && onCorrectAI && (
            <button
              onClick={() => setShowCorrection(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-800/40"
              title="Correct this AI reply (trains the AI)"
              aria-label="Correct AI reply"
            >
              <Pencil size={14} />
            </button>
          )}
          {isFailed && (
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-rose-400" title="Retry send" aria-label="Retry send">
              <RefreshCw size={14} />
            </button>
          )}
          {canReact && (
            <button onClick={() => onReact?.(msg.id, '❤')} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="React" aria-label="React">
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

export default MessageBubble
