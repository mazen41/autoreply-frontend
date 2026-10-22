'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users, UserPlus, Shield, Eye, Crown, Trash2,
  Mail, Search
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
import { useLang } from '../../../lib/LangContext'

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
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
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
  const teamLoadGeneration = useRef(0)

  const fetchTeamMembers = useCallback(async (bid: number) => {
    const generation = ++teamLoadGeneration.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/businesses/${bid}/team`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (generation !== teamLoadGeneration.current) return
      setTeamMembers(Array.isArray(data) ? data : (data.members || data.data || []))
      setOwner(Array.isArray(data) ? null : (data.owner ?? null))
      const invitationsResponse = await fetch(`${API}/businesses/${bid}/team/invitations`, { headers: authHeaders() })
      if (generation !== teamLoadGeneration.current) return
      if (invitationsResponse.ok) {
        const invitationData = await invitationsResponse.json()
        setPendingInvitations(Array.isArray(invitationData) ? invitationData : [])
      } else {
        setPendingInvitations([])
      }
    } catch (cause) {
      if (generation === teamLoadGeneration.current) setError(cause instanceof Error ? cause.message : L('Could not load team members.', 'تعذر تحميل أعضاء الفريق.'))
    } finally {
      if (generation === teamLoadGeneration.current) setLoading(false)
    }
  }, [L])

  const fetchBusinessId = useCallback(async () => {
    try {
      const selectedBusinessId = getSelectedBusinessId()
      if (!selectedBusinessId) {
        teamLoadGeneration.current++
        setBusinessId(null)
        setTeamMembers([])
        setPendingInvitations([])
        setOwner(null)
        throw new Error(L('Select a business before opening team settings.', 'اختر نشاطًا تجاريًا قبل فتح إعدادات الفريق.'))
      }
      setBusinessId(selectedBusinessId)
      await fetchTeamMembers(selectedBusinessId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L('Could not load team.', 'تعذر تحميل الفريق.'))
      setLoading(false)
    }
  }, [fetchTeamMembers, L])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const syncBusiness = () => { void fetchBusinessId() }
    syncBusiness()
    window.addEventListener('naz:business-changed', syncBusiness)
    window.addEventListener('storage', syncBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', syncBusiness)
      window.removeEventListener('storage', syncBusiness)
    }
  }, [fetchBusinessId])

  const handleInvitation = async (invitationId: number, action: 'resend' | 'revoke') => {
    if (!businessId) return
    try {
      const response = await fetch(`${API}/businesses/${businessId}/team/invitations/${invitationId}${action === 'resend' ? '/resend' : ''}`, {
        method: action === 'resend' ? 'POST' : 'DELETE',
        headers: authHeaders(),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || `Could not ${action} invitation.`)
      toast.success(action === 'resend' ? L('Invitation resent', 'تمت إعادة إرسال الدعوة') : L('Invitation revoked', 'تم إلغاء الدعوة'))
      await fetchTeamMembers(businessId)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : L(`Could not ${action} invitation.`, `تعذر ${action === 'resend' ? 'إعادة إرسال' : 'إلغاء'} الدعوة.`))
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error(L('Please enter an email address', 'أدخل عنوان البريد الإلكتروني'))
      return
    }
    setSending(true)
    try {
      if (!businessId) throw new Error(L('Business information is unavailable. Reload the page and try again.', 'بيانات النشاط غير متاحة. أعد تحميل الصفحة وحاول مرة أخرى.'))
      const res = await fetch(`${API}/businesses/${businessId}/team/invite`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
        })
      if (!res.ok) {
        const result = await res.json().catch(() => ({}))
        throw new Error(result.message || result.error || L('Invitation request failed.', 'تعذر إرسال الدعوة.'))
      }
      toast.success(L('Invitation sent successfully', 'تم إرسال الدعوة بنجاح'))
      setShowInviteModal(false)
      setInviteEmail('')
      await fetchTeamMembers(businessId)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : L('Failed to send invitation', 'فشل إرسال الدعوة'))
    } finally {
      setSending(false)
    }
  }

  const handleRemove = async (memberId: number) => {
    if (!confirm(L('Are you sure you want to remove this member?', 'هل أنت متأكد من إزالة هذا العضو؟'))) return
    try {
      if (!businessId) throw new Error(L('Business information is unavailable.', 'بيانات النشاط غير متاحة.'))
      const res = await fetch(`${API}/businesses/${businessId}/team/${memberId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        })
      if (!res.ok) throw new Error(L('Member removal failed.', 'فشلت إزالة العضو.'))
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success(L('Member removed', 'تمت إزالة العضو'))
    } catch {
      toast.error(L('Failed to remove member', 'فشلت إزالة العضو'))
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
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader
        title={L('Team', 'الفريق')}
        description={L('Manage team access, roles, invitations, and member permissions for this business.', 'أدر وصول الفريق وأدواره ودعواته وصلاحيات أعضائه لهذا النشاط.')}
        primaryAction={
          canManageTeam ? (
            <Button variant="primary"
              icon={<UserPlus size={14} />}
              onClick={() => setShowInviteModal(true)}
            >
              {L('Invite member', 'دعوة عضو')}
            </Button>
          ) : undefined
        }
      />

      {!access.loading && access.error && (
        <div role="alert" className="border border-error/30 bg-error/5 px-4 py-3 text-sm">
          {access.error} {L('Choose another business from the selector.', 'اختر نشاطًا تجاريًا آخر من القائمة.')}
        </div>
      )}

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchBusinessId()}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={L('Total members', 'إجمالي الأعضاء')}
          value={stats.total}
          icon={<Users size={18} />}
        />
        <MetricCard
          label={L('Agents', 'الوكلاء')}
          value={stats.agents}
          icon={<Shield size={18} />}
        />
        <MetricCard
          label={L('Active members', 'الأعضاء النشطون')}
          value={stats.active}
          icon={<span className="inline-flex h-3 w-3 rounded-full bg-success ring-4 ring-success/10" />}
        />
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={L('Search members…', 'ابحث عن عضو…')}
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
            <p className="px-5 py-8 text-center text-sm text-text-muted">{L('Team data is unavailable until the request succeeds.', 'بيانات الفريق غير متاحة حتى ينجح الطلب.')}</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={L('No team members found', 'لم يتم العثور على أعضاء')}
              description={search ? L('Try a different search term.', 'جرّب كلمة بحث أخرى.') : L('Invite a teammate to get started.', 'ادعُ أحد أعضاء الفريق للبدء.')}
              primaryAction={
                !search && canManageTeam ? (
                  <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setShowInviteModal(true)}>
                    {L('Invite member', 'دعوة عضو')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_160px_120px_80px] gap-4 px-5 py-2.5 bg-surface-elevated/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{L('Member', 'العضو')}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{L('Role', 'الدور')}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{L('Status', 'الحالة')}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary text-end">{L('Actions', 'الإجراءات')}</span>
              </div>

              {filtered.map((member, idx) => {
                const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer
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
                        <span className="ms-1">{L(rc.label, rc.label === 'Owner' ? 'المالك' : rc.label === 'Manager' ? 'مدير' : rc.label === 'Agent' ? 'وكيل' : 'مشاهد')}</span>
                      </Badge>
                    </div>

                    {/* Status */}
                    <div>
                      <Badge variant={member.is_active ? 'success' : 'outline'} dot size="sm">
                        {member.is_active ? L('Active', 'نشط') : L('Inactive', 'غير نشط')}
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
                          aria-label={L(`Remove ${member.user.name}`, `إزالة ${member.user.name}`)}
                          title={L('Remove member', 'إزالة العضو')}
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
              <h2 className="text-sm font-semibold text-text-primary">{L('Pending invitations', 'الدعوات المعلقة')}</h2>
              <p className="mt-1 text-xs text-text-tertiary">{L('Invited users join only after accepting the invitation.', 'ينضم المدعوون بعد قبول الدعوة فقط.')}</p>
            </div>
            <div className="divide-y divide-border/50">
              {pendingInvitations.map(invitation => (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{invitation.email}</p>
                    <p className="text-xs text-text-secondary">{L(invitation.role, invitation.role === 'manager' ? 'مدير' : invitation.role === 'agent' ? 'وكيل' : invitation.role === 'viewer' ? 'مشاهد' : invitation.role)} · {L('expires', 'تنتهي')} {new Date(invitation.expires_at).toLocaleDateString(isRTL ? 'ar' : 'en')}</p>
                  </div>
                  <div className="flex gap-2">
                    {canManageTeam && <Button variant="secondary" size="sm" onClick={() => void handleInvitation(invitation.id, 'resend')}>{L('Resend', 'إعادة الإرسال')}</Button>}
                    {canManageTeam && <Button variant="ghost" size="sm" onClick={() => void handleInvitation(invitation.id, 'revoke')} className="text-error">{L('Revoke', 'إلغاء')}</Button>}
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
        title={L('Invite new member', 'دعوة عضو جديد')}
        size="sm"
      >
        <div className="space-y-4 p-5">
          <Input
            label={L('Email address', 'البريد الإلكتروني')}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            icon={<Mail size={14} />}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">{L('Role', 'الدور')}</label>
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
                    <div className="text-start">
                      <div className="font-semibold">{L(rc.label, role === 'manager' ? 'مدير' : role === 'agent' ? 'وكيل' : 'مشاهد')}</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {role === 'manager'
                          ? L('Runs business operations and support. No team or billing access.', 'يدير عمليات النشاط والدعم دون صلاحيات الفريق أو الفوترة.')
                          : role === 'agent'
                            ? L('Handles conversations and assigned work.', 'يتعامل مع المحادثات والمهام المسندة إليه.')
                            : L('Read-only. Cannot reply, assign, or change anything.', 'للقراءة فقط، دون الرد أو الإسناد أو التعديل.')}
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
              {L('Send invitation', 'إرسال الدعوة')}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowInviteModal(false)}
            >
              {L('Cancel', 'إلغاء')}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
