'use client'

// Shared helpers for authenticated attachment media across the inbox.
// Extracted from MessageBubble.tsx so MediaViewer can reuse the exact same
// fetch/cleanup logic rather than duplicating it.

import { useEffect, useState } from 'react'
import { getBusinessHeaders } from './businessContext'

export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function absoluteMediaUrl(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

export function messageMediaUrl(messageId: number, mode: 'inline' | 'download') {
  return `${API_ORIGIN}/api/messages/${messageId}/media?disposition=${mode}`
}

export function formatFileSize(size?: number | null) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

// Fetches a message's media through the authenticated endpoint and exposes
// it as a local object URL (revoked on unmount/changing message). Used by
// both the inline attachment card and the full-screen viewer so both always
// agree on what "the original file" is.
export function useAuthenticatedBlob(messageId: number, directUrl: string, isRemote: boolean) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let disposed = false
    let objectUrl: string | null = null
    setLoading(true)
    setError(false)
    setUrl('')

    const load = async () => {
      try {
        if (messageId <= 0 || isRemote) {
          if (!disposed) { setUrl(directUrl); setLoading(false) }
          return
        }
        const response = await fetch(messageMediaUrl(messageId, 'inline'), {
          headers: { Authorization: `Bearer ${getToken()}`, Accept: '*/*', ...getBusinessHeaders() },
        })
        if (!response.ok) throw new Error('Attachment could not be loaded')
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!disposed) { setUrl(objectUrl); setLoading(false) }
      } catch {
        if (!disposed) { setError(true); setLoading(false) }
      }
    }

    void load()
    return () => {
      disposed = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [messageId, directUrl, isRemote])

  return { url, loading, error }
}
