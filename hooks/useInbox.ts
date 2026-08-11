'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getEcho, disconnectEcho } from '../lib/echo'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
  }
}

function bearerHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
  }
}

export interface ApiMessage {
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
  mime_type?: string | null
  file_name?: string | null
  file_size?: number | null
  duration?: number | null
  whatsapp_message_id?: string | null
  reactions?: Array<{
    emoji: string
    user_id?: number
    actor?: 'business' | 'contact'
    created_at: string
  }>
  confidence_score?: number
  detected_dialect?: string
}

export interface ApiChannel {
  id?: number
  type: string
  page_name: string | null
}

export interface ApiConversation {
  id: number
  sender_id: string
  sender_name: string | null
  sender_email: string | null
  subject: string | null
  status: string
  ai_enabled: boolean
  last_message_at: string | null
  channel: ApiChannel
  latest_message?: ApiMessage | null
  assigned_agent_id?: number | null
  assigned_at?: string | null
}

function normalizeConversation(raw: ApiConversation & { messages?: ApiMessage[] }): ApiConversation {
  const latest = raw.latest_message
    ?? (raw.messages && raw.messages.length > 0 ? raw.messages[raw.messages.length - 1] : null)
    ?? null
  return {
    id: raw.id,
    sender_id: raw.sender_id,
    sender_name: raw.sender_name,
    sender_email: raw.sender_email ?? null,
    subject: raw.subject ?? null,
    status: raw.status,
    ai_enabled: raw.ai_enabled ?? true,
    last_message_at: raw.last_message_at,
    channel: raw.channel,
    latest_message: latest,
    assigned_agent_id: raw.assigned_agent_id,
    assigned_at: raw.assigned_at,
  }
}

export function useInbox() {
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [messages, setMessages]           = useState<ApiMessage[]>([])
  const [selectedId, setSelectedId]       = useState<number | null>(null)
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [sending, setSending]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [msgError, setMsgError]           = useState<string | null>(null)
  const gmailIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const fetchConversations = useCallback(async (silent = false, filters?: {
    search?: string
    channel_type?: string
    status?: string
    ai_enabled?: boolean
    unread?: boolean
    date_from?: string
    date_to?: string
    requires_human?: boolean
    assigned_to_me?: boolean
  }) => {
    if (!silent) setLoadingConvs(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.channel_type) params.append('channel_type', filters.channel_type)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.ai_enabled !== undefined) params.append('ai_enabled', String(filters.ai_enabled))
      if (filters?.unread) params.append('unread', 'true')
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)
      if (filters?.requires_human) params.append('requires_human', 'true')
      if (filters?.assigned_to_me) params.append('assigned_to_me', 'true')
      
      const url = params.toString() ? `${API}/inbox?${params.toString()}` : `${API}/inbox`
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      const raw: (ApiConversation & { messages?: ApiMessage[] })[] = data.data ?? data
      setConversations(raw.map(normalizeConversation))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load'
      if (!silent) setError(msg)
    } finally {
      if (!silent) setLoadingConvs(false)
    }
  }, [])

  const fetchMessages = useCallback(async (convId: number) => {
    setLoadingMsgs(true)
    setMsgError(null)
    try {
      const res = await fetch(`${API}/inbox/${convId}/messages`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setMessages(data.messages ?? data)
    } catch (e: unknown) {
      setMsgError(e instanceof Error ? e.message : 'Failed to load messages')
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  const selectConversation = useCallback((id: number) => {
    setSelectedId(id)
    setMessages([])
    setMsgError(null)
    fetchMessages(id)
  }, [fetchMessages])

  const sendReply = useCallback(async (convId: number, text: string): Promise<boolean> => {
    setSending(true)
    try {
      const res = await fetch(`${API}/inbox/${convId}/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (data.message) setMessages(prev => [...prev, data.message as ApiMessage])
      fetchConversations(true)
      return true
    } catch {
      return false
    } finally {
      setSending(false)
    }
  }, [fetchConversations])

  const sendMediaReply = useCallback(async (convId: number, file: File, caption = '', mediaType?: string, voiceNote = false): Promise<ApiMessage | null> => {
    setSending(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('caption', caption)
      if (mediaType) form.append('media_type', mediaType)
      if (voiceNote) form.append('voice_note', '1')

      const res = await fetch(`${API}/inbox/${convId}/media`, {
        method: 'POST',
        headers: bearerHeaders(),
        body: form,
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message as ApiMessage])
        fetchConversations(true)
        return data.message as ApiMessage
      }
      return null
    } catch {
      return null
    } finally {
      setSending(false)
    }
  }, [fetchConversations])

  const toggleAi = useCallback(async (convId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/inbox/${convId}/toggle-ai`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, ai_enabled: data.ai_enabled } : c))
      return true
    } catch {
      return false
    }
  }, [])

  const reactToMessage = useCallback(async (messageId: number, emoji: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/messages/${messageId}/react`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ emoji }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m))
      return true
    } catch {
      return false
    }
  }, [])

  const getConversationTags = useCallback(async (conversationId: number) => {
    try {
      const res = await fetch(`${API}/inbox/${conversationId}/tags`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return await res.json()
    } catch {
      return []
    }
  }, [])

  const addTag = useCallback(async (conversationId: number, tag: string) => {
    try {
      const res = await fetch(`${API}/inbox/${conversationId}/tags`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tag }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const removeTag = useCallback(async (conversationId: number, tagId: number) => {
    try {
      const res = await fetch(`${API}/inbox/${conversationId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return true
    } catch {
      return false
    }
  }, [])

  const getAllTags = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tags/all`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return await res.json()
    } catch {
      return []
    }
  }, [])

  const submitFeedback = useCallback(async (messageId: number, feedback: 'positive' | 'negative', comment?: string, issueType?: string) => {
    try {
      const body: any = { feedback }
      if (comment) body.comment = comment
      if (issueType) body.issue_type = issueType
      
      const res = await fetch(`${API}/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return await res.json()
    } catch {
      return null
    }
  }, [])

  // Gmail: poll silently every 60s, only refresh UI if new messages arrived
  useEffect(() => {
    const pollGmail = async () => {
      try {
        const r = await fetch(`${API}/channels/gmail/fetch`, { headers: authHeaders() })
        const d = await r.json()
        if (d.fetched > 0) {
          fetchConversations(true)
          setSelectedId(id => { if (id !== null) fetchMessages(id); return id })
        }
      } catch {}
    }
    pollGmail()
    gmailIntervalRef.current = setInterval(pollGmail, 60_000)
    return () => { if (gmailIntervalRef.current) clearInterval(gmailIntervalRef.current) }
  }, [fetchConversations, fetchMessages])

  // Initial load only - no polling loop that causes UI churn
  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Real-time updates via Pusher - replaces polling entirely.
  // We fetch the current user's id once, then subscribe to their private
  // inbox channel and merge incoming events straight into state.
  useEffect(() => {
    let channelName: string | null = null

    async function subscribe() {
      try {
        const res = await fetch(`${API}/auth/user`, { headers: authHeaders() })
        if (!res.ok) return
        const user = await res.json()
        if (!user?.id) return

        channelName = `inbox.${user.id}`
        const echo = getEcho()

        echo.private(channelName).listen('.message.received', (payload: { message: ApiMessage; conversation: ApiConversation & { messages?: ApiMessage[] } }) => {
          const incomingConv = normalizeConversation({ ...payload.conversation, latest_message: payload.message })

          setConversations(prev => {
            const exists = prev.some(c => c.id === incomingConv.id)
            const merged = exists
              ? prev.map(c => c.id === incomingConv.id ? { ...c, ...incomingConv } : c)
              : [incomingConv, ...prev]
            // newest activity first
            return [...merged].sort((a, b) => new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime())
          })

          if (selectedIdRef.current === payload.message.conversation_id) {
            setMessages(prev => prev.some(m => m.id === payload.message.id)
              ? prev.map(m => m.id === payload.message.id ? { ...m, ...payload.message } : m)
              : [...prev, payload.message]
            )
          }
        })
      } catch {
        // silent - real-time is a nice-to-have, manual refresh still works
      }
    }

    subscribe()

    return () => {
      if (channelName) getEcho().leave(channelName)
    }
  }, [])

  useEffect(() => () => disconnectEcho(), [])

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null

  return {
    conversations, messages, selectedId, selectedConv,
    loadingConvs, loadingMsgs, sending, error, msgError,
    fetchConversations, selectConversation, sendReply, sendMediaReply, toggleAi, reactToMessage,
    getConversationTags, addTag, removeTag, getAllTags, submitFeedback,
  }
}