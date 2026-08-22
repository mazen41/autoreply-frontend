'use client'

import React, { useState, useRef, useCallback, memo } from 'react'
import { Send, Paperclip, Mic, Pause, Trash2, Video, FileText } from 'lucide-react'

interface InboxComposerProps {
  disabled: boolean
  channelType?: string
  onSendText: (text: string) => Promise<boolean>
  onSendMedia: (file: File, caption: string, mediaType: string, isVoiceNote: boolean) => Promise<boolean>
  onError: (message: string) => void
}

function mediaTypeFromFile(file: File): 'image' | 'audio' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

function formatFileSize(size?: number | null) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const InboxComposer = memo(function InboxComposer({ 
  disabled, 
  channelType, 
  onSendText, 
  onSendMedia,
  onError 
}: InboxComposerProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [sending, setSending] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const clearSelectedFile = useCallback(() => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [filePreview])

  const handleFilePicked = useCallback((file: File | null) => {
    clearSelectedFile()
    if (!file) return
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
  }, [clearSelectedFile])

  const handleSend = useCallback(async () => {
    if (sending) return
    
    if (selectedFile) {
      setSending(true)
      const mediaType = mediaTypeFromFile(selectedFile)
      const success = await onSendMedia(selectedFile, text.trim(), mediaType, selectedFile.type.startsWith('audio/'))
      setSending(false)
      
      if (!success) {
        onError('Failed to send media. Try again.')
        return
      }
      
      setText('')
      clearSelectedFile()
      return
    }

    if (!text.trim()) return
    
    setSending(true)
    const messageText = text.trim()
    setText('')
    
    const success = await onSendText(messageText)
    setSending(false)
    
    if (!success) {
      setText(messageText)
      onError('Failed to send. Try again.')
    }
  }, [selectedFile, text, sending, onSendMedia, onSendText, onError, clearSelectedFile])

  const toggleRecording = useCallback(async () => {
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
      onError('Could not start microphone.')
    }
  }, [isRecording, handleFilePicked, onError])

  const isWhatsApp = channelType === 'whatsapp'
  const canAttach = isWhatsApp

  return (
    <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden text-accent">
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
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{selectedFile.name}</div>
            <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">{formatFileSize(selectedFile.size)}</div>
          </div>
          <button 
            onClick={clearSelectedFile} 
            className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-400 flex items-center justify-center"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Composer Input */}
      <div className="flex items-center gap-2 bg-[var(--surface-elevated)] border border-[var(--border)] focus-within:border-accent/40 rounded-2xl p-2 md:p-1.5 transition-all duration-150" role="toolbar" aria-label="Message composer">
        <input
          ref={fileInputRef}
          type="file"
          onChange={e => handleFilePicked(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending || !canAttach}
          aria-label="Attach file"
          className="p-2 md:p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all duration-150 disabled:opacity-30"
        >
          <Paperclip size={16} />
        </button>

        <button
          onClick={toggleRecording}
          disabled={disabled || sending || !canAttach}
          aria-label={isRecording ? 'Stop recording' : 'Record voice note'}
          className={`p-2 md:p-2.5 rounded-xl transition-all duration-150 disabled:opacity-30 ${
            isRecording ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
          }`}
        >
          {isRecording ? <Pause size={16} /> : <Mic size={16} />}
        </button>

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={selectedFile ? 'Add a caption...' : 'Type message...'}
          disabled={disabled || sending}
          aria-label="Message input"
          className="flex-1 bg-transparent border-none text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-0 px-2.5"
        />

        <button
          onClick={handleSend}
          disabled={sending || disabled || (!text.trim() && !selectedFile)}
          aria-label={sending ? 'Sending...' : 'Send message'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
            sending || disabled || (!text.trim() && !selectedFile)
              ? 'bg-transparent text-[var(--text-tertiary)]'
              : 'bg-accent text-white hover:brightness-110'
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
  )
})

export default InboxComposer