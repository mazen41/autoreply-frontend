'use client'

import { useState, useEffect, useCallback } from 'react'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io') + '/api'

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

export interface SequenceStep {
  id: number
  sequence_id: number
  step_order: number
  step_type: 'message' | 'delay' | 'condition' | 'action'
  message?: string | null
  config?: Record<string, any> | null
  delay_hours: number
  delay_unit?: string | null
  condition_config?: Record<string, any> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sequence {
  id: number
  business_id: number
  name: string
  description?: string | null
  trigger_type: 'new_user' | 'tag_added' | 'no_reply' | 'manual' | 'order_created' | 'order_created'
  trigger_config?: Record<string, any> | null
  channel?: 'whatsapp' | 'telegram' | 'email' | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  settings?: Record<string, any> | null
  created_at: string
  updated_at: string
  total_enrollments?: number
  active_enrollments?: number
  steps?: SequenceStep[]
}

export interface SequenceEnrollment {
  id: number
  sequence_id: number
  conversation_id: number
  current_step: number
  status: 'active' | 'completed' | 'stopped' | 'failed'
  started_at?: string | null
  completed_at?: string | null
  stopped_at?: string | null
  next_execution_at?: string | null
  metadata?: Record<string, any> | null
  created_at: string
  updated_at: string
  sequence?: Sequence
  conversation?: {
    id: number
    sender_id: string
    sender_name: string | null
  }
}

export interface SequenceAnalytics {
  total_enrollments: number
  active_enrollments: number
  completed_enrollments: number
  stopped_enrollments: number
  failed_enrollments: number
  conversion_rate: number
  messages_sent: number
  total_steps: number
}

export function useSequences() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSequences = useCallback(async (filters?: {
    status?: string
    channel?: string
    trigger_type?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.channel) params.append('channel', filters.channel)
      if (filters?.trigger_type) params.append('trigger_type', filters.trigger_type)
      
      const url = params.toString() ? `${API}/sequences?${params.toString()}` : `${API}/sequences`
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setSequences(data.data ?? [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load sequences'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSequence = useCallback(async (id: number): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      return data.data ?? null
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load sequence'
      setError(msg)
      return null
    }
  }, [])

  const createSequence = useCallback(async (data: {
    name: string
    description?: string
    trigger_type?: string
    trigger_config?: Record<string, any>
    channel?: string
    settings?: Record<string, any>
    steps?: any[]
  }): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      const newSequence = result.data ?? null
      if (newSequence) {
        setSequences(prev => [newSequence, ...prev])
      }
      return newSequence
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create sequence'
      setError(msg)
      return null
    }
  }, [])

  const updateSequence = useCallback(async (id: number, data: {
    name?: string
    description?: string
    trigger_type?: string
    trigger_config?: Record<string, any>
    channel?: string
    settings?: Record<string, any>
    steps?: any[]
  }): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      const updatedSequence = result.data ?? null
      if (updatedSequence) {
        setSequences(prev => prev.map(s => s.id === id ? updatedSequence : s))
      }
      return updatedSequence
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update sequence'
      setError(msg)
      return null
    }
  }, [])

  const deleteSequence = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/sequences/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setSequences(prev => prev.filter(s => s.id !== id))
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete sequence'
      setError(msg)
      return false
    }
  }, [])

  const activateSequence = useCallback(async (id: number): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}/activate`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      const updatedSequence = result.data ?? null
      if (updatedSequence) {
        setSequences(prev => prev.map(s => s.id === id ? updatedSequence : s))
      }
      return updatedSequence
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to activate sequence'
      setError(msg)
      return null
    }
  }, [])

  const pauseSequence = useCallback(async (id: number): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}/pause`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      const updatedSequence = result.data ?? null
      if (updatedSequence) {
        setSequences(prev => prev.map(s => s.id === id ? updatedSequence : s))
      }
      return updatedSequence
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to pause sequence'
      setError(msg)
      return null
    }
  }, [])

  const duplicateSequence = useCallback(async (id: number): Promise<Sequence | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}/duplicate`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      const newSequence = result.data ?? null
      if (newSequence) {
        setSequences(prev => [newSequence, ...prev])
      }
      return newSequence
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to duplicate sequence'
      setError(msg)
      return null
    }
  }, [])

  const getSequenceAnalytics = useCallback(async (id: number): Promise<SequenceAnalytics | null> => {
    try {
      const res = await fetch(`${API}/sequences/${id}/analytics`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      return data.data ?? null
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get sequence analytics'
      setError(msg)
      return null
    }
  }, [])

  const getSequenceEnrollments = useCallback(async (id: number, filters?: {
    status?: string
  }): Promise<SequenceEnrollment[]> => {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      
      const url = params.toString() 
        ? `${API}/sequences/${id}/enrollments?${params.toString()}` 
        : `${API}/sequences/${id}/enrollments`
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      return data.data ?? []
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get sequence enrollments'
      setError(msg)
      return []
    }
  }, [])

  const enrollConversation = useCallback(async (sequenceId: number, conversationId: number, startStep = 0): Promise<SequenceEnrollment | null> => {
    try {
      const res = await fetch(`${API}/sequences/${sequenceId}/enroll`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          conversation_id: conversationId,
          start_step: startStep,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const result = await res.json()
      return result.data ?? null
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to enroll conversation'
      setError(msg)
      return null
    }
  }, [])

  const unenrollConversation = useCallback(async (sequenceId: number, enrollmentId: number, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/sequences/${sequenceId}/unenroll`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          reason: reason,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to unenroll conversation'
      setError(msg)
      return false
    }
  }, [])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  return {
    sequences,
    loading,
    error,
    fetchSequences,
    fetchSequence,
    createSequence,
    updateSequence,
    deleteSequence,
    activateSequence,
    pauseSequence,
    duplicateSequence,
    getSequenceAnalytics,
    getSequenceEnrollments,
    enrollConversation,
    unenrollConversation,
  }
}
