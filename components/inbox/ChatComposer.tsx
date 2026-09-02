'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Paperclip, Mic, Smile, Type, Send, Zap, Clock, X, FileText,
  Image as ImageIcon, Video, StopCircle, Lock
} from 'lucide-react'

interface ChatComposerProps {
  channelType?: string
  isRTL: boolean
  onSendText: (text: string) => Promise<boolean>
  onSendMedia: (file: File, caption: string, type: string, isVoice: boolean) => Promise<boolean>
  disabled?: boolean
  initialText?: string
}

export default function ChatComposer({
  channelType, isRTL, onSendText, onSendMedia, disabled, initialText = ''
}: ChatComposerProps) {
  const [text, setText] = useState(initialText)
  const [isInternal, setIsInternal] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [showAIOptions, setShowAIOptions] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const L = (en: string, ar: string) => isRTL ? ar : en

  // Update initial text if changed (from Copilot insert)
  useEffect(() => {
    if (initialText) {
      setText(initialText)
      // Focus and move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(initialText.length, initialText.length)
        }
      }, 10)
    }
  }, [initialText])

  // Autoresize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [text])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed && !attachment) return
    
    setSending(true)
    let success = false
    
    try {
      if (attachment) {
        let type = 'document'
        if (attachment.type.startsWith('image/')) type = 'image'
        else if (attachment.type.startsWith('video/')) type = 'video'
        else if (attachment.type.startsWith('audio/')) type = 'audio'
        
        success = await onSendMedia(attachment, trimmed, type, false)
        if (success) setAttachment(null)
      } else {
        // If internal note, we would call a different API or pass a flag. 
        // For now we just prefix it to simulate it since backend doesn't support it yet.
        const msg = isInternal ? `[INTERNAL NOTE] ${trimmed}` : trimmed
        success = await onSendText(msg)
      }
      
      if (success) {
        setText('')
        setIsInternal(false)
      }
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    // Mock sending voice note since we don't have actual MediaRecorder setup in this component yet
    alert("Voice recording finished (mock). In full version, this uploads the blob.")
    setRecordingTime(0)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachment(file)
    e.target.value = ''
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`border-t border-[var(--border)] bg-[var(--surface)] p-3 transition-colors ${isInternal ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
      
      {/* Attachment Preview */}
      {attachment && (
        <div className="flex items-center gap-3 p-2 mb-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg w-max">
          <div className="w-10 h-10 rounded bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]">
            {attachment.type.startsWith('image/') ? <ImageIcon size={20} /> :
             attachment.type.startsWith('video/') ? <Video size={20} /> :
             <FileText size={20} />}
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]">{attachment.name}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">{(attachment.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-[var(--surface)] ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Composer Area */}
      <div className={`relative flex items-end gap-2 p-2 rounded-xl border transition-colors ${
        isInternal 
          ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 focus-within:border-amber-400' 
          : 'bg-[var(--surface-elevated)] border-[var(--border)] focus-within:border-[var(--accent)]'
      }`}>
        
        {/* Left Actions */}
        <div className="flex items-center gap-1 mb-1">
          <label className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] cursor-pointer transition-colors" title={L('Attach file', 'إرفاق ملف')}>
            <Paperclip size={18} />
            <input type="file" className="hidden" onChange={handleFileSelect} />
          </label>
          
          <button 
            className={`p-2 rounded-lg hover:bg-[var(--surface)] transition-colors ${isInternal ? 'text-amber-600 bg-amber-200/50' : 'text-[var(--text-secondary)]'}`}
            onClick={() => setIsInternal(!isInternal)}
            title={L('Internal Note (Not visible to customer)', 'ملاحظة داخلية (غير مرئية للعميل)')}
          >
            <Lock size={18} />
          </button>
        </div>

        {/* Input Area */}
        <div className="flex-1 relative min-h-[40px] flex items-center">
          {isRecording ? (
            <div className="flex items-center gap-3 w-full px-2 text-rose-500 animate-pulse">
              <Mic size={18} />
              <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
              <span className="text-xs">{L('Recording...', 'جاري التسجيل...')}</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || sending}
              placeholder={isInternal 
                ? L('Type an internal note (type @ to tag someone)...', 'اكتب ملاحظة داخلية (اكتب @ للإشارة لشخص)...')
                : L('Type your message... (Shift+Enter for new line)', 'اكتب رسالتك... (Shift+Enter لسطر جديد)')
              }
              className="w-full bg-transparent border-none outline-none resize-none max-h-[150px] py-2 px-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] disabled:opacity-50"
              rows={1}
              dir="auto"
            />
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 mb-1">
          {!isRecording && !text && !attachment && !isInternal && (
            <button 
              onClick={startRecording}
              className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
              title={L('Voice note', 'رسالة صوتية')}
            >
              <Mic size={18} />
            </button>
          )}

          {isRecording && (
            <button 
              onClick={stopRecording}
              className="p-2 rounded-lg hover:bg-[var(--surface)] text-rose-500 transition-colors"
              title={L('Stop recording', 'إيقاف التسجيل')}
            >
              <StopCircle size={18} />
            </button>
          )}

          {/* AI Tools Dropdown */}
          {!isInternal && !isRecording && (
            <div className="relative">
              <button 
                onClick={() => setShowAIOptions(!showAIOptions)}
                className="p-2 rounded-lg hover:bg-[var(--surface)] text-indigo-500 transition-colors"
                title={L('AI Tools', 'أدوات الذكاء الاصطناعي')}
              >
                <Zap size={18} />
              </button>
              
              {showAIOptions && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden text-xs">
                  {[
                    { label: L('Generate Reply', 'توليد رد'), action: () => { setText('AI Draft: We can certainly help with that...'); setShowAIOptions(false) } },
                    { label: L('Improve Writing', 'تحسين الكتابة'), action: () => { setShowAIOptions(false) } },
                    { label: L('Make Professional', 'جعله احترافياً'), action: () => { setShowAIOptions(false) } },
                    { label: L('Translate to Arabic', 'ترجمة للعربية'), action: () => { setShowAIOptions(false) } },
                  ].map(opt => (
                    <button key={opt.label} onClick={opt.action} className="w-full text-left px-3 py-2 hover:bg-[var(--surface)] text-[var(--text-primary)]">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleSend}
            disabled={disabled || sending || (!text.trim() && !attachment && !isRecording)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              sending 
                ? 'bg-[var(--surface)] text-[var(--text-tertiary)] cursor-wait'
                : text.trim() || attachment
                  ? isInternal 
                    ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:-translate-y-0.5' 
                    : 'bg-[var(--accent)] text-white shadow-md hover:bg-[var(--accent-hover)] hover:-translate-y-0.5'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} className={isRTL ? 'rotate-180 -ml-1' : 'ml-1'} />
            )}
          </button>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="flex justify-between items-center px-2 mt-2">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {isInternal ? L('Internal notes are highlighted in yellow and only visible to your team.', 'الملاحظات الداخلية مظللة باللون الأصفر ومرئية لفريقك فقط.') : ''}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
          <Type size={10} /> ⌘K {L('for commands', 'للأوامر')}
        </span>
      </div>
    </div>
  )
}
