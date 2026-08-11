'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import AiActionsMonitor from '../../../components/analytics/AiActionsMonitor'

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

interface TeamMember {
  id: number
  business_id: number
  user_id: number
  role: 'owner' | 'agent' | 'viewer'
  is_active: boolean
  invited_at: string | null
  joined_at: string | null
  user: {
    id: number
    name: string
    email: string
  }
}

export default function TeamPage() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agent' | 'viewer'>('agent')
  const [businessId, setBusinessId] = useState<number | null>(null)

  useEffect(() => {
    fetchBusinessId()
  }, [])

  const fetchBusinessId = async () => {
    try {
      const res = await fetch(`${API}/auth/user`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const user = await res.json()
      if (user.business_id) {
        setBusinessId(user.business_id)
        fetchTeamMembers(user.business_id)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load business info')
    }
  }

  const fetchTeamMembers = async (bid: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/businesses/${bid}/team`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setTeamMembers(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!businessId || !inviteEmail) return

    try {
      const res = await fetch(`${API}/businesses/${businessId}/team/invite`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setShowInviteModal(false)
        setInviteEmail('')
        fetchTeamMembers(businessId)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send invitation')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!businessId) return
    if (!confirm(isRTL ? 'هل أنت متأكد من إزالة هذا العضو؟' : 'Are you sure you want to remove this member?')) return

    try {
      const res = await fetch(`${API}/businesses/${businessId}/team/${memberId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove member')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      owner: { ar: 'المالك', en: 'Owner' },
      agent: { ar: 'وكيل', en: 'Agent' },
      viewer: { ar: 'مشاهد', en: 'Viewer' },
    }
    return labels[role]?.[isRTL ? 'ar' : 'en'] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      agent: 'bg-accent/10 text-accent border-accent/20',
      viewer: 'bg-surface-elevated text-text-secondary border-border',
    }
    return colors[role] || colors.viewer
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-text-primary mb-2">
            {isRTL ? 'فريق العمل' : 'Team Members'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isRTL ? 'إدارة الوصول والصلاحيات لفريقك' : 'Manage access and permissions for your team'}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
        >
          {isRTL ? 'دعوة عضو' : 'Invite Member'}
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-text-tertiary">
          {error}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border/60">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-surface-elevated/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                  {member.user.name[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate">
                    {member.user.name}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {member.user.email}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getRoleColor(member.role)}`}>
                  {getRoleLabel(member.role)}
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title={isRTL ? 'إزالة' : 'Remove'}
                  >
                    ✕
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          {teamMembers.length === 0 && (
            <div className="text-center py-12 text-sm text-text-tertiary">
              {isRTL ? 'لا يوجد أعضاء في الفريق' : 'No team members yet'}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowInviteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {isRTL ? 'دعوة عضو جديد' : 'Invite New Member'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/40"
                  placeholder={isRTL ? 'example@email.com' : 'example@email.com'}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {isRTL ? 'الدور' : 'Role'}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'agent' | 'viewer')}
                  className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/40"
                >
                  <option value="agent">{isRTL ? 'وكيل' : 'Agent'}</option>
                  <option value="viewer">{isRTL ? 'مشاهد' : 'Viewer'}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleInvite}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
                >
                  {isRTL ? 'إرسال الدعوة' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary text-sm font-bold hover:bg-surface-elevated/80 transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AI Actions Monitor */}
      <div className="mt-8">
        {businessId ? <AiActionsMonitor businessId={businessId} /> : (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
          </div>
        )}
      </div>
    </div>
  )
}
