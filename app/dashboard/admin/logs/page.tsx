'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../../../../lib/LangContext'
import { RefreshCw, Copy, AlertTriangle, Info, Bug, AlertCircle } from 'lucide-react'
import Select from '../../../../components/ui/Select'
import Checkbox from '../../../../components/ui/Checkbox'

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
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [copiedLog, setCopiedLog] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestIdRef = useRef(0)

  const fetchLogs = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const isInitialLoad = logs.length === 0
    setLoading(isInitialLoad)
    setRefreshing(!isInitialLoad)
    setLoadError('')
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session has expired. Sign in again to view system logs.', 'انتهت جلستك. سجّل الدخول مجدداً لعرض سجلات النظام.'))
      const params = new URLSearchParams()
      if (levelFilter) params.append('level', levelFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`${API}/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(L(`Could not load system logs (HTTP ${res.status}).`, `تعذر تحميل سجلات النظام (HTTP ${res.status}).`))
      const data = await res.json()
      if (requestId === requestIdRef.current) setLogs(Array.isArray(data.logs) ? data.logs : [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      if (requestId === requestIdRef.current) {
        setLoadError(error instanceof Error ? error.message : L('Could not load system logs. Please try again.', 'تعذر تحميل سجلات النظام. حاول مرة أخرى.'))
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [levelFilter, searchQuery, logs.length])

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

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLog(key)
      window.setTimeout(() => setCopiedLog(current => current === key ? null : current), 1600)
    } catch {
      setLoadError(L('Clipboard access was blocked by your browser.', 'منع المتصفح الوصول إلى الحافظة.'))
    }
  }

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{L('System Logs', 'سجلات النظام')}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{L('Inspect recent application events and errors.', 'راجع أحدث أحداث التطبيق والأخطاء.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox checked={autoRefresh} onChange={setAutoRefresh} label={L('Auto-refresh every 5 seconds', 'تحديث تلقائي كل 5 ثوانٍ')} className="text-xs" />
          <button
            onClick={fetchLogs}
            disabled={loading}
            aria-label={L('Refresh logs', 'تحديث السجلات')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing || loading ? 'animate-spin' : ''} />
            {L('Refresh', 'تحديث')}
          </button>
        </div>
      </header>

      {/* Filters */}
      <section aria-label={L('Log filters', 'عوامل تصفية السجلات')} className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:flex-row sm:items-center lg:px-8">
        <div className="w-full shrink-0 sm:w-44">
          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            size="sm"
            ariaLabel={L('Filter by log level', 'تصفية حسب مستوى السجل')}
            value={levelFilter}
            onValueChange={setLevelFilter}
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
          aria-label={L('Search logs', 'ابحث في السجلات')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={L('Search logs...', 'بحث في السجلات...')}
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]"
        />
      </section>

      {loadError && (
        <div role="alert" className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error lg:mx-8">
          <span>{loadError}</span>
          <button onClick={fetchLogs} className="font-semibold underline underline-offset-2">{L('Try again', 'أعد المحاولة')}</button>
        </div>
      )}

      {/* Log Stream */}
      <section aria-label={L('Log entries', 'إدخالات السجل')} aria-busy={loading || refreshing} className="mx-5 my-4 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[#0d1117] lg:mx-8">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-gray-400">
          <span>{L(`${logs.length} entries`, `${logs.length} إدخال`)}</span>
          {refreshing && <span className="inline-flex items-center gap-2"><RefreshCw size={12} className="animate-spin" />{L('Updating…', 'جارٍ التحديث…')}</span>}
        </div>
        <div className="max-h-[calc(100vh-260px)] min-h-64 overflow-auto p-3 font-mono text-xs sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-gray-500">{L('No logs match these filters.', 'لا توجد سجلات تطابق عوامل التصفية.')}</p>
        ) : (
          logs.map((log, i) => (
            <div key={`${log.timestamp ?? 'unknown'}-${log.level}-${i}`} className="group flex flex-col gap-1 rounded px-2 py-2 hover:bg-white/5 sm:flex-row sm:items-start sm:gap-2">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${levelColors[log.level] || 'text-gray-500 bg-gray-500/10'}`}>
                {levelIcons[log.level] || <Info size={12} />}
                {log.level}
              </span>
              <span className="shrink-0 text-gray-500">{log.timestamp || L('Unknown time', 'وقت غير معروف')}</span>
              <span className="min-w-0 flex-1 break-all text-gray-300">{log.message}</span>
              <button
                onClick={() => copyToClipboard(log.message, `${log.timestamp ?? 'unknown'}-${i}`)}
                aria-label={L('Copy log message', 'نسخ رسالة السجل')}
                className="self-start rounded p-1 text-gray-500 opacity-100 transition-all hover:bg-white/10 hover:text-gray-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                title={copiedLog === `${log.timestamp ?? 'unknown'}-${i}` ? L('Copied', 'تم النسخ') : L('Copy', 'نسخ')}
              >
                {copiedLog === `${log.timestamp ?? 'unknown'}-${i}` ? <span className="px-1 text-[10px]">{L('Copied', 'تم النسخ')}</span> : <Copy size={12} />}
              </button>
            </div>
          ))
        )}
        </div>
      </section>
    </main>
  )
}
