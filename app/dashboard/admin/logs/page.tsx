'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../../../../lib/LangContext'
import { RefreshCw, Copy, AlertTriangle, Info, Bug, AlertCircle } from 'lucide-react'
import Select from '../../../../components/ui/Select'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

interface LogEntry {
  level: string
  message: string
  timestamp: string | null
}

export default function SystemLogsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = new URLSearchParams()
      if (levelFilter) params.append('level', levelFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`${API}/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [levelFilter, searchQuery])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchLogs])

  const levelColors: Record<string, string> = {
    ERROR: 'text-error bg-error/10',
    WARNING: 'text-warning bg-warning/10',
    INFO: 'text-info bg-info/10',
    DEBUG: 'text-gray-500 bg-gray-500/10',
  }

  const levelIcons: Record<string, React.ReactNode> = {
    ERROR: <AlertCircle size={12} />,
    WARNING: <AlertTriangle size={12} />,
    INFO: <Info size={12} />,
    DEBUG: <Bug size={12} />,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{L('System Logs', 'سجلات النظام')}</h1>
          <p className="text-xs text-[var(--text-secondary)]">{L('Real-time application log stream', 'بث سجلات التطبيق في الوقت الفعلي')}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            {L('Auto-refresh', 'تحديث تلقائي')}
          </label>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="w-36 shrink-0">
          <Select
            size="sm"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            options={[
              { value: '', label: L('All Levels', 'جميع المستويات') },
              { value: 'ERROR', label: 'ERROR' },
              { value: 'WARNING', label: 'WARNING' },
              { value: 'INFO', label: 'INFO' },
              { value: 'DEBUG', label: 'DEBUG' },
            ]}
          />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={L('Search logs...', 'بحث في السجلات...')}
          className="flex-1 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
        />
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-[#0d1117]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-12 text-gray-500">{L('No logs found', 'لم يتم العثور على سجلات')}</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white/5 group">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${levelColors[log.level] || 'text-gray-500 bg-gray-500/10'}`}>
                {levelIcons[log.level] || <Info size={12} />}
                {log.level}
              </span>
              <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
              <span className="text-gray-300 flex-1 break-all">{log.message}</span>
              <button
                onClick={() => copyToClipboard(log.message)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
                title={L('Copy', 'نسخ')}
              >
                <Copy size={10} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
