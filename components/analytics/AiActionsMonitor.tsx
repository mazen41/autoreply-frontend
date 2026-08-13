'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import { Bot, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'

export default function AiActionsMonitor({ businessId }: { businessId: number }) {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()
  const [actions, setActions] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed' | 'failed'>('all')

  useEffect(() => {
    if (businessId) {
      fetchActions(businessId)
      fetchStatistics(businessId)
    }
  }, [businessId])

  const fetchActions = async (bid: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${bid}/ai-actions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setActions(data.data || [])
    } catch (error) {
      console.error('Failed to fetch actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async (bid: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${bid}/ai-actions/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const handleApprove = async (actionId: number) => {
    if (!businessId) return
    
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/ai-actions/${actionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchActions(businessId)
      fetchStatistics(businessId)
    } catch (error) {
      console.error('Failed to approve action:', error)
    }
  }

  const handleReject = async (actionId: number) => {
    if (!businessId) return
    
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/ai-actions/${actionId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchActions(businessId)
      fetchStatistics(businessId)
    } catch (error) {
      console.error('Failed to reject action:', error)
    }
  }

  const filteredActions = actions.filter(action => {
    if (filter === 'all') return true
    return action.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle size={16} className="text-green-500" />
      case 'failed': return <XCircle size={16} className="text-red-500" />
      case 'pending': return <Clock size={16} className="text-yellow-500" />
      default: return <AlertCircle size={16} className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'text-green-500'
      case 'failed': return 'text-red-500'
      case 'pending': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {statistics.total}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'تم التنفيذ' : 'Executed'}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {statistics.executed}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-500" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'فشل' : 'Failed'}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {statistics.failed}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'معدل النجاح' : 'Success Rate'}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {statistics.success_rate}%
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'executed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status ? 'font-bold' : ''
            }`}
            style={{
              background: filter === status ? 'var(--accent)' : 'var(--surface-elevated)',
              color: filter === status ? 'var(--on-accent-text)' : 'var(--text-primary)',
              border: filter === status ? 'none' : '1px solid var(--border)',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'لا توجد إجراءات' : 'No actions found'}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredActions.map((action) => (
              <div key={action.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(action.status)}
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {action.action_type}
                    </span>
                    <span className={`text-xs ${getStatusColor(action.status)}`}>
                      {action.status}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(action.created_at).toLocaleString()}
                  </div>
                </div>

                {action.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(action.id)}
                      className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--on-accent-text)',
                      }}
                    >
                      {isRTL ? 'موافقة' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(action.id)}
                      className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {isRTL ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
