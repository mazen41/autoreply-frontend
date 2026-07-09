'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getEcho, disconnectEcho } from '../lib/echo'

const API = 'http://localhost:8000/api'

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

export interface ApiMessage {
  id: number
  conversation_id: number
  content: string
  direction: 'inbound' | 'outbound'
  is_ai: boolean
  status: string
  created_at: string
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
  last_message_at: string | null
  channel: ApiChannel
  latest_message?: ApiMessage | null
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
    last_message_at: raw.last_message_at,
    channel: raw.channel,
    latest_message: latest,
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

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    setError(null)
    try {
      const res = await fetch(`${API}/inbox`, { headers: authHeaders() })
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

  // Initial load only — no polling loop that causes UI churn
  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Real-time updates via Pusher — replaces polling entirely.
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
            setMessages(prev => prev.some(m => m.id === payload.message.id) ? prev : [...prev, payload.message])
          }
        })
      } catch {
        // silent — real-time is a nice-to-have, manual refresh still works
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
    fetchConversations, selectConversation, sendReply,
  }
}
