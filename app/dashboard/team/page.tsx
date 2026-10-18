'use client'

import { useState, useEffect } from 'react'
import {
  Users, UserPlus, Shield, Eye, Crown, Trash2,
  MoreHorizontal, Mail, Search, X
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonRow } from '../../../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useBusinessAccess } from '../../../lib/businessAccess'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/json',
    ...getBusinessHeaders(),
  }
}

interface TeamMember {
  id: number
  business_id: number
  user_id: number
  role: 'owner' | 'manager' | 'agent' | 'viewer'
  is_active: boolean
  invited_at: string | null
  joined_at: string | null
  user: { id: number; name: string; email: string }
}

interface PendingInvitation {
  id: number
  email: string
  role: string
  expires_at: string
  created_at: string
}

const ROLE_CONFIG: Record<string, { label: string; variant: 'default' | 'ai' | 'warning' | 'success' | 'error' | 'outline'; icon: React.ReactNode }> = {
  owner: { label: 'Owner', variant: 'ai', icon: <Crown size={10} /> },
  manager: { label: 'Manager', variant: 'warning', icon: <Shield size={10} /> },
  agent: { label: 'Agent', variant: 'success', icon: <Shield size={10} /> },
  viewer: { label: 'Viewer', variant: 'outline', icon: <Eye size={10} /> },
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const GRADIENT_COLORS = [
  'from-info to-brand',
  'from-success to-success',
  'from-brand to-brand',
  'from-warning to-warning',
  'from-error to-brand',
  'from-brand to-info',
]

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'agent' | 'viewer'>('agent')
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const access = useBusinessAccess()
  const canManageTeam = access.can('manage_team')
  const [owner, setOwner] = useState<{ id: number; name: string; email: string } | null>(null)

  useEffect(() => { fetchBusinessId() }, [])

  const fetchBusinessId = async () => {
    try {
      const selectedBusinessId = getSelectedBusinessId()
      if (!selectedBusinessId) throw new Error('Select a business before opening team settings.')
      setBusinessId(selectedBusinessId)
      await fetchTeamMembers(selectedBusinessId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load team.')
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (bid: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/businesses/${bid}/team`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setTeamMembers(Array.isArray(data) ? data : (data.members || data.data || []))
      setOwner(Array.isArray(data) ? null : (data.owner ?? null))
      const invitationsResponse = await fetch(`${API}/businesses/${bid}/team/invitations`, { headers: authHeaders() })
      if (invitationsResponse.ok) {
        const invitationData = await invitationsResponse.json()
        setPendingInvitations(Array.isArray(invitationData) ? invitationData : [])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load team members.')
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (invitationId: number, action: 'resend' | 'revoke') => {
    if (!businessId) return
    try {
      const response = await fetch(`${API}/businesses/${businessId}/team/invitations/${invitationId}${action === 'resend' ? '/resend' : ''}`, {
        method: action === 'resend' ? 'POST' : 'DELETE',
        headers: authHeaders(),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || `Could not ${action} invitation.`)
      toast.success(action === 'resend' ? 'Invitation resent' : 'Invitation revoked')
      await fetchTeamMembers(businessId)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : `Could not ${action} invitation.`)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    setSending(true)
    try {
      if (!businessId) throw new Error('Business information is unavailable. Reload the page and try again.')
      const res = await fetch(`${API}/businesses/${businessId}/team/invite`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        })
      if (!res.ok) throw new Error('Invitation request failed.')
      toast.success('Invitation sent successfully')
      setShowInviteModal(false)
      setInviteEmail('')
      await fetchTeamMembers(businessId)
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  const handleRemove = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      if (!businessId) throw new Error('Business information is unavailable.')
      const res = await fetch(`${API}/businesses/${businessId}/team/${memberId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        })
      if (!res.ok) throw new Error('Member removal failed.')
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  // Owner appears exactly once, as a non-removable row, ahead of team members.
  const ownerRow: TeamMember | null = owner
    ? { id: -1, business_id: businessId ?? 0, user_id: owner.id, role: 'owner', is_active: true, invited_at: null, joined_at: null, user: owner }
    : null
  const allRows: TeamMember[] = ownerRow ? [ownerRow, ...teamMembers] : teamMembers

  const filtered = allRows.filter(m =>
    !search || m.user.name.toLowerCase().includes(search.toLowerCase()) || m.user.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: allRows.length,
    agents: teamMembers.filter(m => m.role === 'agent').length,
    active: allRows.filter(m => m.is_active).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage access and permissions for your team members."
        primaryAction={
          canManageTeam ? (
            <Button
              icon={<UserPlus size={14} />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Member
            </Button>
          ) : undefined
        }
      />

      {!access.loading && access.error && (
        <div role="alert" className="border border-error/30 bg-error/5 px-4 py-3 text-sm">
          {access.error} Choose another business from the selector.
        </div>
      )}

      {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchBusinessId()}>Retry</Button></div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Members"
          value={stats.total}
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Active Agents"
          value={stats.agents}
          icon={<Shield size={18} />}
        />
        <MetricCard
          label="Online Now"
          value={stats.active}
          icon={<span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-success" /></span>}
        />
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          onClear={() => setSearch('')}
          icon={<Search size={14} />}
        />
      </div>

      {/* Team List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border/50">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">Team data is unavailable until the request succeeds.</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members found"
              description={search ? 'Try a different search term.' : 'Invite your first team member to get started.'}
              primaryAction={
                !search ? (
                  <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setShowInviteModal(true)}>
                    Invite Member
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_160px_120px_80px] gap-4 px-5 py-2.5 bg-surface-elevated/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Member</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Role</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Status</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary text-right">Actions</span>
              </div>

              {filtered.map((member, idx) => {
                const rc = ROLE_CONFIG[member.role]
                const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length]
                return (
                  <div
                    key={member.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_160px_120px_80px] gap-3 sm:gap-4 items-center px-5 py-3.5 hover:bg-surface-elevated/40 transition-colors"
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {getInitials(member.user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{member.user.name}</div>
                        <div className="text-xs text-text-tertiary truncate">{member.user.email}</div>
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <Badge variant={rc.variant} size="sm">
                        {rc.icon}
                        <span className="ml-1">{rc.label}</span>
                      </Badge>
                    </div>

                    {/* Status */}
                    <div>
                      <Badge variant={member.is_active ? 'success' : 'outline'} dot size="sm">
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      {canManageTeam && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRemove(member.id)}
                          className="text-text-tertiary hover:text-error"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingInvitations.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Pending invitations</h2>
              <p className="mt-1 text-xs text-text-tertiary">Invited users join only after accepting the invitation.</p>
            </div>
            <div className="divide-y divide-border/50">
              {pendingInvitations.map(invitation => (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{invitation.email}</p>
                    <p className="text-xs text-text-secondary">{ROLE_CONFIG[invitation.role]?.label || invitation.role} · expires {new Date(invitation.expires_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {canManageTeam && <Button variant="outline" size="sm" onClick={() => void handleInvitation(invitation.id, 'resend')}>Resend</Button>}
                    {canManageTeam && <Button variant="ghost" size="sm" onClick={() => void handleInvitation(invitation.id, 'revoke')} className="text-error">Revoke</Button>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New Member"
        size="sm"
      >
        <div className="space-y-4 p-5">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            icon={<Mail size={14} />}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['manager', 'agent', 'viewer'] as const).map(role => {
                const rc = ROLE_CONFIG[role]
                const isSelected = inviteRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setInviteRole(role)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-brand/40 bg-brand/5 text-text-primary'
                        : 'border-border bg-surface-elevated text-text-secondary hover:border-border-hover'
                    }`}
                  >
                    {rc.icon}
                    <div className="text-left">
                      <div className="font-semibold">{rc.label}</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {role === 'manager'
                          ? 'Runs business operations and support. No team or billing.'
                          : role === 'agent'
                            ? 'Handles conversations and assigned work.'
                            : 'Read-only. Cannot reply, assign, or change anything.'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleInvite}
              loading={sending}
              icon={<Mail size={14} />}
            >
              Send Invitation
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
