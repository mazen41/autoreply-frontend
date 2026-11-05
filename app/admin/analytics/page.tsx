'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */

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
type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom'
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

type PropertyType = 'internal' | 'customer_store' | 'all'

interface PropertyOption {
  id: string
  name: string
  domain: string
  type: PropertyType
  platform?: 'nextjs' | 'shopify' | 'salla' | 'woocommerce' | 'custom'
  activeVisitors: number
}

// ─── SAMPLE PROPERTIES ───────────────────────────────────────────────────────
const PROPERTIES: PropertyOption[] = [
  {
    id: 'prop_naz_internal',
    name: 'Nazeer Business (Internal)',
    domain: 'nazbiz.io',
    type: 'internal',
    platform: 'nextjs',
    activeVisitors: 48,
  },
  {
    id: 'prop_all_customers',
    name: 'All Customer Stores (Aggregate)',
    domain: 'Aggregate (142 connected stores)',
    type: 'all',
    activeVisitors: 312,
  },
  {
    id: 'prop_salla_alnahda',
    name: 'Al-Nahda Perfumes (Salla)',
    domain: 'alnahda-oud.salla.sa',
    type: 'customer_store',
    platform: 'salla',
    activeVisitors: 34,
  },
  {
    id: 'prop_shopify_elite',
    name: 'Elite Apparel (Shopify)',
    domain: 'elite-boutique.myshopify.com',
    type: 'customer_store',
    platform: 'shopify',
    activeVisitors: 67,
  },
  {
    id: 'prop_woo_tech',
    name: 'TechGate Store (WooCommerce)',
    domain: 'shop.techgate.sa',
    type: 'customer_store',
    platform: 'woocommerce',
    activeVisitors: 21,
  },
]

function deterministicSeed(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

export default function VisitorAnalyticsPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => (isRTL ? ar : en), [isRTL])

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [selectedPropId, setSelectedPropId] = useState<string>('prop_naz_internal')
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [dateRange, setDateRange] = useState<DatePreset>('30d')
  const [metricMetricView, setMetricView] = useState<'visitors' | 'pageviews' | 'sessions'>('visitors')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'testing' | 'verified' | 'failed'>('idle')

  // Domain whitelist state for tracking setup
  const [whitelistDomain, setWhitelistDomain] = useState('nazbiz.io')
  const [anonymizeIp, setAnonymizeIp] = useState(true)
  const [cookielessMode, setCookielessMode] = useState(false)
  const [respectDnt, setRespectDnt] = useState(true)

  const currentProperty = useMemo(
    () => PROPERTIES.find((p) => p.id === selectedPropId) || PROPERTIES[0],
    [selectedPropId]
  )

  // ─── DATA CALCULATION ───────────────────────────────────────────────────────
  const isInternal = currentProperty.type === 'internal'

  // Time Series Chart Data (Pure deterministic generation)
  const timeSeriesData = useMemo(() => {
    const days = dateRange === 'today' ? 24 : dateRange === 'yesterday' ? 24 : dateRange === '7d' ? 7 : 30
    const points = []
    const baseMult = isInternal ? 1 : 2.8

    if (dateRange === 'today' || dateRange === 'yesterday') {
      for (let h = 0; h < 24; h++) {
        const hourLabel = `${h.toString().padStart(2, '0')}:00`
        const wave = Math.sin((h / 24) * Math.PI) * 1.5 + 0.3
        const variance = deterministicSeed(h + 7)
        const visitors = Math.round((45 + variance * 60) * wave * baseMult)
        const sessions = Math.round(visitors * 1.25)
        const pageviews = Math.round(sessions * 2.8)
        const prevVisitors = Math.round(visitors * (0.85 + deterministicSeed(h + 19) * 0.2))
        points.push({
          label: hourLabel,
          visitors,
          sessions,
          pageviews,
          prevPeriod: prevVisitors,
        })
      }
    } else {
      for (let d = days; d >= 1; d--) {
        const dObj = new Date()
        dObj.setDate(dObj.getDate() - d)
        const label = dObj.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
        const variance = deterministicSeed(d * 13)
        const visitors = Math.round((780 + variance * 520) * baseMult)
        const sessions = Math.round(visitors * 1.34)
        const pageviews = Math.round(visitors * 3.42)
        const prevVisitors = Math.round(visitors * 0.88)
        points.push({
          label,
          visitors,
          sessions,
          pageviews,
          prevPeriod: prevVisitors,
        })
      }
    }
    return points
  }, [dateRange, isInternal, isRTL])

  // Traffic Sources Data
  const trafficSources = useMemo(
    () => [
      { name: L('Organic Search', 'البحث الطبيعي'), visitors: isInternal ? 11240 : 28400, percent: 38, bounce: '32%', color: '#10b981' },
      { name: L('Direct Traffic', 'حركة مباشرة'), visitors: isInternal ? 7850 : 19200, percent: 27, bounce: '28%', color: '#06b6d4' },
      { name: L('Social Media', 'وسائل التواصل'), visitors: isInternal ? 4920 : 14800, percent: 17, bounce: '44%', color: '#8b5cf6' },
      { name: L('Referral Links', 'روابط الإحالة'), visitors: isInternal ? 2890 : 8100, percent: 10, bounce: '36%', color: '#f59e0b' },
      { name: L('Paid Search (Ads)', 'الإعلانات الممولة'), visitors: isInternal ? 1840 : 5900, percent: 6, bounce: '41%', color: '#ec4899' },
      { name: L('Email Campaigns', 'حملات البريد'), visitors: isInternal ? 620 : 2100, percent: 2, bounce: '24%', color: '#3b82f6' },
    ],
    [isInternal, L]
  )

  // Device Breakdown
  const deviceData = useMemo(
    () => [
      { name: L('Mobile', 'الهواتف الذكية'), value: 58, count: isInternal ? 16820 : 45200, color: '#06b6d4' },
      { name: L('Desktop', 'أجهزة الكمبيوتر'), value: 37, count: isInternal ? 10730 : 28800, color: '#8b5cf6' },
      { name: L('Tablet', 'الأجهزة اللوحية'), value: 5, count: isInternal ? 1450 : 3900, color: '#f59e0b' },
    ],
    [isInternal, L]
  )

  // Top Pages Data
  const topPages = useMemo(() => {
    if (isInternal) {
      return [
        { path: '/', title: 'Home - Nazeer Business AI Platform', pageviews: 24890, unique: 16420, avgTime: '2m 45s', bounce: '28.4%', exit: '21.0%' },
        { path: '/pricing', title: 'Pricing & Subscription Plans', pageviews: 14210, unique: 11180, avgTime: '3m 12s', bounce: '24.1%', exit: '38.2%' },
        { path: '/register', title: 'Sign Up - Free Trial Creation', pageviews: 8940, unique: 7650, avgTime: '4m 05s', bounce: '19.8%', exit: '14.5%' },
        { path: '/blog', title: 'Nazeer Tech Blog & Knowledge', pageviews: 6540, unique: 5120, avgTime: '3m 48s', bounce: '41.2%', exit: '52.1%' },
        { path: '/login', title: 'Sign In to Workspace', pageviews: 5890, unique: 4890, avgTime: '1m 15s', bounce: '16.4%', exit: '8.2%' },
        { path: '/tools', title: 'Free Business Tools & ROI Calc', pageviews: 4320, unique: 3410, avgTime: '3m 22s', bounce: '33.8%', exit: '29.4%' },
      ]
    }
    return [
      { path: '/', title: 'Store Frontpage', pageviews: 48900, unique: 31200, avgTime: '2m 10s', bounce: '32.1%', exit: '18.4%' },
      { path: '/products/royal-oud-oil', title: 'Royal Oud Oil 12ml', pageviews: 28400, unique: 19800, avgTime: '3m 35s', bounce: '26.8%', exit: '22.1%' },
      { path: '/cart', title: 'Shopping Cart', pageviews: 14900, unique: 11200, avgTime: '1m 50s', bounce: '14.2%', exit: '28.6%' },
      { path: '/checkout', title: 'Checkout & Payment Step', pageviews: 9800, unique: 8400, avgTime: '4m 12s', bounce: '12.0%', exit: '34.2%' },
      { path: '/collections/summer-sale', title: 'Summer Collection 2026', pageviews: 8200, unique: 6100, avgTime: '2m 40s', bounce: '35.4%', exit: '31.0%' },
      { path: '/order/confirmed', title: 'Order Confirmation', pageviews: 3120, unique: 3050, avgTime: '1m 10s', bounce: '8.1%', exit: '78.5%' },
    ]
  }, [isInternal])

  // Live Visitors Stream
  const [liveVisitors, setLiveVisitors] = useState([
    { id: 'vis_8f4a12', path: '/pricing', entry: '/blog/ai-support', country: 'Saudi Arabia', flag: '🇸🇦', city: 'Riyadh', device: 'Desktop / Chrome', referrer: 'google.com', activeTime: '4m 18s', lastAction: 'clicked_pricing_annual' },
    { id: 'vis_99b34c', path: isInternal ? '/register' : '/checkout', entry: '/', country: 'UAE', flag: '🇦🇪', city: 'Dubai', device: 'Mobile / Safari', referrer: 'Direct', activeTime: '2m 45s', lastAction: 'input_field_focus' },
    { id: 'vis_c14e08', path: '/', entry: '/', country: 'Saudi Arabia', flag: '🇸🇦', city: 'Jeddah', device: 'Mobile / Chrome', referrer: 'twitter.com', activeTime: '1m 12s', lastAction: 'scroll_50%' },
    { id: 'vis_109ab2', path: '/blog', entry: '/blog', country: 'Kuwait', flag: '🇰🇼', city: 'Kuwait City', device: 'Desktop / Safari', referrer: 'linkedin.com', activeTime: '6m 02s', lastAction: 'read_article_completed' },
    { id: 'vis_d48123', path: isInternal ? '/tools' : '/cart', entry: '/', country: 'Egypt', flag: '🇪🇬', city: 'Cairo', device: 'Mobile / Chrome', referrer: 'facebook.com', activeTime: '3m 30s', lastAction: 'added_item' },
    { id: 'vis_e71690', path: isInternal ? '/pricing' : '/products/item-3', entry: '/pricing', country: 'Qatar', flag: '🇶🇦', city: 'Doha', device: 'Desktop / Edge', referrer: 'Direct', activeTime: '5m 14s', lastAction: 'viewed_faq' },
  ])

  // Conversion Funnels Data
  const funnelSteps = useMemo(() => {
    if (isInternal) {
      return [
        { step: L('1. Landing / Entry', '١. الوصول للموقع'), visitors: 28450, rate: 100, dropoff: '0%' },
        { step: L('2. Pricing Viewed', '٢. صفحة الأسعار'), visitors: 13720, rate: 48.2, dropoff: '51.8%' },
        { step: L('3. Register Initiated', '٣. بدء التسجيل'), visitors: 5840, rate: 20.5, dropoff: '57.4%' },
        { step: L('4. Account Verified', '٤. تفعيل الحساب'), visitors: 3920, rate: 13.8, dropoff: '32.9%' },
        { step: L('5. Subscription Paid', '٥. اشتراك مدفوع'), visitors: 1380, rate: 4.85, dropoff: '64.8%' },
      ]
    }
    return [
      { step: L('1. Store Visit', '١. زيارة المتجر'), visitors: 78500, rate: 100, dropoff: '0%' },
      { step: L('2. Product Viewed', '٢. معاينة منتج'), visitors: 42100, rate: 53.6, dropoff: '46.4%' },
      { step: L('3. Add to Cart', '٣. إضافة للسلة'), visitors: 16800, rate: 21.4, dropoff: '60.1%' },
      { step: L('4. Checkout Started', '٤. بدء الشراء'), visitors: 8900, rate: 11.3, dropoff: '47.0%' },
      { step: L('5. Order Completed', '٥. إتمام الطلب'), visitors: 3790, rate: 4.83, dropoff: '57.4%' },
    ]
  }, [isInternal, L])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }, [])

  // Auto-refresh simulation for live tab
  useEffect(() => {
    if (!liveAutoRefresh || activeTab !== 'live') return
    let tickCount = 0
    const timer = setInterval(() => {
      tickCount++
      setLiveVisitors((prev) => {
        const next = [...prev]
        const idx = tickCount % next.length
        const actions = ['page_navigate', 'scroll_75%', 'button_click', 'cart_update', 'pricing_expand']
        next[idx] = {
          ...next[idx],
          lastAction: actions[tickCount % actions.length],
        }
        return next
      })
    }, 4000)
    return () => clearInterval(timer)
  }, [liveAutoRefresh, activeTab])

  // Copy tracking script snippet
  const trackingSnippet = useMemo(
    () => `<!-- Nazeer Business Universal Visitor Analytics SDK -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['NazAnalyticsObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    w[o].l=1*new Date();js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.async=1;js.src=f;fjs.parentNode.insertBefore(js,fjs);
  })(window,document,'script','NazAnalytics','https://analytics.nazbiz.io/tracker.js');

  NazAnalytics('init', '${currentProperty.id}', {
    anonymizeIp: ${anonymizeIp},
    respectDnt: ${respectDnt},
    cookieless: ${cookielessMode}
  });
  NazAnalytics('page');
</script>`,
    [currentProperty.id, anonymizeIp, respectDnt, cookielessMode]
  )

  const handleCopyScript = () => {
    navigator.clipboard.writeText(trackingSnippet)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2500)
  }

  const handleTestVerification = () => {
    setVerificationStatus('testing')
    setTimeout(() => {
      setVerificationStatus('verified')
    }, 1800)
  }

  // Derived KPI metrics
  const kpis = useMemo(() => {
    const mult = isInternal ? 1 : 2.7
    return {
      visitors: Math.round(28450 * mult),
      visitorsTrend: '+14.2%',
      sessions: Math.round(39820 * mult),
      sessionsTrend: '+11.8%',
      pageviews: Math.round(112640 * mult),
      pageviewsTrend: '+18.5%',
      bounceRate: '32.4%',
      bounceRateTrend: '-3.1%',
      avgDuration: '3m 42s',
      avgDurationTrend: '+8.4%',
      conversionRate: isInternal ? '4.85%' : '4.83%',
      conversionTrend: '+22.4%',
      revenue: isInternal ? 'SAR 148,200' : 'SAR 394,600',
      revenueTrend: '+19.6%',
    }
  }, [isInternal])

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
            <div className="relative min-w-[240px]">
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-surface-elevated py-2 pl-9 pr-9 text-xs font-bold text-text-primary shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {PROPERTIES.map((prop) => (
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
              {(['today', '7d', '30d', '90d'] as DatePreset[]).map((p) => (
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
                    : p === '7d'
                    ? L('7 Days', '٧ أيام')
                    : p === '30d'
                    ? L('30 Days', '٣٠ يوم')
                    : L('90 Days', '٩٠ يوم')}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button variant="ghost" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{L('Refresh', 'تحديث')}</span>
            </Button>
          </div>
        }
      />

      {/* ─── LIVE PULSE BANNER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-success/30 bg-success-subtle/50 px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-success" />
          </span>
          <div>
            <span className="text-sm font-black text-text-primary">
              {currentProperty.activeVisitors} {L('Active Visitors Right Now', 'زائر نشط الآن في الموقع')}
            </span>
            <span className="mx-2 text-text-muted">•</span>
            <span className="text-xs text-text-secondary">
              {currentProperty.domain} ({currentProperty.platform || 'universal'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Badge tone="emerald">
            <Zap size={12} className="mr-1 inline rtl:ml-1 rtl:mr-0" />
            {L('Telemetry Healthy', 'النظام متصل ويعمل')}
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
                    {currentProperty.activeVisitors}
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
              value={kpis.visitors.toLocaleString()}
              detail={L('vs previous period', 'مقارنة بالفترة السابقة')}
              trend={kpis.visitorsTrend}
              icon={<Users size={18} />}
              tone="cyan"
            />
            <StatCard
              label={L('Total Visits (Sessions)', 'إجمالي الجلسات')}
              value={kpis.sessions.toLocaleString()}
              detail={L('Avg 1.4 per visitor', 'بمعدل ١.٤ لكل زائر')}
              trend={kpis.sessionsTrend}
              icon={<Activity size={18} />}
              tone="emerald"
            />
            <StatCard
              label={L('Pageviews', 'مشاهدات الصفحات')}
              value={kpis.pageviews.toLocaleString()}
              detail={L('2.8 pages/session', '٢.٨ صفحة/جلسة')}
              trend={kpis.pageviewsTrend}
              icon={<Eye size={18} />}
              tone="violet"
            />
            <StatCard
              label={L('Bounce Rate', 'معدل الارتداد')}
              value={kpis.bounceRate}
              detail={L('Lower is better', 'الأقل أفضل')}
              trend={kpis.bounceRateTrend}
              icon={<TrendingDown size={18} />}
              tone="amber"
            />
            <StatCard
              label={L('Avg Duration', 'متوسط البقاء')}
              value={kpis.avgDuration}
              detail={L('Engaged sessions', 'جلسات تفاعلية')}
              trend={kpis.avgDurationTrend}
              icon={<Clock size={18} />}
              tone="slate"
            />
            <StatCard
              label={isInternal ? L('Signup Rate', 'معدل التسجيل') : L('Sales Revenue', 'إجمالي المبيعات')}
              value={isInternal ? kpis.conversionRate : kpis.revenue}
              detail={isInternal ? L('Visitor to user', 'من زائر إلى مسجل') : L('Attributed sales', 'مبيعات معتمدة')}
              trend={kpis.conversionTrend}
              icon={isInternal ? <UserCheck size={18} /> : <ShoppingBag size={18} />}
              tone="emerald"
            />
          </div>

          {/* Main Time Series Chart */}
          <Panel className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-black text-text-primary">
                  {L('Audience Volume & Engagement Over Time', 'حجم الجمهور والتفاعل عبر الوقت')}
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
                    dataKey="prevPeriod"
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
                    {L('Where your visitors originated from', 'المصدر الأولي للزوار')}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab('sources')}>
                  {L('Full Report →', 'التفاصيل ←')}
                </Button>
              </div>

              <div className="space-y-3.5">
                {trafficSources.map((source) => (
                  <div key={source.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-text-primary">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                        {source.name}
                      </span>
                      <div className="flex items-center gap-4 text-text-secondary">
                        <span>{source.visitors.toLocaleString()} {L('visitors', 'زائر')}</span>
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
                <Badge tone="cyan">{L('58% Mobile', '٥٨٪ هاتف')}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {deviceData.map((dev) => (
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
                    <span className="text-[10px] text-text-muted">{dev.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Conversion Step Bars */}
              <div className="mt-5 rounded-xl border border-border bg-surface-elevated p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span>{L('End-to-End Funnel Conversion', 'كفاءة قمع التحويل الشامل')}</span>
                  <span className="font-black text-success">{kpis.conversionRate}</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full bg-brand-cyan" style={{ width: '100%' }} title="Visitors" />
                  <div className="h-full bg-brand" style={{ width: '48%' }} title="Interest" />
                  <div className="h-full bg-ai-accent" style={{ width: '20%' }} title="Intent" />
                  <div className="h-full bg-success" style={{ width: '5%' }} title="Converted" />
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted">
                  <span>{L('Awareness (100%)', 'الوصول (١٠٠٪)')}</span>
                  <span>{L('Intent (20.5%)', 'الاهتمام (٢٠.٥٪)')}</span>
                  <span className="font-bold text-success">{L('Purchased (4.85%)', 'التحويل (٤.٨٥٪)')}</span>
                </div>
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
                {L('Live Active Radar', 'رادار الزوار اللحظي')}
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-6xl font-black text-text-primary">
                  {currentProperty.activeVisitors}
                </span>
                <span className="text-sm font-bold text-success">
                  {L('Concurrent visitors', 'زائر في هذه اللحظة')}
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
                <Badge tone="cyan">{L('1s polling tick', 'استجابة ثانية واحدة')}</Badge>
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
                {Array.from({ length: 30 }).map((_, idx) => {
                  const h = Math.max(15, Math.round((Math.sin(idx / 3) * 0.4 + 0.6) * 100))
                  return (
                    <div key={idx} className="group relative flex flex-1 flex-col items-center">
                      <div
                        className="w-full rounded-t-sm bg-brand/80 transition group-hover:bg-brand-cyan"
                        style={{ height: `${h}%` }}
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
                  {liveVisitors.map((vis) => (
                    <tr key={vis.id} className="transition hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{vis.id}</td>
                      <td className="p-3.5 font-bold text-text-primary">
                        <span className="rounded bg-surface-elevated px-2 py-0.5">{vis.path}</span>
                      </td>
                      <td className="p-3.5 text-text-secondary">{vis.entry}</td>
                      <td className="p-3.5 text-text-primary">
                        <span className="mr-1.5 rtl:ml-1.5 rtl:mr-0">{vis.flag}</span>
                        {vis.city}, {vis.country}
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
                      <th className="p-3 font-bold">{L('Visitors', 'الزوار')}</th>
                      <th className="p-3 font-bold">{L('Bounce', 'الارتداد')}</th>
                      <th className="p-3 font-bold">{L('Goal Rate', 'التحويل')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { domain: 'google.com', visitors: 14200, bounce: '29%', conv: '5.2%' },
                      { domain: 'twitter.com / x.com', visitors: 6840, bounce: '38%', conv: '4.1%' },
                      { domain: 'linkedin.com', visitors: 4210, bounce: '24%', conv: '6.8%' },
                      { domain: 'instagram.com', visitors: 3950, bounce: '46%', conv: '3.4%' },
                      { domain: 'youtube.com', visitors: 2890, bounce: '31%', conv: '4.9%' },
                      { domain: 'direct / none', visitors: 11200, bounce: '26%', conv: '5.8%' },
                    ].map((row) => (
                      <tr key={row.domain} className="hover:bg-surface-elevated">
                        <td className="p-3 font-bold text-text-primary">{row.domain}</td>
                        <td className="p-3 text-text-secondary">{row.visitors.toLocaleString()}</td>
                        <td className="p-3 text-text-muted">{row.bounce}</td>
                        <td className="p-3 font-bold text-success">{row.conv}</td>
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
                      <th className="p-3 font-bold">{L('Clicks', 'النقرات')}</th>
                      <th className="p-3 font-bold">{L('Conversions', 'التحويلات')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { campaign: 'saudi_founding_day_2026', medium: 'cpc', clicks: 3410, conv: 248 },
                      { campaign: 'ai_automation_webinar', medium: 'email', clicks: 2120, conv: 194 },
                      { campaign: 'launch_special_offer', medium: 'social_paid', clicks: 1890, conv: 112 },
                      { campaign: 'whatsapp_bot_showcase', medium: 'influencer', clicks: 1450, conv: 89 },
                      { campaign: 'product_hunt_featured', medium: 'referral', clicks: 940, conv: 62 },
                    ].map((utm) => (
                      <tr key={utm.campaign} className="hover:bg-surface-elevated">
                        <td className="p-3 font-mono font-bold text-brand">{utm.campaign}</td>
                        <td className="p-3 text-text-secondary">{utm.medium}</td>
                        <td className="p-3 text-text-secondary">{utm.clicks.toLocaleString()}</td>
                        <td className="p-3 font-bold text-success">{utm.conv}</td>
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
                  {L('Detailed interaction statistics across all indexed routes', 'إحصاءات التفاعل عبر جميع المسارات المفهرسة')}
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
                    <th className="p-3.5 font-bold">{L('Unique', 'فريدة')}</th>
                    <th className="p-3.5 font-bold">{L('Avg Time', 'متوسط الوقت')}</th>
                    <th className="p-3.5 font-bold">{L('Bounce', 'الارتداد')}</th>
                    <th className="p-3.5 font-bold">{L('Exit Rate', 'الخروج')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPages.map((page) => (
                    <tr key={page.path} className="hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{page.path}</td>
                      <td className="p-3.5 text-text-primary">{page.title}</td>
                      <td className="p-3.5 font-bold text-text-primary">{page.pageviews.toLocaleString()}</td>
                      <td className="p-3.5 text-text-secondary">{page.unique.toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-text-muted">{page.avgTime}</td>
                      <td className="p-3.5 text-text-secondary">{page.bounce}</td>
                      <td className="p-3.5 text-text-secondary">{page.exit}</td>
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
                  {L('404 & Broken Links Watchdog', 'مراقب الروابط المعطلة وصفحات ٤٠٤')}
                </h4>
                <p className="mt-1 text-xs text-text-secondary">
                  {L(
                    'No missing page errors detected during this period. Your site routing is healthy.',
                    'لم يتم رصد أي روابط معطلة أو صفحات ٤٠٤ مفقودة خلال هذه الفترة. توجيه الروابط سليم تماماً.'
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
                {L('Top visitor countries & territories', 'أكثر الدول زيارة')}
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { country: 'Saudi Arabia', ar: 'المملكة العربية السعودية', flag: '🇸🇦', visitors: '18,420', pct: 64 },
                  { country: 'UAE', ar: 'الإمارات العربية المتحدة', flag: '🇦🇪', visitors: '4,120', pct: 14 },
                  { country: 'Egypt', ar: 'جمهورية مصر العربية', flag: '🇪🇬', visitors: '2,480', pct: 9 },
                  { country: 'Kuwait', ar: 'الكويت', flag: '🇰🇼', visitors: '1,620', pct: 6 },
                  { country: 'Qatar', ar: 'قطر', flag: '🇶🇦', visitors: '890', pct: 3 },
                  { country: 'Other Countries', ar: 'دول أخرى', flag: '🌐', visitors: '1,120', pct: 4 },
                ].map((item) => (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-text-primary">
                        <span>{item.flag}</span>
                        <span>{isRTL ? item.ar : item.country}</span>
                      </span>
                      <span className="text-text-secondary">{item.visitors} ({item.pct}%)</span>
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
                    {[
                      { name: 'Chrome', pct: '62.4%' },
                      { name: 'Safari', pct: '28.1%' },
                      { name: 'Edge', pct: '5.2%' },
                      { name: 'Firefox', pct: '2.8%' },
                      { name: 'Others', pct: '1.5%' },
                    ].map((b) => (
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
                    {[
                      { name: 'iOS (iPhone / iPad)', pct: '48.6%' },
                      { name: 'Android', pct: '24.2%' },
                      { name: 'Windows 11 / 10', pct: '18.4%' },
                      { name: 'macOS', pct: '7.8%' },
                      { name: 'Linux / ChromeOS', pct: '1.0%' },
                    ].map((os) => (
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
                  {L('Client-side and server-side events captured by NazAnalytics SDK', 'الأحداث الملتقطة عبر كود التتبع البرمجي')}
                </p>
              </div>
              <Badge tone="violet">{L('SDK v2.4 Active', 'إصدار التتبع نشط')}</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs rtl:text-right">
                <thead className="border-b border-border bg-surface-secondary text-text-secondary">
                  <tr>
                    <th className="p-3.5 font-bold">{L('Event Name', 'اسم الحدث')}</th>
                    <th className="p-3.5 font-bold">{L('Category', 'التصنيف')}</th>
                    <th className="p-3.5 font-bold">{L('Total Count', 'إجمالي المرات')}</th>
                    <th className="p-3.5 font-bold">{L('Unique Visitors', 'الزوار الفريدون')}</th>
                    <th className="p-3.5 font-bold">{L('Per Session', 'لكل جلسة')}</th>
                    <th className="p-3.5 font-bold">{L('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'pricing_plan_select', category: 'conversion', count: 4890, unique: 3410, perSession: '0.12', status: 'tracked' },
                    { name: 'signup_form_submit', category: 'acquisition', count: 2120, unique: 1980, perSession: '0.05', status: 'tracked' },
                    { name: 'demo_video_play', category: 'engagement', count: 6840, unique: 5120, perSession: '0.17', status: 'tracked' },
                    { name: 'roi_calculator_calculate', category: 'lead_gen', count: 1840, unique: 1450, perSession: '0.04', status: 'tracked' },
                    { name: 'faq_accordion_toggle', category: 'ux', count: 8940, unique: 6100, perSession: '0.22', status: 'tracked' },
                    { name: 'whatsapp_connect_click', category: 'conversion', count: 3120, unique: 2640, perSession: '0.08', status: 'tracked' },
                  ].map((evt) => (
                    <tr key={evt.name} className="hover:bg-surface-elevated">
                      <td className="p-3.5 font-mono font-bold text-brand">{evt.name}</td>
                      <td className="p-3.5">
                        <Badge tone="slate">{evt.category}</Badge>
                      </td>
                      <td className="p-3.5 font-bold text-text-primary">{evt.count.toLocaleString()}</td>
                      <td className="p-3.5 text-text-secondary">{evt.unique.toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-text-muted">{evt.perSession}</td>
                      <td className="p-3.5">
                        <Badge tone="emerald">{L('Active', 'نشط')}</Badge>
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
              <Badge tone="emerald">{L('Overall: 4.85% Conversion', 'إجمالي التحويل: ٤.٨٥٪')}</Badge>
            </div>

            <div className="space-y-4">
              {funnelSteps.map((step, idx) => (
                <div key={step.step} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-primary">{step.step}</span>
                    <div className="flex items-center gap-4">
                      {idx > 0 && (
                        <span className="text-[11px] text-error">
                          ↓ {step.dropoff} {L('drop-off', 'تسرب')}
                        </span>
                      )}
                      <span className="text-text-secondary">{step.visitors.toLocaleString()}</span>
                      <span className="w-12 text-right font-black text-brand">{step.rate}%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${step.rate}%` }}
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
                    'When an anonymous visitor browses pages and subsequently signs up or logs into Nazeer Business, NazAnalytics.identify() safely associates prior anonymous session touches to the created user ID while preserving privacy controls and honoring consent rules.',
                    'عند تصفح الزائر المجهول للموقع ثم قيامه بإنشاء حساب أو تسجيل الدخول، يقوم النظام بربط سجل تصفحه السابق بحسابه الجديد بأمان تام مع احترام معايير حماية البيانات والخصوصية.'
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
              label={L('Gross Attributed Revenue', 'إجمالي الإيرادات المعتمدة')}
              value="SAR 342,800"
              detail={L('Across connected stores', 'عبر المتاجر المرتبطة')}
              trend="+24.2%"
              icon={<ShoppingBag size={18} />}
              tone="emerald"
            />
            <StatCard
              label={L('Total Completed Orders', 'إجمالي الطلبات المكتملة')}
              value="1,240"
              detail={L('Avg Order Value: SAR 276', 'متوسط قيمة الطلب: ٢٧٦ ر.س')}
              trend="+18.5%"
              icon={<ShoppingCart size={18} />}
              tone="cyan"
            />
            <StatCard
              label={L('Cart Abandonment Rate', 'معدل التخلي عن السلة')}
              value="62.4%"
              detail={L('Recoverable with WhatsApp', 'يمكن استعادتها عبر واتساب')}
              trend="-4.1%"
              icon={<TrendingDown size={18} />}
              tone="amber"
            />
            <StatCard
              label={L('Native Store Integrations', 'المتاجر المتصلة')}
              value="3 Active"
              detail={L('Shopify, Salla, WooCommerce', 'سلة، شوبيفاي، ووكومرس')}
              trend={L('Healthy', 'سليم')}
              icon={<Zap size={18} />}
              tone="violet"
            />
          </div>

          {/* Integration Status Badges */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Salla', ar: 'منصة سلة', status: 'Connected & Syncing', orders: '640 orders', rev: 'SAR 182,400' },
              { name: 'Shopify', ar: 'منصة شوبيفاي', status: 'Connected & Syncing', orders: '420 orders', rev: 'SAR 116,200' },
              { name: 'WooCommerce', ar: 'ووكومرس', status: 'Connected & Syncing', orders: '180 orders', rev: 'SAR 44,200' },
            ].map((conn) => (
              <Panel key={conn.name} className="p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-text-primary">{conn.name}</h4>
                  <Badge tone="emerald">{L('Active Sync', 'مزامنة نشطة')}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                  <span>{conn.orders}</span>
                  <span className="font-bold text-text-primary">{conn.rev}</span>
                </div>
              </Panel>
            ))}
          </div>
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
                <pre className="overflow-x-auto whitespace-pre leading-relaxed">{trackingSnippet}</pre>
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
                    {verificationStatus === 'verified' && (
                      <Badge tone="emerald">
                        <CheckCircle2 size={12} className="mr-1 inline rtl:ml-1 rtl:mr-0" />
                        {L('Verified & Receiving Events', 'تم التحقق ويستقبل الأحداث بنجاح')}
                      </Badge>
                    )}
                    <Button onClick={handleTestVerification} disabled={verificationStatus === 'testing'}>
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
                      {L('Safely ties anonymous visitor session to authenticated customer profile.', 'لربط هوية الزائر بملف العميل عند تسجيل الدخول.')}
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
                      {L('Records goal completion and attributed commercial currency value.', 'لتسجيل إتمام أهداف الشراء والقيمة المالية.')}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Privacy & Domain Security Controls */}
            <Panel className="p-6 lg:col-span-1">
              <h4 className="text-sm font-black text-text-primary">
                {L('Privacy, Compliance & Domain Whitelist', 'الخصوصية وحماية النطاقات')}
              </h4>
              <p className="text-xs text-text-secondary">
                {L('Strict multi-tenant security and Saudi PDPL / GDPR compliance', 'عزل النطاقات والتوافق الصارم مع لوائح الخصوصية')}
              </p>

              <div className="mt-5 space-y-4">
                {/* Domain Whitelist */}
                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    {L('Authorized Whitelist Domain', 'النطاق المصرح له بالإرسال')}
                  </label>
                  <input
                    type="text"
                    value={whitelistDomain}
                    onChange={(e) => setWhitelistDomain(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-mono text-text-primary outline-none focus:border-brand"
                    placeholder="example.com"
                  />
                  <span className="mt-1 block text-[11px] text-text-muted">
                    {L('Events from unauthorized origins will be rejected immediately.', 'أي أحداث قادمة من نطاقات أخرى سيتم رفضها فوراً.')}
                  </span>
                </div>

                {/* Privacy Toggles */}
                <div className="space-y-3 pt-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={anonymizeIp}
                      onChange={(e) => setAnonymizeIp(e.target.checked)}
                      className="mt-0.5 rounded text-brand"
                    />
                    <div>
                      <span className="block text-xs font-bold text-text-primary">
                        {L('Anonymize IP Addresses', 'إخفاء عناوين IP للزوار')}
                      </span>
                      <span className="block text-[11px] text-text-muted">
                        {L('Truncates last octet (e.g. 192.168.1.0). Never stores raw IPs.', 'يتم حجب الجزء الأخير من العنوان لحماية خصوصية الزوار.')}
                      </span>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={cookielessMode}
                      onChange={(e) => setCookielessMode(e.target.checked)}
                      className="mt-0.5 rounded text-brand"
                    />
                    <div>
                      <span className="block text-xs font-bold text-text-primary">
                        {L('Cookie-less Tracking Mode', 'وضع التتبع بدون ملفات تعريف')}
                      </span>
                      <span className="block text-[11px] text-text-muted">
                        {L('Uses daily rolling cryptographic salt instead of cookies.', 'يعتمد على تشفير مؤقت متجدد يومياً بدون الحاجة لملفات كوكيز.')}
                      </span>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={respectDnt}
                      onChange={(e) => setRespectDnt(e.target.checked)}
                      className="mt-0.5 rounded text-brand"
                    />
                    <div>
                      <span className="block text-xs font-bold text-text-primary">
                        {L('Honor Do-Not-Track (DNT)', 'احترام رغبة عدم التتبع (DNT)')}
                      </span>
                      <span className="block text-[11px] text-text-muted">
                        {L('Respects browser privacy flags automatically.', 'يتوقف عن التتبع تلقائياً عند تفعيل خيار الخصوصية في المتصفح.')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
