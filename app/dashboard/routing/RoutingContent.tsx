'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface Team {
  id: number
  name: string
  description: string | null
  color: string | null
  is_active: boolean
  created_at: string
}

interface TeamMember {
  id: number
  user_id: number
  role: string
  is_active: boolean
  is_available: boolean
  max_conversations: number | null
  working_hours: any
  team_id: number | null
}

interface User {
  id: number
  name: string
  email: string
}

export default function RoutingContent() {
  const { isRTL, t } = useLang()
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<(TeamMember & { user?: User })[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [routingStats, setRoutingStats] = useState<any>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [availableAgents, setAvailableAgents] = useState<any[]>([])

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '' })
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'agent', max_conversations: '', working_hours: null })

  useEffect(() => {
    fetchTeams()
    fetchMembers()
    fetchRoutingStats()
  }, [])

  const fetchTeams = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/teams`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setTeams(data)
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/team`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setMembers(data)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  const fetchRoutingStats = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/stats`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setRoutingStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch routing stats:', error)
    }
  }

  const fetchAvailableAgents = async (teamId?: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const url = teamId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/available-agents?team_id=${teamId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/available-agents`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setAvailableAgents(data.agents || data)
      }
    } catch (error) {
      console.error('Failed to fetch available agents:', error)
    }
  }

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      toast.error('Please enter a team name')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(teamForm),
      })

      if (res.ok) {
        toast.success('Team created successfully')
        setShowTeamModal(false)
        setTeamForm({ name: '', description: '', color: '' })
        fetchTeams()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create team')
      }
    } catch (error) {
      toast.error('Failed to create team')
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(teamForm),
      })

      if (res.ok) {
        toast.success('Team updated successfully')
        setShowTeamModal(false)
        setEditingTeam(null)
        setTeamForm({ name: '', description: '', color: '' })
        fetchTeams()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update team')
      }
    } catch (error) {
      toast.error('Failed to update team')
    }
  }

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/teams/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Team deleted successfully')
        fetchTeams()
      } else {
        toast.error('Failed to delete team')
      }
    } catch (error) {
      toast.error('Failed to delete team')
    }
  }

  const handleSetAvailability = async (agentId: number, isAvailable: boolean) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/availability/${agentId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ is_available: isAvailable }),
      })

      if (res.ok) {
        toast.success('Availability updated')
        fetchMembers()
      } else {
        toast.error('Failed to update availability')
      }
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  const handleRoundRobin = async (conversationId: number, teamId?: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const url = teamId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/round-robin/${conversationId}?team_id=${teamId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/routing/round-robin/${conversationId}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Conversation assigned successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to assign conversation')
      }
    } catch (error) {
      toast.error('Failed to assign conversation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Smart Routing
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage teams, agent availability, and conversation routing
        </p>
      </motion.div>

      {/* Routing Statistics */}
      {routingStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Agents</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{routingStats.total_agents}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Available Agents</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{routingStats.available_agents}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Unassigned Conversations</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{routingStats.unassigned_conversations}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Assigned Conversations</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{routingStats.assigned_conversations}</p>
          </div>
        </motion.div>
      )}

      {/* Teams Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Teams
          </h2>
          <button
            onClick={() => { setEditingTeam(null); setTeamForm({ name: '', description: '', color: '' }); setShowTeamModal(true) }}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
          >
            + Create Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'var(--surface-elevated)' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>No teams created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {team.color && (
                      <div className="w-4 h-4 rounded-full" style={{ background: team.color }}></div>
                    )}
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${team.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                    {team.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {team.description && (
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{team.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingTeam(team); setTeamForm({ name: team.name, description: team.description || '', color: team.color || '' }); setShowTeamModal(true) }}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => fetchAvailableAgents(team.id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    View Agents
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Team Members Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
          Team Members
        </h2>

        {members.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'var(--surface-elevated)' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>No team members</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {member.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{member.user?.name || 'Unknown'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: 'var(--text-tertiary)' }}>
                      {member.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${member.is_available ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                      {member.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSetAvailability(member.user_id, !member.is_available)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    {member.is_available ? 'Set Offline' : 'Set Online'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Available Agents Section */}
      {availableAgents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="premium-card p-6"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
            Available Agents ({availableAgents.length})
          </h2>
          <div className="space-y-3">
            {availableAgents.map((agent) => (
              <div
                key={agent.user_id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {agent.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{agent.email}</p>
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Active: {agent.active_conversations}/{agent.max_conversations || '∞'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingTeam ? 'Edit Team' : 'Create Team'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Team Name *</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g., Sales Team"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Team description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Color</label>
                <input
                  type="color"
                  value={teamForm.color}
                  onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                  className="w-full h-10 rounded-xl cursor-pointer"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowTeamModal(false); setEditingTeam(null); setTeamForm({ name: '', description: '', color: '' }) }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                {editingTeam ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}