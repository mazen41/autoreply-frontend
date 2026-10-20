'use client'

import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react'
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
  Info,
  Clock3,
} from 'lucide-react'
import Select from '../ui/Select'
import { getBusinessHeaders } from '../../lib/businessContext'
import VoiceMessagePlayer from './VoiceMessagePlayer'

type MediaType = 'image' | 'audio' | 'video' | 'document' | null

interface AiReplyAudit {
  agent: { id: number; name: string } | null
  agent_version: string | null
  commerce_connection: { id: number; provider: string; name: string | null } | null
  knowledge_file_ids: number[]
  knowledge_chunk_ids: number[]
  prompt_version: string | null
  ai_provider: string | null
  ai_model: string | null
  confidence: number | null
  escalation_decision: boolean
  escalation_reason: string | null
  consent_basis: string
}

interface MessageBubbleProps {
  msg: {
    id: number
    conversation_id: number
    content: string
    content_html?: string | null
    direction: 'inbound' | 'outbound'
    is_ai: boolean
    status: string
    send_status?: 'queued' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'blocked' | string
    delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed' | string
    error_details?: string | null
    created_at: string
    media_url?: string | null
    media_type?: MediaType
    media_processing_status?: 'pending' | 'processing' | 'done' | 'failed' | 'unsupported' | null
    media_processing_reason?: string | null
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
  return `${API_ORIGIN}/api/messages/${messageId}/media?disposition=${mode}`
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
  if (mediaType === 'audio' || mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|opus|weba)$/i.test(fileName)) return 'audio'
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

function AttachmentCard({
  msg,
  isOutgoing,
  isSolidBubble = isOutgoing,
}: {
  msg: MessageBubbleProps['msg']
  isOutgoing: boolean
  isSolidBubble?: boolean
}) {
  const [previewError, setPreviewError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authenticatedMediaUrl, setAuthenticatedMediaUrl] = useState('')
  const kind = fileKind(msg.media_type, msg.mime_type, msg.file_name)
  const directUrl = absoluteMediaUrl(msg.media_url)
  const inlineUrl = msg.id > 0 ? authenticatedMediaUrl : directUrl
  const downloadUrl = inlineUrl
  const name = msg.file_name || (kind === 'pdf' ? 'PDF document' : 'Attachment')
  const meta = [kind.toUpperCase(), formatFileSize(msg.file_size)].filter(Boolean).join(' - ')

  useEffect(() => {
    let disposed = false
    let objectUrl: string | null = null
    setLoading(true)
    setPreviewError(false)

    const load = async () => {
      try {
        if (msg.id <= 0) {
          setAuthenticatedMediaUrl(directUrl)
          setLoading(false)
          return
        }

        const token = getToken()
        const response = await fetch(messageMediaUrl(msg.id, 'inline'), {
          headers: { Authorization: `Bearer ${token}`, Accept: '*/*', ...getBusinessHeaders() },
        })
        if (!response.ok) throw new Error('Attachment could not be loaded')
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!disposed) {
          setAuthenticatedMediaUrl(objectUrl)
          setLoading(false)
        }
      } catch {
        if (!disposed) {
          setPreviewError(true)
          setLoading(false)
        }
      }
    }

    setAuthenticatedMediaUrl('')
    void load()
    return () => {
      disposed = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [msg.id, directUrl])

  const downloadButton = loading || !downloadUrl ? (
    <span className="text-[11px] opacity-70">Loading attachment…</span>
  ) : (
    <a
      href={downloadUrl}
      download={name}
      title="Download original file"
      aria-label={`Download ${name}`}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[11px] font-semibold transition-colors ${
        isSolidBubble
          ? 'border-brand-text/25 bg-brand-text/10 text-brand-text hover:bg-brand-text/20'
          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
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
          {loading && <div className="flex h-36 w-64 max-w-full items-center justify-center text-text-secondary"><Loader2 className="h-5 w-5 animate-spin" /></div>}
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
      <div className="space-y-1.5">
        {loading ? (
          <div className="flex h-10 w-[min(17rem,68vw)] items-center justify-center">
            <Loader2 className={`h-4 w-4 animate-spin ${isSolidBubble ? 'text-brand-text/60' : 'text-text-secondary'}`} />
          </div>
        ) : (
          <VoiceMessagePlayer
            src={inlineUrl}
            hintDuration={msg.duration}
            isOutgoing={isSolidBubble}
            seed={String(msg.id || inlineUrl)}
            onError={() => setPreviewError(true)}
          />
        )}
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[11px] ${isSolidBubble ? 'text-brand-text/60' : 'opacity-60'}`}>{name}</span>
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
      isSolidBubble ? 'border-brand-text/20 bg-brand-text/10' : 'border-border bg-surface-elevated'
    }`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        isSolidBubble ? 'bg-brand-text/15 text-brand-text' : 'bg-brand/10 text-brand'
      }`}>
        {previewError ? <AlertCircle className="h-5 w-5" /> : <AttachmentIcon kind={kind} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="mt-0.5 text-[11px] opacity-70">{previewError ? 'Unable to preview file' : meta || 'File'}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {kind === 'pdf' && (
          <a href={inlineUrl} target="_blank" rel="noreferrer" title="Open PDF" aria-label={`Open ${name}`} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isSolidBubble ? 'border-brand-text/25 bg-brand-text/10 text-brand-text' : 'border-border bg-surface text-text-secondary'}`}>
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
  const outboundStates = [msg.send_status, msg.delivery_status, msg.status].filter((value): value is string => !!value)
  const outboundState = ['blocked', 'failed', 'read', 'delivered', 'sent', 'queued', 'pending']
    .find(state => outboundStates.includes(state)) || outboundStates[0] || ''
  const isFailed = outboundState === 'failed'
  const isBlocked = outboundState === 'blocked'
  const isPending = outboundState === 'pending' || outboundState === 'queued'

  // Correction panel state
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [learningType, setLearningType] = useState<'knowledge' | 'faq' | 'tone'>('knowledge')
  const [submittingCorrection, setSubmittingCorrection] = useState(false)
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false)
  const [showAiAudit, setShowAiAudit] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [aiAudit, setAiAudit] = useState<AiReplyAudit | null>(null)

  const loadAiAudit = useCallback(async () => {
    if (aiAudit || auditLoading) return
    setAuditLoading(true)
    setAuditError('')
    try {
      const response = await fetch(`${API_ORIGIN}/api/messages/${msg.id}/ai-audit`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (response.status === 403) throw new Error('Only business owners and managers can view this explanation.')
      if (response.status === 404) throw new Error('No decision audit is available for this reply.')
      if (!response.ok) throw new Error('Could not load the reply explanation.')
      setAiAudit(await response.json() as AiReplyAudit)
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Could not load the reply explanation.')
    } finally {
      setAuditLoading(false)
    }
  }, [aiAudit, auditLoading, msg.id])

  const toggleAiAudit = useCallback(() => {
    const next = !showAiAudit
    setShowAiAudit(next)
    if (next) void loadAiAudit()
  }, [loadAiAudit, showAiAudit])

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
    const labels = isRTL
      ? { queued: 'في قائمة الإرسال', sent: 'تم الإرسال', delivered: 'تم التسليم', read: 'تمت القراءة', failed: 'فشل الإرسال', blocked: 'تم الحظر' }
      : { queued: 'Queued', sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Failed', blocked: 'Blocked' }
    if (outboundState === 'read') return <span title={msg.error_details || labels.read} className="inline-flex items-center gap-1 text-success"><CheckCheck size={12} />{labels.read}</span>
    if (outboundState === 'delivered') return <span title={msg.error_details || labels.delivered} className="inline-flex items-center gap-1 text-success"><CheckCheck size={12} />{labels.delivered}</span>
    if (outboundState === 'sent' || outboundState === 'manual') return <span title={msg.error_details || labels.sent} className="inline-flex items-center gap-1 text-text-tertiary"><Check size={12} />{labels.sent}</span>
    if (isBlocked) return <span title={msg.error_details || labels.blocked} className="inline-flex items-center gap-1 text-warning"><AlertCircle size={12} />{labels.blocked}</span>
    if (isFailed) return <span title={msg.error_details || labels.failed} className="inline-flex items-center gap-1 text-error"><XCircle size={12} />{labels.failed}</span>
    if (isPending) return <span title={labels.queued} className="inline-flex items-center gap-1 text-text-tertiary"><Clock3 size={12} />{labels.queued}</span>
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
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-2 border-b border-divider bg-surface-elevated px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">{senderName.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-sm font-bold text-text-primary">{senderName}</div>
                <div className="mt-0.5 text-xs text-text-secondary">{isIn ? 'to me' : 'from me'}</div>
              </div>
            </div>
            <div className="text-xs text-text-secondary">{formattedDate}</div>
          </div>
          <div className="p-5 text-sm leading-6 text-text-primary">
            {subject && <div className="mb-3 font-bold">{subject}</div>}
            {sanitizedHtml ? <EmailIframe content={sanitizedHtml} /> : <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
          </div>
        </div>
        {!isIn && (
          <div className="mt-1 flex justify-end text-[11px] text-text-secondary">
            {statusIndicator()}
          </div>
        )}
        {(isFailed || isBlocked) && msg.error_details && (
          <div role="status" className={`mt-1 text-end text-xs ${isBlocked ? 'text-warning' : 'text-error'}`}>
            {isBlocked ? (isRTL ? `تم الحظر: ${msg.error_details}` : `Blocked: ${msg.error_details}`) : msg.error_details}
          </div>
        )}
        {msg.is_ai && !isIn && (
          <AiAuditDisclosure
            audit={aiAudit}
            error={auditError}
            loading={auditLoading}
            open={showAiAudit}
            onToggle={toggleAiAudit}
          />
        )}
      </div>
    )
  }

  const bubbleTone = isIn
    ? 'border-border bg-surface-elevated text-text-primary'
    : msg.is_ai
      ? 'border-brand/25 bg-brand/10 text-text-primary'
      : 'border-brand/30 bg-brand text-brand-text font-medium'

  return (
    <div className={`group flex w-full ${isIn ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[min(76%,42rem)] items-end gap-2 ${isIn ? 'flex-row' : 'flex-row-reverse'} sm:max-w-[min(72%,44rem)]`}>
        <div className="relative min-w-0">
          <div className={`inline-block w-fit max-w-full rounded-2xl border px-3.5 py-2.5 text-[14px] leading-[1.58] shadow-xs ${bubbleTone} ${isIn ? 'rounded-bl-md' : 'rounded-br-md'}`}>
            {msg.is_ai && (
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-brand/80 tracking-wider">
                <Bot size={12} /> AI generated
              </div>
            )}
            {hasMedia && <AttachmentCard msg={msg} isOutgoing={!isIn} isSolidBubble={!isIn && !msg.is_ai} />}
            {msg.content && (
              <div
                dir={textDirection as React.HTMLAttributes<HTMLDivElement>['dir']}
                className={`${hasMedia ? 'mt-2' : ''} whitespace-pre-wrap text-start [overflow-wrap:anywhere] [word-break:normal]`}
              >
                {msg.content}
              </div>
            )}
            {(isFailed || isBlocked) && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs ${isBlocked ? 'text-warning' : 'text-error'}`} role="status">
                <AlertCircle size={13} /> {isBlocked ? `${isRTL ? 'تم الحظر' : 'Blocked'}: ${msg.error_details || (isRTL ? 'سبب السياسة غير متاح' : 'Policy reason unavailable')}` : (msg.error_details || (isRTL ? 'فشل الإرسال' : 'Failed to send'))}
              </div>
            )}
            {msg.media_processing_status && ['failed', 'unsupported'].includes(msg.media_processing_status) && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-warning/10 px-2 py-1.5 text-[11px] text-warning" role="status">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{msg.media_processing_reason || (isRTL ? 'تعذرت معالجة الوسائط.' : 'Media could not be processed.')}</span>
              </div>
            )}
          </div>

          <div className={`mt-1 flex items-center gap-2 text-[11px] text-text-secondary ${isIn ? 'justify-start' : 'justify-end'}`}>
            <span>{formatMsgTime(msg.created_at)}</span>
            {!isIn && statusIndicator()}
            {msg.is_ai && onSubmitFeedback && (
              <div className="ml-1 flex items-center gap-0.5">
                <button
                  onClick={() => onSubmitFeedback(msg.id, 'positive')}
                  className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-brand hover:bg-brand/10 transition-colors"
                  title="Helpful"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <button
                  onClick={() => onSubmitFeedback(msg.id, 'negative')}
                  className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                  title="Not helpful"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                </button>
              </div>
            )}
            {msg.is_ai && !isIn && (
              <button
                type="button"
                onClick={toggleAiAudit}
                className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-text-tertiary hover:bg-brand/10 hover:text-brand"
                aria-expanded={showAiAudit}
              >
                <Info size={12} /> Why did the bot say this?
              </button>
            )}
          </div>

          {showAiAudit && !isIn && (
            <AiAuditDisclosure
              audit={aiAudit}
              error={auditError}
              loading={auditLoading}
              open={showAiAudit}
              onToggle={toggleAiAudit}
              hideToggle
            />
          )}

          {/* Inline AI Correction Panel */}
          {showCorrection && msg.is_ai && !isIn && (
            <div className="mt-2 w-full max-w-[min(76%,42rem)] rounded-xl border border-brand/25 bg-surface-elevated p-3 shadow-md">
              {correctionSubmitted ? (
                <div className="flex items-center gap-2 py-2 text-brand">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Correction submitted for review!</span>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand uppercase tracking-wide">Correct this AI reply</span>
                    <button onClick={() => { setShowCorrection(false); setCorrectionText('') }} className="text-text-tertiary hover:text-text-primary">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    placeholder="Write the correct response the AI should have given..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        size="sm"
                        value={learningType}
                        onChange={e => setLearningType(e.target.value as 'knowledge' | 'faq' | 'tone')}
                        options={[
                          { value: 'knowledge', label: 'Knowledge base' },
                          { value: 'faq', label: 'FAQ answer' },
                          { value: 'tone', label: 'Tone correction' },
                        ]}
                      />
                    </div>
                    <button
                      onClick={handleSubmitCorrection}
                      disabled={!correctionText.trim() || submittingCorrection}
                      className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-brand-hover disabled:opacity-50 transition-colors"
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
            <button onClick={() => navigator.clipboard?.writeText(msg.content)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary" title="Copy message" aria-label="Copy message">
              <Copy size={14} />
            </button>
          )}
          {msg.is_ai && !isIn && onCorrectAI && (
            <button
              onClick={() => setShowCorrection(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-brand hover:bg-brand/10"
              title="Correct this AI reply (trains the AI)"
              aria-label="Correct AI reply"
            >
              <Pencil size={14} />
            </button>
          )}
          {isFailed && (
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-error" title="Retry send" aria-label="Retry send">
              <RefreshCw size={14} />
            </button>
          )}
          {canReact && (
            <button onClick={() => onReact?.(msg.id, '❤')} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary" title="React" aria-label="React">
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

function AiAuditDisclosure({
  audit,
  error,
  loading,
  open,
  onToggle,
  hideToggle = false,
}: {
  audit: AiReplyAudit | null
  error: string
  loading: boolean
  open: boolean
  onToggle: () => void
  hideToggle?: boolean
}) {
  if (!open && hideToggle) return null

  return (
    <div className="mt-2 w-full max-w-[min(76%,42rem)] rounded-lg border border-border bg-surface-elevated p-2.5 text-xs text-text-secondary">
      {!hideToggle && (
        <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline" aria-expanded={open}>
          <Info size={13} /> Why did the bot say this?
        </button>
      )}
      {open && (
        <div className={hideToggle ? '' : 'mt-2'}>
          {loading && <div role="status">Loading reply explanation…</div>}
          {!loading && error && <div role="status" className="text-warning">{error}</div>}
          {!loading && !error && audit && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5">
              <dt>Agent</dt><dd className="min-w-0 text-text-primary">{audit.agent?.name ?? 'Unassigned'}{audit.agent_version ? ` · ${audit.agent_version}` : ''}</dd>
              <dt>Store</dt><dd className="min-w-0 text-text-primary">{audit.commerce_connection ? `${audit.commerce_connection.name || audit.commerce_connection.provider} (${audit.commerce_connection.provider})` : 'No commerce store'}</dd>
              <dt>Knowledge files</dt><dd className="text-text-primary">{audit.knowledge_file_ids.length ? audit.knowledge_file_ids.join(', ') : 'None retrieved'}</dd>
              <dt>Knowledge chunks</dt><dd className="text-text-primary">{audit.knowledge_chunk_ids.length ? audit.knowledge_chunk_ids.join(', ') : 'None retrieved'}</dd>
              <dt>Prompt version</dt><dd className="text-text-primary">{audit.prompt_version || 'Not recorded'}</dd>
              <dt>AI model</dt><dd className="text-text-primary">{[audit.ai_provider, audit.ai_model].filter(Boolean).join(' · ') || 'Not recorded'}</dd>
              <dt>Confidence</dt><dd className="text-text-primary">{audit.confidence === null ? 'Not recorded' : `${Math.round(audit.confidence * 100)}%`}</dd>
              <dt>Escalation</dt><dd className="text-text-primary">{audit.escalation_decision ? `Yes · ${audit.escalation_reason || 'Reason not recorded'}` : `No · ${audit.escalation_reason || 'Automatic reply'}`}</dd>
              <dt>Consent basis</dt><dd className="text-text-primary">{audit.consent_basis.replaceAll('_', ' ')}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBubble
