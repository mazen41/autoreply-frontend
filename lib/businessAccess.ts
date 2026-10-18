'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSelectedBusinessId } from './businessContext'

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

/** Pure check against the backend-provided permission list. */
export function hasPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission)
}

export interface BusinessAccess {
  role: string | null
  permissions: string[]
  loading: boolean
  error: string | null
  can: (permission: string) => boolean
  refresh: () => void
}

function readToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Permissions for the selected business, from GET /businesses/{id}/me.
 * The UI uses this list; it never derives roles itself. Re-fetches when the
 * selected business changes. A 403/404 means no access: permissions are cleared.
 */
export function useBusinessAccess(): BusinessAccess {
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    const onChange = () => refresh()
    window.addEventListener('naz:business-changed', onChange)
    return () => window.removeEventListener('naz:business-changed', onChange)
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    const businessId = getSelectedBusinessId()
    if (!businessId) return // reported as "no business selected" in the return value

    fetch(`${API_BASE}/businesses/${businessId}/me`, {
      headers: { Authorization: `Bearer ${readToken()}`, Accept: 'application/json', 'X-Business-Id': String(businessId) },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw Object.assign(new Error(res.status === 404 || res.status === 403 ? 'No access to this business.' : `Error ${res.status}`), { status: res.status })
        }
        return res.json() as Promise<{ role: string | null; permissions: string[] }>
      })
      .then((data) => {
        if (cancelled) return
        setRole(data.role ?? null)
        setPermissions(Array.isArray(data.permissions) ? data.permissions : [])
      })
      .catch((cause: Error) => {
        if (cancelled) return
        setRole(null)
        setPermissions([])
        setError(cause.message || 'Could not load permissions.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  const can = useCallback((permission: string) => hasPermission(permissions, permission), [permissions])

  const noBusiness = typeof window !== 'undefined' && getSelectedBusinessId() === null
  if (noBusiness) {
    return { role: null, permissions: [], loading: false, error: 'No business selected.', can: () => false, refresh }
  }

  return { role, permissions, loading, error, can, refresh }
}
