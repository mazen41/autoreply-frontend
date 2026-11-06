'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Layers,
  Laptop,
  Maximize2,
  MousePointer,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AdminShell, Badge, Button, PageHeader, Panel, StatCard } from '../../../components/admin/AdminUI'
import { useLang } from '../../../lib/LangContext'

// ─── TYPES ──────────────────────────────────────────────────────────────────
type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d'
type AnalyticsTab =
  | 'overview'
  | 'live'
  | 'sources'
  | 'pages'
  | 'audience'
  | 'events'
  | 'conversions'
  | 'ecommerce'
  | 'setup'

interface PropertyOption {
  id: string
  name: string
  domain: string
  allowed_domains?: string[]
  type: string
  platform?: string
  activeSessions: number
  verified_at?: string | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

function getAuthToken(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find((c) => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function VisitorAnalyticsPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => (isRTL ? ar : en), [isRTL])

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [properties, setProperties] = useState<PropertyOption[]>([])

  const [selectedPropId, setSelectedPropId] = useState<string>('prop_all_customers')
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [dateRange, setDateRange] = useState<DatePreset>('30d')
  const [metricMetricView, setMetricView] = useState<'visitors' | 'pageviews' | 'sessions'>('visitors')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [liveHasLoaded, setLiveHasLoaded] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'testing' | 'verified' | 'failed'>('idle')

  // Real backend payload state
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [liveData, setLiveData] = useState<{
    activeCount: number
    histogram: Array<{ label: string; count: number }>
    sessions: any[]
  }>({
    activeCount: 0,
    histogram: Array.from({ length: 30 }, (_, i) => ({ label: '', count: 0 })),
    sessions: [],
  })

  const currentProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropId) || {
      id: 'prop_all_customers', name: 'All properties', domain: '', type: 'all', activeSessions: 0,
    },
    [properties, selectedPropId]
  )

  const isInternal = currentProperty?.type === 'internal'

  // ─── 1. FETCH PROPERTIES FROM REAL BACKEND ───────────────────────────────
  const fetchProperties = useCallback(async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/visitor-analytics/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (res.ok) {
        const payload = await res.json()
        if (payload.properties && Array.isArray(payload.properties)) {
          const loaded = payload.properties
          const allOption: PropertyOption = {
            id: 'prop_all_customers',
            name: 'All properties',
            domain: '',
            type: 'all',
            activeSessions: 0,
          }
          setProperties([allOption, ...loaded])
          if (selectedPropId !== 'prop_all_customers' && !loaded.some((p: PropertyOption) => p.id === selectedPropId)) {
            setSelectedPropId('prop_all_customers')
          }
        }
      }
    } catch {
      setProperties([])
    }
  }, [selectedPropId])

  // ─── 2. FETCH DASHBOARD DATA FROM REAL BACKEND ───────────────────────────
  const fetchDashboard = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const token = getAuthToken()
      const params = new URLSearchParams({
        property_id: selectedPropId,
        preset: dateRange,
      })
      const res = await fetch(`${API_BASE}/api/admin/visitor-analytics/dashboard?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (!res.ok) throw new Error(`Analytics request failed (${res.status})`)
      const data = await res.json()
      setDashboardData(data)
      setDashboardError(null)
    } catch {
      setDashboardData(null)
      setDashboardError('Could not load analytics data. Check the connection and try again.')
    } finally {
      setIsRefreshing(false)
      setIsLoadingDashboard(false)
    }
  }, [selectedPropId, dateRange])

  // ─── 3. FETCH LIVE RADAR FROM REAL BACKEND ────────────────────────────────
  const fetchLiveFeed = useCallback(async () => {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams({ property_id: selectedPropId })
      const res = await fetch(`${API_BASE}/api/admin/visitor-analytics/live?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (!res.ok) throw new Error(`Live analytics request failed (${res.status})`)
      const data = await res.json()
      setLiveData(data)
      setLiveError(null)
    } catch {
      setLiveData({ activeCount: 0, histogram: Array.from({ length: 30 }, () => ({ label: '', count: 0 })), sessions: [] })
      setLiveError('Could not load live analytics data.')
    } finally {
      setLiveHasLoaded(true)
    }
  }, [selectedPropId])

  // Initial load
  useEffect(() => {
    void fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    void fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    void fetchLiveFeed()
  }, [fetchLiveFeed])

  // Polling for live active radar when on live tab
  useEffect(() => {
    if (!liveAutoRefresh || activeTab !== 'live') return
    const timer = setInterval(() => {
      void fetchLiveFeed()
    }, 4000)
    return () => clearInterval(timer)
  }, [liveAutoRefresh, activeTab, fetchLiveFeed])

  // ─── VERIFY TAG INSTALLATION (REAL BACKEND CALL) ──────────────────────────
  const handleTestVerification = async () => {
    if (currentProperty.type === 'all') {
      setVerificationStatus('failed')
      return
    }
    setVerificationStatus('testing')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/visitor-analytics/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ property_id: currentProperty.id }),
      })
      const result = await res.json().catch(() => ({}))
      if (res.ok && result.verified === true) {
        setVerificationStatus('verified')
        void fetchProperties()
      } else {
        setVerificationStatus('failed')
      }
    } catch {
      setVerificationStatus('failed')
    }
  }

  // ─── DERIVED VALUES FROM REAL DATA OR INITIAL RESILIENT DATA ──────────────
  const kpis = dashboardData?.kpis || {
    visitors: 0, visitorsTrend: null,
    sessions: 0, sessionsTrend: null,
    pageviews: 0, pageviewsTrend: null,
    singlePageSessionRate: null, singlePageSessionRateTrend: null,
    observedDuration: null, observedDurationTrend: null,
    conversionRate: null, conversionTrend: null,
    revenue: null, revenueTrend: null,
  }
  const timeSeriesData = dashboardData?.timeSeries || []
  const trafficSources = dashboardData?.trafficSources || []
  const deviceData = dashboardData?.deviceData || []
  const topPages = dashboardData?.topPages || []
  const topReferrers = dashboardData?.topReferrers || []
  const utmCampaigns = dashboardData?.utmCampaigns || []
  const audienceData = dashboardData?.audience || { countries: [], browsers: [], os: [] }
  const eventsData = dashboardData?.events || []
  const funnelSteps = dashboardData?.funnel || []
  const liveSessions = liveData?.sessions || []
  const previousMetricKey = metricMetricView === 'visitors' ? 'prevVisitors' : metricMetricView === 'sessions' ? 'prevSessions' : 'prevPageviews'

  // Tracking SDK embed snippet
  const trackingSnippet = useMemo(
    () => `<!-- Nazeer Business Universal Visitor Analytics SDK -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['NazAnalyticsObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    w[o].l=1*new Date();js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.async=1;js.src=f;fjs.parentNode.insertBefore(js,fjs);
  })(window,document,'script','NazAnalytics','${API_BASE}/api/v1/analytics/tracker.js');

  NazAnalytics('init', '${currentProperty.id}');
  NazAnalytics('page');
</script>`,
    [currentProperty.id]
  )

  const handleCopyScript = () => {
    navigator.clipboard.writeText(trackingSnippet)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2500)
  }

  return (
    <AdminShell>
      {/* ─── PAGE HEADER & CONTROLS ────────────────────────────────────────── */}
      <PageHeader
        eyebrow={L('Nazeer Intelligence Core', 'ذكاء منصة نظير')}
        title={L('Visitor Analytics & Behavior Tracking', 'تحليلات الزوار وسلوك التصفح')}
        description={L(
          'Unified enterprise visitor intelligence, multi-tenant acquisition tracking, real-time activity streams, and privacy-first attribution.',
          'نظام متكامل لتحليلات الزوار، وتتبع مصادر الزيارات، والنشاط الفوري، وقياس معدلات التحويل للعملاء والمنصة.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Property Selector */}
            <div className="relative min-w-[250px]">
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-surface-elevated py-2 pl-9 pr-9 text-xs font-bold text-text-primary shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
              <Globe className="pointer-events-none absolute left-3 top-2.5 text-text-muted" size={14} />
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 text-text-muted" size={14} />
            </div>

            {/* Date Preset Selector */}
            <div className="flex items-center rounded-xl border border-border bg-surface-elevated p-1 shadow-sm">
              {(['today', 'yesterday', '7d', '30d', '90d'] as DatePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setDateRange(p)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    dateRange === p
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p === 'today'
                    ? L('Today', 'اليوم')
                    : p === 'yesterday'
                    ? L('Yesterday', 'أمس')
                    : p === '7d'
                    ? L('7 Days', '٧ أيام')
                    : p === '30d'
                    ? L('30 Days', '٣٠ يوم')
                    : L('90 Days', '٩٠ يوم')}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button variant="ghost" onClick={fetchDashboard} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{L('Refresh', 'تحديث')}</span>
            </Button>
          </div>
        }
      />

      {dashboardError && (
        <Panel className="border-error/30 p-4">
          <div role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-error">{L(dashboardError, 'تعذر تحميل بيانات التحليلات. تحقق من الاتصال ثم أعد المحاولة.')}</p>
            <Button variant="ghost" onClick={fetchDashboard}>{L('Retry', 'إعادة المحاولة')}</Button>
          </div>
          </div>
        </Panel>
      )}

      {dashboardData && !dashboardError && Number(kpis.sessions) === 0 && Number(kpis.pageviews) === 0 && (
        <Panel className="border-warning/30 p-4">
          <p className="text-sm font-semibold text-text-primary">
            {L('No tracking events have been recorded for this property and period.', 'لم تُسجّل أحداث تتبع لهذا الموقع خلال الفترة المحددة.')}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {L('Install the generated script on the selected site, open it once, and check that the property allows its exact domain. Metrics will appear after real events arrive.', 'ثبّت الكود على الموقع المحدد وافتحه مرة، وتأكد من إضافة النطاق المسموح الصحيح. ستظهر المؤشرات بعد وصول أحداث حقيقية.')}
          </p>
        </Panel>
      )}

      {/* ─── LIVE PULSE BANNER ────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-3.5 shadow-sm ${liveError ? 'border-warning/30 bg-warning-subtle/50' : 'border-success/30 bg-success-subtle/50'}`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            {!liveError && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />}
            <span className={`relative inline-flex h-3.5 w-3.5 rounded-full ${liveError ? 'bg-warning' : 'bg-success'}`} />
          </span>
          <div>
            <span className="text-sm font-black text-text-primary">
              {liveError
                ? L('Live count unavailable', 'العدد المباشر غير متاح')
                : !liveHasLoaded
                  ? L('Loading live count…', 'جارٍ تحميل العدد المباشر…')
                  : `${liveData.activeCount} ${L('Sessions active in the last 5 minutes', 'جلسات نشطة خلال آخر ٥ دقائق')}`}
            </span>
            <span className="mx-2 text-text-muted">•</span>
            <span className="text-xs text-text-secondary">
              {currentProperty.domain || L('All properties', 'كل المواقع')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Badge tone={liveError ? 'amber' : 'emerald'}>
            <Zap size={12} className="mr-1 inline rtl:ml-1 rtl:mr-0" />
            {liveError ? L('Live data unavailable', 'البيانات المباشرة غير متاحة') : L('Showing recorded tracking data', 'عرض بيانات التتبع المسجلة')}
          </Badge>
          <button
            onClick={() => setActiveTab('live')}
            className="font-bold text-brand hover:underline"
          >
            {L('View Live Radar →', 'فتح الرادار المباشر ←')}
          </button>
        </div>
      </div>

      {/* ─── TAB NAVIGATION BAR ───────────────────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-border pb-1">
        <div className="flex gap-2">
          {[
            { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: BarChart3 },
            { id: 'live', labelEn: 'Live Visitors', labelAr: 'الزوار المباشرين', icon: Activity },
            { id: 'sources', labelEn: 'Traffic Sources', labelAr: 'مصادر الزيارات', icon: Target },
            { id: 'pages', labelEn: 'Pages', labelAr: 'الصفحات', icon: Eye },
            { id: 'audience', labelEn: 'Audience', labelAr: 'الجمهور', icon: Users },
            { id: 'events', labelEn: 'Events', labelAr: 'الأحداث', icon: Zap },
            { id: 'conversions', labelEn: 'Conversions', labelAr: 'التحويلات', icon: UserCheck },
            { id: 'ecommerce', labelEn: 'E-commerce', labelAr: 'التجارة الإلكترونية', icon: ShoppingBag },
            { id: 'setup', labelEn: 'Tracking Setup', labelAr: 'إعداد التتبع', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-white shadow-md'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                }`}
              >
                <Icon size={15} />
                <span>{L(tab.labelEn, tab.labelAr)}</span>
                {tab.id === 'live' && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-success/20 text-success'
                    }`}
                  >
                    {!liveHasLoaded || liveError ? '—' : liveData.activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── TAB CONTENT 1: OVERVIEW ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label={L('Unique Visitors', 'الزوار الفريدون')}
              value={Number(kpis.visitors || 0).toLocaleString()}
              detail={L('vs previous period', 'مقارنة بالفترة السابقة')}
              trend={kpis.visitorsTrend}
              icon={<Users size={18} />}
              tone="cyan"
            />
            <StatCard
              label={L('Total Visits (Sessions)', 'إجمالي الجلسات')}
              value={Number(kpis.sessions || 0).toLocaleString()}
              detail={L('Recorded sessions in selected period', 'الجلسات المسجلة خلال الفترة المحددة')}
              trend={kpis.sessionsTrend}
              icon={<Activity size={18} />}
              tone="emerald"
            />
            <StatCard
              label={L('Pageviews', 'مشاهدات الصفحات')}
              value={Number(kpis.pageviews || 0).toLocaleString()}
              detail={L('Recorded pageview events', 'مشاهدات الصفحات المسجلة')}
              trend={kpis.pageviewsTrend}
              icon={<Eye size={18} />}
              tone="violet"
            />
            <StatCard
              label={L('Single-page session rate', 'نسبة الجلسات ذات الصفحة الواحدة')}
              value={kpis.singlePageSessionRate ?? '—'}
              detail={L('Based on recorded pageviews; not a bounce rate', 'محسوبة من مشاهدات الصفحات المسجلة وليست معدل ارتداد')}
              trend={kpis.singlePageSessionRateTrend}
              icon={<TrendingDown size={18} />}
              tone="amber"
            />
            <StatCard
              label={L('Observed session duration', 'مدة الجلسة المسجلة')}
              value={kpis.observedDuration ?? '—'}
              detail={L('Calculated from collector activity timestamps', 'حسب توقيتات نشاط أداة التتبع')}
              trend={kpis.observedDurationTrend}
              icon={<Clock size={18} />}
              tone="slate"
            />
            <StatCard
              label={isInternal ? L('Conversion rate', 'معدل التحويل') : L('Reported conversion revenue', 'إيرادات التحويلات المبلّغ عنها')}
              value={isInternal ? kpis.conversionRate : kpis.revenue}
              detail={isInternal ? L('Converted visitors / identified visitors', 'الزوار المحوّلون / الزوار المعروفون') : L('Client-reported events; not verified store revenue', 'أحداث يرسلها المتصفح وليست إيرادات متحققة من المتجر')}
              trend={isInternal ? kpis.conversionTrend : kpis.revenueTrend}
              icon={isInternal ? <UserCheck size={18} /> : <ShoppingBag size={18} />}
              tone="emerald"
            />
          </div>

          {/* Main Time Series Chart */}
          <Panel className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-black text-text-primary">
                    {L('Visitors, sessions & pageviews over time', 'الزوار والجلسات ومشاهدات الصفحات عبر الوقت')}
                </h3>
                <p className="text-xs text-text-secondary">
                  {L('Granular trends compared with previous baseline period', 'المسار الزمني مقارنة بالفترة السابقة')}
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-elevated p-1 text-xs font-bold">
                <button
                  onClick={() => setMetricView('visitors')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    metricMetricView === 'visitors'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {L('Visitors', 'الزوار')}
                </button>
                <button
                  onClick={() => setMetricView('pageviews')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    metricMetricView === 'pageviews'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {L('Pageviews', 'المشاهدات')}
                </button>
                <button
                  onClick={() => setMetricView('sessions')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    metricMetricView === 'sessions'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {L('Sessions', 'الجلسات')}
                </button>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="prevArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={metricMetricView}
                    name={L('Current Period', 'الفترة الحالية')}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#primaryArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey={previousMetricKey}
                    name={L('Previous Period', 'الفترة السابقة')}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#prevArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Two-Column Breakdowns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Acquisition Channels */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-text-primary">
                    {L('Top Acquisition Channels', 'أهم قنوات الاستقطاب')}
                  </h4>
                  <p className="text-xs text-text-secondary">
                {L('Recorded sessions grouped by acquisition source', 'الجلسات المسجلة حسب مصدر الزيارة')}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab('sources')}>
                  {L('Full Report →', 'التفاصيل ←')}
                </Button>
              </div>

              <div className="space-y-3.5">
                {trafficSources.map((source: any) => (
                  <div key={source.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-text-primary">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                        {source.name}
                      </span>
                      <div className="flex items-center gap-4 text-text-secondary">
                        <span>{Number(source.sessions || 0).toLocaleString()} {L('sessions', 'جلسة')}</span>
                        <span className="w-10 text-right font-black text-text-primary">{source.percent}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${source.percent}%`, backgroundColor: source.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Devices & Quick Funnel */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-text-primary">
                    {L('Device Distribution & Conversion Snapshot', 'توزيع الأجهزة ولمحة التحويل')}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {L('Mobile vs Desktop behavior', 'سلوك مستخدمي الهواتف والحواسب')}
                  </p>
                </div>
                <Badge tone="cyan">{deviceData.find((item: any) => item.name?.toLowerCase() === 'mobile')?.value ?? 0}% {L('Mobile sessions', 'جلسات الهاتف')}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {deviceData.map((dev: any) => (
                  <div
                    key={dev.name}
                    className="flex flex-col items-center rounded-xl border border-border bg-surface-elevated p-3 text-center"
                  >
                    {dev.name.includes('Mobile') || dev.name.includes('الهواتف') ? (
                      <Smartphone size={22} className="text-brand-cyan" />
                    ) : dev.name.includes('Tablet') || dev.name.includes('اللوحية') ? (
                      <Tablet size={22} className="text-warning" />
                    ) : (
                      <Laptop size={22} className="text-ai-accent" />
                    )}
                    <span className="mt-2 text-xs font-bold text-text-secondary">{dev.name}</span>
                    <span className="mt-0.5 text-lg font-black text-text-primary">{dev.value}%</span>
                    <span className="text-[10px] text-text-muted">{Number(dev.count || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>

            </Panel>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 2: LIVE VISITORS ─────────────────────────────────── */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Realtime Hero Panel */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="flex flex-col justify-center p-6 lg:col-span-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                {liveError ? L('Live feed unavailable', 'التغذية المباشرة غير متاحة') : L('Live Active Radar', 'رادار الزوار اللحظي')}
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-6xl font-black text-text-primary">
                  {!liveHasLoaded || liveError ? '—' : liveData.activeCount}
                </span>
                <span className="text-sm font-bold text-success">
                  {L('Sessions active in the last 5 minutes', 'جلسات نشطة خلال آخر ٥ دقائق')}
                </span>
              </div>

              <p className="mt-2 text-xs text-text-secondary">
                {L(
                  'Track real-time page transitions, micro-interactions, and inbound navigation without caching delays.',
                  'متابعة لحظية لتنقلات الصفحات والأحداث والتفاعلات النشطة مباشرة.'
                )}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-text-secondary">
                  <input
                    type="checkbox"
                    checked={liveAutoRefresh}
                    onChange={(e) => setLiveAutoRefresh(e.target.checked)}
                    className="rounded text-brand"
                  />
                  {L('Auto-stream updates', 'تحديث تلقائي مستمر')}
                </label>
                <Badge tone="cyan">{L('4s polling tick', 'استجابة ٤ ثوانٍ')}</Badge>
              </div>
            </Panel>

            {/* Minute-by-Minute Histogram */}
            <Panel className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-text-primary">
                    {L('Active Minutes Distribution (Last 30 Min)', 'حجم النشاط بالدقائق (آخر ٣٠ دقيقة)')}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {L('Pageviews and event triggers per minute', 'المشاهدات والأحداث المنجزة في كل دقيقة')}
                  </p>
                </div>
                <Badge tone="violet">{L('Telemetry Stream', 'بيانات مباشرة')}</Badge>
              </div>

              <div className="flex h-36 items-end gap-1.5 pt-6">
                {liveData.histogram.map((bucket, idx) => {
                  const maxH = Math.max(...liveData.histogram.map((item) => item.count), 1)
                  const pct = bucket.count === 0 ? 0 : Math.max(10, Math.round((bucket.count / maxH) * 100))
                  return (
                    <div key={idx} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className="w-full rounded-t-sm bg-brand/80 transition group-hover:bg-brand-cyan"
                        style={{ height: `${pct}%` }}
                        title={`${bucket.label}: ${bucket.count} events`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-text-muted">
                <span>{L('30 minutes ago', 'منذ ٣٠ دقيقة')}</span>
                <span>{L('15 minutes ago', 'منذ ١٥ دقيقة')}</span>
                <span className="font-bold text-success">{L('Right now', 'الآن')}</span>
              </div>
            </Panel>
          </div>

          {/* Live Visitor Sessions Table */}
          <Panel className="overflow-hidden p-0">
            <div className="border-b border-border p-5">
              <h3 className="text-sm font-black text-text-primary">
                {L('Live Active Sessions Feed', 'قائمة الجلسات النشطة حالياً')}
              </h3>
              <p className="text-xs text-text-secondary">
                {L('Pseudonymized visitor telemetry matching strict privacy guidelines', 'معلومات الجلسة المشفرة المتوافقة مع معايير الخصوصية')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs rtl:text-right">
                <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                  <tr>
                    <th className="p-3.5 font-bold">{L('Visitor ID', 'معرف الزائر')}</th>
                    <th className="p-3.5 font-bold">{L('Current Page', 'الصفحة الحالية')}</th>
                    <th className="p-3.5 font-bold">{L('Entry Page', 'صفحة الدخول')}</th>
                    <th className="p-3.5 font-bold">{L('Country / City', 'الدولة / المدينة')}</th>
                    <th className="p-3.5 font-bold">{L('Device & Browser', 'الجهاز والمتصفح')}</th>
                    <th className="p-3.5 font-bold">{L('Referrer', 'المصدر')}</th>
                    <th className="p-3.5 font-bold">{L('Duration', 'المدة')}</th>
                    <th className="p-3.5 font-bold">{L('Last Event', 'آخر حدث')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {liveSessions.map((vis: any) => (
                    <tr key={vis.id} className="transition hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{vis.id}</td>
                      <td className="p-3.5 font-bold text-text-primary">
                        <span className="rounded bg-surface-elevated px-2 py-0.5">{vis.path}</span>
                      </td>
                      <td className="p-3.5 text-text-secondary">{vis.entry}</td>
                      <td className="p-3.5 text-text-primary">
                        <span className="mr-1.5 rtl:ml-1.5 rtl:mr-0">{vis.flag}</span>
                        {[vis.city, vis.country].filter(Boolean).join(', ') || L('Unknown location', 'موقع غير معروف')}
                      </td>
                      <td className="p-3.5 text-text-secondary">{vis.device}</td>
                      <td className="p-3.5 text-text-secondary">{vis.referrer}</td>
                      <td className="p-3.5 font-mono text-text-muted">{vis.activeTime}</td>
                      <td className="p-3.5">
                        <Badge tone="cyan">{vis.lastAction}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ─── TAB CONTENT 3: TRAFFIC SOURCES ───────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Referrers Table */}
            <Panel className="overflow-hidden p-0">
              <div className="border-b border-border p-5">
                <h4 className="text-sm font-black text-text-primary">
                  {L('Top Referring Domains', 'أهم النطاقات المحيلة')}
                </h4>
                <p className="text-xs text-text-secondary">
                  {L('External websites directing traffic to this property', 'المواقع التي ترسل زيارات لموقعك')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs rtl:text-right">
                  <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                    <tr>
                      <th className="p-3 font-bold">{L('Domain', 'النطاق')}</th>
                      <th className="p-3 font-bold">{L('Sessions', 'الجلسات')}</th>
                      <th className="p-3 font-bold">{L('Session conversion rate', 'معدل التحويل حسب الجلسات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topReferrers.map((row: any) => (
                      <tr key={row.domain} className="hover:bg-surface-elevated">
                        <td className="p-3 font-bold text-text-primary">{row.domain}</td>
                        <td className="p-3 text-text-secondary">{Number(row.sessions || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold text-success">{row.conv ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* UTM Campaign Tracking */}
            <Panel className="overflow-hidden p-0">
              <div className="border-b border-border p-5">
                <h4 className="text-sm font-black text-text-primary">
                  {L('Active UTM Campaigns (utm_campaign)', 'حملات UTM التسويقية النشطة')}
                </h4>
                <p className="text-xs text-text-secondary">
                  {L('Marketing attribution & campaign performance', 'قياس نتائج الحملات الإعلانية وروابط التتبع')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs rtl:text-right">
                  <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                    <tr>
                      <th className="p-3 font-bold">{L('Campaign', 'اسم الحملة')}</th>
                      <th className="p-3 font-bold">{L('Medium', 'الوسيط')}</th>
                      <th className="p-3 font-bold">{L('Sessions', 'الجلسات')}</th>
                      <th className="p-3 font-bold">{L('Conversions', 'التحويلات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {utmCampaigns.map((utm: any) => (
                      <tr key={utm.campaign} className="hover:bg-surface-elevated">
                        <td className="p-3 font-mono font-bold text-brand">{utm.campaign}</td>
                        <td className="p-3 text-text-secondary">{utm.medium}</td>
                        <td className="p-3 text-text-secondary">{Number(utm.sessions || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold text-success">{Number(utm.conversions || 0).toLocaleString()} <span className="font-normal text-text-muted">({utm.conversionRate ?? '—'})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 4: PAGES ─────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <Panel className="overflow-hidden p-0">
            <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-black text-text-primary">
                  {L('Most Viewed Pages & URL Performance', 'أكثر الصفحات زيارة وأداء الروابط')}
                </h3>
                <p className="text-xs text-text-secondary">
                  {L('Recorded pageviews and identified visitors by path', 'مشاهدات الصفحات والزوار المعروفون حسب المسار')}
                </p>
              </div>
              <Badge tone="cyan">{topPages.length} {L('Top Routes', 'مسارات رئيسية')}</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs rtl:text-right">
                <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                  <tr>
                    <th className="p-3.5 font-bold">{L('URL Path', 'مسار الرابط')}</th>
                    <th className="p-3.5 font-bold">{L('Page Title', 'عنوان الصفحة')}</th>
                    <th className="p-3.5 font-bold">{L('Pageviews', 'المشاهدات')}</th>
                    <th className="p-3.5 font-bold">{L('Unique visitors', 'الزوار الفريدون')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPages.map((page: any) => (
                    <tr key={page.path} className="hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{page.path}</td>
                      <td className="p-3.5 text-text-primary">{page.title}</td>
                      <td className="p-3.5 font-bold text-text-primary">{Number(page.pageviews || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-text-secondary">{Number(page.unique || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* 404 & Broken Links Card */}
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-warning-subtle p-3 text-warning">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-text-primary">
                  {L('404 tracking is not configured', 'تتبع صفحات ٤٠٤ غير مهيأ')}
                </h4>
                <p className="mt-1 text-xs text-text-secondary">
                  {L(
                    'This tracker does not collect HTTP response codes, so it cannot report broken links.',
                    'أداة التتبع لا تجمع حالياً رموز استجابة HTTP، لذلك لا يمكنها تحديد الروابط المعطلة.'
                  )}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ─── TAB CONTENT 5: AUDIENCE ──────────────────────────────────────── */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Geography Breakdown */}
            <Panel className="p-6 lg:col-span-1">
              <h4 className="text-sm font-black text-text-primary">
                {L('Geographic Distribution', 'التوزيع الجغرافي للزوار')}
              </h4>
            <p className="text-xs text-text-secondary">
                {L('Top countries by recorded sessions', 'أكثر الدول حسب الجلسات المسجلة')}
              </p>

              <div className="mt-4 space-y-3">
                {audienceData.countries.map((item: any) => (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-text-primary">
                        <span>{item.flag}</span>
                        <span>{isRTL ? item.ar : item.country}</span>
                      </span>
                      <span className="text-text-secondary">{item.sessions} ({item.pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Browsers & OS */}
            <Panel className="p-6 lg:col-span-2">
              <h4 className="text-sm font-black text-text-primary">
                {L('Technology & Browser Intelligence', 'بيانات المتصفحات وأنظمة التشغيل')}
              </h4>
              <p className="text-xs text-text-secondary">
                {L('Client environments visiting your application', 'بيئات التصفح التي يستخدمها الزوار')}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Browsers */}
                <div className="rounded-xl border border-border bg-surface-elevated p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {L('Top Browsers', 'أهم المتصفحات')}
                  </span>
                  <div className="mt-3 space-y-2.5">
                    {audienceData.browsers.map((b: any) => (
                      <div key={b.name} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary">{b.name}</span>
                        <span className="font-mono text-text-secondary">{b.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operating Systems */}
                <div className="rounded-xl border border-border bg-surface-elevated p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {L('Operating Systems', 'أنظمة التشغيل')}
                  </span>
                  <div className="mt-3 space-y-2.5">
                    {audienceData.os.map((os: any) => (
                      <div key={os.name} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary">{os.name}</span>
                        <span className="font-mono text-text-secondary">{os.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 6: EVENTS ────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <Panel className="overflow-hidden p-0">
            <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-black text-text-primary">
                  {L('Custom Event Tracking & Telemetry', 'الأحداث المخصصة والتفاعل')}
                </h3>
                <p className="text-xs text-text-secondary">
                  {L('Events received by the public NazAnalytics collector', 'الأحداث المستلمة عبر جامع بيانات NazAnalytics')}
                </p>
              </div>
              <Badge tone="slate">{L('Events received from SDK', 'أحداث واردة من أداة التتبع')}</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs rtl:text-right">
                <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                  <tr>
                    <th className="p-3.5 font-bold">{L('Event Name', 'اسم الحدث')}</th>
                    <th className="p-3.5 font-bold">{L('Category', 'التصنيف')}</th>
                    <th className="p-3.5 font-bold">{L('Total Count', 'إجمالي المرات')}</th>
                    <th className="p-3.5 font-bold">{L('Unique Visitors', 'الزوار الفريدون')}</th>
                    <th className="p-3.5 font-bold">{L('Sessions', 'الجلسات')}</th>
                    <th className="p-3.5 font-bold">{L('Events per session', 'الأحداث لكل جلسة')}</th>
                    <th className="p-3.5 font-bold">{L('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eventsData.map((evt: any) => (
                    <tr key={evt.name} className="hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{evt.name}</td>
                      <td className="p-3.5">
                        <Badge tone="slate">{evt.category}</Badge>
                      </td>
                      <td className="p-3.5 font-bold text-text-primary">{Number(evt.count || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-text-secondary">{Number(evt.unique || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-text-secondary">{Number(evt.sessions || 0).toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-text-muted">{evt.perSession}</td>
                      <td className="p-3.5">
                        <Badge tone="slate">{L('Tracked', 'مُسجل')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ─── TAB CONTENT 7: CONVERSIONS ───────────────────────────────────── */}
      {activeTab === 'conversions' && (
        <div className="space-y-6">
          {/* Funnel Step Visualization */}
          <Panel className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-black text-text-primary">
                  {isInternal
                    ? L('Visitor-to-Customer Acquisition Funnel', 'قمع تحويل الزوار إلى عملاء مسجلين ومستركين')
                    : L('E-commerce Checkout Funnel', 'قمع الشراء وإتمام الطلبات في المتجر')}
                </h3>
                <p className="text-xs text-text-secondary">
                  {L('Full lifecycle journey with drop-off calculation between stages', 'مسار الرحلة الكامل ونسب التسرب بين كل مرحلة')}
                </p>
              </div>
              <Badge tone="slate">{L('Based on tracked session events', 'محسوب من أحداث الجلسات المسجلة')}</Badge>
            </div>

            <div className="space-y-4">
              {funnelSteps.map((step: any, idx: number) => (
                <div key={step.step} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-primary">{step.step}</span>
                    <div className="flex items-center gap-4">
                      {idx > 0 && (
                        <span className="text-[11px] text-error">
                          ↓ {step.dropoff} {L('drop-off', 'تسرب')}
                        </span>
                      )}
                      <span className="text-text-secondary">{Number(step.sessions || 0).toLocaleString()}</span>
                      <span className="w-12 text-right font-black text-brand">{step.rate == null ? '—' : `${step.rate}%`}</span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, Number(step.rate) || 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Identity Linking Explanation */}
          <Panel className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-ai-subtle p-3 text-ai-accent">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-text-primary">
                  {L('Safe Visitor-to-Customer Identity Linking', 'الربط الآمن لهوية الزائر مع حساب العميل')}
                </h4>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {L(
                    'The public browser identify call does not link a visitor to an account. Identity association must be performed by the authenticated application after signup or login; the public collector ignores client-supplied account IDs.',
                    'استدعاء identify من المتصفح لا يربط الزائر بحساب. يجب أن ينفذ التطبيق الربط الموثوق بعد تسجيل الدخول أو إنشاء الحساب؛ أداة التتبع العامة تتجاهل معرّفات الحساب المرسلة من المتصفح.'
                  )}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ─── TAB CONTENT 8: E-COMMERCE ────────────────────────────────────── */}
      {activeTab === 'ecommerce' && (
        <div className="space-y-6">
          {/* E-commerce KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={L('Reported conversion revenue', 'إيرادات التحويلات المبلّغ عنها')}
              value={dashboardData?.ecommerce?.grossRevenue ?? '—'}
              detail={L('Browser-reported events; not verified store revenue', 'أحداث يرسلها المتصفح وليست إيرادات متحققة من المتجر')}
              trend={dashboardData?.ecommerce?.revenueTrend}
              icon={<ShoppingBag size={18} />}
              tone="emerald"
            />
            <StatCard
              label={L('Reported orders', 'الطلبات المُبلّغ عنها')}
              value={String(dashboardData?.ecommerce?.orders ?? 0)}
              detail={dashboardData?.ecommerce?.aov ? `${L('Average order value', 'متوسط قيمة الطلب')}: ${dashboardData.ecommerce.aov}` : L('No reported order conversions', 'لا توجد تحويلات طلبات مُبلّغ عنها')}
              trend={undefined}
              icon={<ShoppingCart size={18} />}
              tone="cyan"
            />
            <StatCard
              label={L('Cart Abandonment Rate', 'معدل التخلي عن السلة')}
              value={dashboardData?.ecommerce?.cartAbandonmentRate ?? '—'}
              detail={dashboardData?.ecommerce?.cartSessions ? `${dashboardData.ecommerce.cartSessions} ${L('tracked cart sessions', 'جلسات سلة مسجلة')}` : L('Requires add-to-cart and order events', 'يتطلب أحداث إضافة للسلة وإتمام الطلب')}
              trend={undefined}
              icon={<TrendingDown size={18} />}
              tone="amber"
            />
            <StatCard
              label={L('Registered analytics properties', 'خصائص التحليلات المسجلة')}
              value={String(properties.filter((property) => property.type !== 'all').length)}
              detail={L('Analytics properties registered', 'مواقع تحليلات مسجلة')}
              trend={undefined}
              icon={<Zap size={18} />}
              tone="violet"
            />
          </div>

          <Panel className="p-5">
            <p className="text-xs leading-5 text-text-secondary">
              {L('Commerce figures on this page are derived from conversion events sent to this analytics property. For audited order totals and revenue, use the connected commerce provider reports; client-side events can be blocked or altered by browsers.', 'تُحسب أرقام التجارة هنا من أحداث التحويل المرسلة إلى خاصية التحليلات. للحصول على إجمالي طلبات وإيرادات موثوق، استخدم تقارير منصة المتجر؛ فقد يمنع المتصفح الأحداث المرسلة من جهة العميل أو يغيّرها.')}
            </p>
          </Panel>
        </div>
      )}

      {/* ─── TAB CONTENT 9: TRACKING SETUP & WIZARD ──────────────────────── */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Embed Snippet Generator */}
            <Panel className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    {L('Universal Tracking Script Installation', 'تثبيت كود التتبع الشامل للموقع')}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {L('Add this lightweight snippet right before the </head> tag of your site or store.', 'أضف هذا الكود الخفيف قبل وسم </head> في موقعك أو متجرك.')}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleCopyScript}>
                  {copiedScript ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copiedScript ? L('Copied!', 'تم النسخ!') : L('Copy Script', 'نسخ الكود')}</span>
                </Button>
              </div>

              {/* Code Box */}
              <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200">
                <pre className="overflow-x-auto whitespace-pre leading-relaxed">{currentProperty.type === 'all' ? L('Select a specific property to generate its tracking script.', 'اختر موقعاً محدداً لإنشاء كود التتبع الخاص به.') : trackingSnippet}</pre>
              </div>

              {/* Verification Section */}
              <div className="mt-6 rounded-xl border border-border bg-surface-elevated p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">
                      {L('Verification & Beacon Ping', 'فحص واختبار الاتصال المباشر')}
                    </h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      {L(
                        'Tests whether the tracking tag is successfully sending heartbeats to Nazeer Analytics.',
                        'التحقق مما إذا كان الكود البرمجي يرسل نبضات التتبع بنجاح لخوادم نظير.'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {(verificationStatus === 'verified' || currentProperty.verified_at) && (
                      <Badge tone="emerald">
                        <CheckCircle2 size={12} className="mr-1 inline rtl:ml-1 rtl:mr-0" />
                        {L('Verified: a recent event was received', 'تم التحقق: استُقبل حدث حديث')}
                      </Badge>
                    )}
                    <Button onClick={handleTestVerification} disabled={verificationStatus === 'testing' || currentProperty.type === 'all'}>
                      {verificationStatus === 'testing' ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>{L('Checking...', 'جاري الفحص...')}</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>{L('Verify Installation', 'فحص التثبيت الآن')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* JavaScript API Documentation Quick Reference */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">
                  {L('NazAnalytics JavaScript API Methods', 'دوال مكتبة NazAnalytics البرمجية')}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface-elevated p-3.5">
                    <span className="font-mono text-xs font-bold text-brand">NazAnalytics(&apos;track&apos;, event, props)</span>
                    <p className="mt-1 text-xs text-text-secondary">
                      {L('Captures custom business actions with optional JSON properties.', 'لتسجيل الأحداث المخصصة مع الخصائص البرمجية.')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated p-3.5">
                    <span className="font-mono text-xs font-bold text-brand">NazAnalytics(&apos;identify&apos;, userId, traits)</span>
                    <p className="mt-1 text-xs text-text-secondary">
                      {L('The public collector ignores account IDs; use the authenticated backend identity-link flow.', 'تتجاهل أداة التتبع العامة معرّفات الحساب؛ استخدم ربط الهوية من الخادم الموثوق.')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated p-3.5">
                    <span className="font-mono text-xs font-bold text-brand">NazAnalytics(&apos;page&apos;, title, path)</span>
                    <p className="mt-1 text-xs text-text-secondary">
                      {L('For Single Page Applications (Next.js, React, Vue) route transitions.', 'لتتبع مسارات تطبيقات الصفحة الواحدة عند الانتقال.')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated p-3.5">
                    <span className="font-mono text-xs font-bold text-brand">NazAnalytics(&apos;conversion&apos;, goal, val)</span>
                    <p className="mt-1 text-xs text-text-secondary">
                      {L('Records a client-reported goal and value; the event is not proof of a completed payment.', 'يسجل هدفاً وقيمة يرسلها المتصفح، ولا يثبت إتمام الدفع.')}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Enforced privacy and origin rules */}
            <Panel className="p-6 lg:col-span-1">
              <h4 className="text-sm font-black text-text-primary">
                {L('Privacy and allowed domains', 'الخصوصية والنطاقات المسموح بها')}
              </h4>
              <p className="text-xs text-text-secondary">
                {L('These rules are enforced by the collector. They cannot be changed from this read-only panel.', 'تُطبق هذه القواعد داخل خادم التتبع ولا يمكن تغييرها من هذه اللوحة للقراءة فقط.')}
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-xs font-bold text-text-secondary">{L('Allowed origins', 'النطاقات المسموح بها')}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(currentProperty.allowed_domains || []).map((domain) => <Badge key={domain} tone="slate">{domain}</Badge>)}
                    {(currentProperty.type === 'all' || !currentProperty.allowed_domains?.length) && <span className="text-xs text-text-muted">{L('Select a property to view its domains.', 'اختر موقعاً لعرض نطاقاته.')}</span>}
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4 text-xs text-text-secondary">
                  <p>{L('Raw IP addresses are never stored; a daily hash is derived from the truncated address.', 'لا تُحفظ عناوين IP الأصلية؛ يُنشأ تجزؤ يومي من العنوان بعد إخفاء جزء منه.')}</p>
                  <p>{L('DNT and Global Privacy Control signals disable collection. Visitor IDs use browser local storage and session storage, so this tracker is not cookie-less.', 'يوقف التتبع عند تفعيل DNT أو Global Privacy Control. تُحفظ معرّفات الزائر في تخزين المتصفح والجلسة، لذلك لا يعمل التتبع دون تخزين.')}</p>
                  <p>{L('A matching Origin/Referer host is required when the browser sends one. Requests without origin headers cannot be checked against a browser domain.', 'يُشترط تطابق نطاق Origin أو Referer عند إرساله من المتصفح. لا يمكن التحقق من النطاق إذا غابت هذه الترويسات.')}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
