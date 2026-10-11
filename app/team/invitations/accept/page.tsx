'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'naz_team_invitation_token'

interface PendingInvitation {
  id: number
  role: string
  expires_at: string
  business?: { business_name?: string }
}

function authToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function AcceptTeamInvitationPage() {
  const router = useRouter()
  const [invitationToken, setInvitationToken] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Checking invitation…')
  const [submitting, setSubmitting] = useState(false)
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])

  useEffect(() => {
    const fromLink = window.location.hash.match(/(?:^|[&#])token=([^&]+)/)?.[1]
    const token = fromLink ? decodeURIComponent(fromLink) : window.sessionStorage.getItem(TOKEN_KEY) || ''
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token)
      setInvitationToken(token)
      setStatus(authToken() ? 'Your invitation is ready to accept.' : 'Sign in or create an account with the invited email, then return here to accept.')
      if (authToken()) void loadInvitations()
    } else {
      const savedToken = window.sessionStorage.getItem(TOKEN_KEY) || ''
      if (savedToken) {
        setInvitationToken(savedToken)
        setStatus(authToken() ? 'Your invitation is ready to accept.' : 'Sign in or create an account with the invited email, then return here to accept.')
      } else if (authToken()) {
        void loadInvitations()
      } else {
        setError('Sign in to review invitations sent to your email, or open the latest invitation email.')
        setStatus('')
      }
    }
  }, [])

  const loadInvitations = async () => {
    try {
      const response = await fetch(`${API}/api/team/invitations`, {
        headers: { Authorization: `Bearer ${authToken()}`, Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Could not load your invitations.')
      const data = await response.json()
      setInvitations(Array.isArray(data) ? data : [])
      setStatus(Array.isArray(data) && data.length ? 'Review and accept an invitation below.' : 'There are no pending invitations for your account.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your invitations.')
      setStatus('')
    }
  }

  const accept = async () => {
    const bearer = authToken()
    if (!bearer) {
      setError('Sign in with the invited email before accepting this invitation.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/team/invitations/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not accept this invitation.')
      window.sessionStorage.removeItem(TOKEN_KEY)
      setStatus('Invitation accepted. Opening your workspace…')
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not accept this invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  const acceptListedInvitation = async (id: number) => {
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/team/invitations/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}`, Accept: 'application/json' },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not accept this invitation.')
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not accept this invitation.')
      await loadInvitations()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-sm">
        <h1 className="text-xl font-semibold text-text-primary">Join a team workspace</h1>
        {status && <p className="mt-3 text-sm text-text-secondary">{status}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
        {invitationToken && authToken() ? (
          <button disabled={submitting} onClick={accept} className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text disabled:opacity-60">
            {submitting ? 'Accepting…' : 'Accept invitation'}
          </button>
        ) : invitationToken ? (
          <div className="mt-6 flex gap-3 text-sm">
            <Link className="text-brand underline" href="/login?redirect=%2Fteam%2Finvitations%2Faccept">Sign in</Link>
            <Link className="text-brand underline" href="/register?redirect=%2Fteam%2Finvitations%2Faccept">Create account</Link>
          </div>
        ) : null}
        {!invitationToken && invitations.map(invitation => (
          <div key={invitation.id} className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">{invitation.business?.business_name || 'Team workspace'}</p>
              <p className="text-xs text-text-secondary">Invited as {invitation.role} · expires {new Date(invitation.expires_at).toLocaleDateString()}</p>
            </div>
            <button disabled={submitting} onClick={() => void acceptListedInvitation(invitation.id)} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-text disabled:opacity-60">
              {submitting ? 'Accepting…' : 'Accept'}
            </button>
          </div>
        ))}
      </section>
    </main>
  )
}
