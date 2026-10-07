'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Paperclip, Send, Video, X } from 'lucide-react'

interface ChatComposerProps {
  channelType?: string
  isRTL: boolean
  onSendText: (text: string) => Promise<boolean>
  onSendMedia: (file: File, caption: string, type: string, isVoice: boolean) => Promise<boolean>
  disabled?: boolean
  initialText?: string
}

export default function ChatComposer({ isRTL, onSendText, onSendMedia, disabled, initialText = '' }: ChatComposerProps) {
  const [text, setText] = useState(initialText)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const L = (en: string, ar: string) => isRTL ? ar : en

  useEffect(() => {
    if (!initialText) return
    setText(initialText)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(initialText.length, initialText.length)
    })
  }, [initialText])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 150)}px`
  }, [text])

  const handleSend = async () => {
    const message = text.trim()
    if ((!message && !attachment) || sending || disabled) return
    setSending(true)
    try {
      let success = false
      if (attachment) {
        const type = attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('video/') ? 'video' : attachment.type.startsWith('audio/') ? 'audio' : 'document'
        success = await onSendMedia(attachment, message, type, false)
      } else {
        success = await onSendText(message)
      }
      if (success) {
        setText('')
        setAttachment(null)
      }
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachment(event.target.files?.[0] || null)
    event.target.value = ''
  }

  return <div className="border-t border-border bg-surface p-3">
    {attachment && <div className="mb-3 flex w-max items-center gap-3 rounded-lg border border-border bg-surface-elevated p-2">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-surface text-text-secondary">{attachment.type.startsWith('image/') ? <ImageIcon size={20} /> : attachment.type.startsWith('video/') ? <Video size={20} /> : <FileText size={20} />}</div>
      <div><div className="max-w-[200px] truncate text-xs font-bold text-text-primary">{attachment.name}</div><div className="text-[10px] text-text-tertiary">{(attachment.size / 1024).toFixed(1)} KB</div></div>
      <button type="button" aria-label={L('Remove attachment', 'إزالة المرفق')} onClick={() => setAttachment(null)} className="ml-2 rounded-full p-1 hover:bg-surface"><X size={14} /></button>
    </div>}
    <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-elevated p-2 focus-within:border-brand/40">
      <button type="button" disabled={disabled || sending} onClick={() => fileInputRef.current?.click()} className="mb-1 rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface disabled:opacity-50" title={L('Attach file', 'إرفاق ملف')}><Paperclip size={18} /></button>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
      <textarea ref={textareaRef} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={handleKeyDown} disabled={disabled || sending} placeholder={L('Type your message... (Shift+Enter for new line)', 'اكتب رسالتك... (Shift+Enter لسطر جديد)')} className="max-h-[150px] min-h-10 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary disabled:opacity-50" rows={1} dir="auto" />
      <button type="button" onClick={() => void handleSend()} disabled={disabled || sending || (!text.trim() && !attachment)} className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-brand-text shadow-xs transition-opacity disabled:cursor-not-allowed disabled:opacity-40" aria-label={L('Send message', 'إرسال الرسالة')}>
        {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Send size={18} className={isRTL ? 'rotate-180' : ''} />}
      </button>
    </div>
  </div>
}
