'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../../../lib/LangContext'
import WorkflowBuilder from '../../../../components/automations/WorkflowBuilder'
import { Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'delay' | 'action'
  label: string
  config: Record<string, any>
  position: { x: number; y: number }
}

interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

export default function WorkflowBuilderPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: number; name: string }>>([])
  const [availableBots, setAvailableBots] = useState<Array<{ id: number; name: string }>>([])
  const [availableSequences, setAvailableSequences] = useState<Array<{ id: number; name: string }>>([])
  const [workflowId, setWorkflowId] = useState<number | null>(null)

  // Fetch available agents, bots, and sequences
  useEffect(() => {
    const token = getToken()
    if (!token) return

    // Fetch team members (agents)
    fetch(`${API}/api/businesses/team`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) {
          setAvailableAgents(data.data.map((m: any) => ({ id: m.user_id, name: m.name })))
        }
      })
      .catch(() => {})

    // Fetch bots
    fetch(`${API}/api/bots`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.bots) {
          setAvailableBots(data.bots.map((b: any) => ({ id: b.id, name: b.name })))
        }
      })
      .catch(() => {})

    // Fetch sequences
    fetch(`${API}/api/sequences`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) {
          setAvailableSequences(data.data.map((s: any) => ({ id: s.id, name: s.name })))
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = useCallback(async (nodes: WorkflowNode[], connections: WorkflowConnection[]): Promise<boolean> => {
    const token = getToken()
    if (!token) return false

    setSaving(true)
    try {
      // Transform nodes into the expected workflow format
      const triggerNode = nodes.find(n => n.type === 'trigger')
      const actionNodes = nodes.filter(n => n.type === 'action')
      const conditionNodes = nodes.filter(n => n.type === 'condition')
      const delayNodes = nodes.filter(n => n.type === 'delay')

      const payload = {
        name: L('New Workflow', 'سير عمل جديد'),
        description: L('Created via visual builder', 'تم الإنشاء عبر المنشئ المرئي'),
        trigger: triggerNode?.config || { type: 'keyword', conditions: [] },
        conditions: conditionNodes.map(n => n.config),
        actions: actionNodes.map(n => ({
          type: n.config.type,
          config: n.config,
        })),
      }

      const url = workflowId
        ? `${API}/api/workflows/${workflowId}`
        : `${API}/api/workflows`
      const method = workflowId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.id) setWorkflowId(data.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save workflow:', error)
      return false
    } finally {
      setSaving(false)
    }
  }, [workflowId, L])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{L('Workflow Builder', 'منشئ سير العمل')}</h1>
          <p className="text-xs text-[var(--text-secondary)]">{L('Design automation workflows visually', 'صمم سير العمل بشكل مرئي')}</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
            <Loader2 size={14} className="animate-spin" />
            {L('Saving...', 'جاري الحفظ...')}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilder
          onSave={handleSave}
          availableAgents={availableAgents}
          availableBots={availableBots}
          availableSequences={availableSequences}
        />
      </div>
    </div>
  )
}
