'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { 
  Bot, TrendingUp, AlertTriangle, MessageSquare, 
  ThumbsUp, ThumbsDown, CheckCircle, BrainCircuit,
  MessageCircle, BarChart3, AlertCircle, RefreshCw, Calendar, Clock
} from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
  }
}

interface TrainingStats {
  range: { preset: string; start: string | null; end: string | null }
  total_ai_messages: number
  ai_messages_today: number
  ai_messages_this_week: number
  ai_messages_this_month: number
  total_conversations: number
  conversations_with_ai_reply: number
  auto_reply_rate: number | null
  avg_confidence: number | null
  confidence_count: number
  confidence_total: number
  escalated_conversations: number
  escalation_rate: number | null
  escalations_today: number
  escalations_this_week: number
  escalations_this_month: number
  escalation_reasons: Record<string, number>
  intent_breakdown: Record<string, number>
  channel_breakdown: Record<string, number>
  dialect_breakdown: Record<string, number>
  issue_breakdown: Record<string, number>
  feedback_total: number
  feedback_positive: number
  feedback_negative: number
  feedback_rate: number | null
  satisfaction_percentage: number | null
  last_updated: string
}

const PRESETS = [
  { key: 'today', en: 'Today', ar: 'اليوم', icon: Clock },
  { key: 'last_7_days', en: 'Last 7 days', ar: 'آخر 7 أيام', icon: Calendar },
  { key: 'last_30_days', en: 'Last 30 days', ar: 'آخر 30 يوم', icon: Calendar },
  { key: 'this_month', en: 'This month', ar: 'هذا الشهر', icon: Calendar },
  { key: 'all_time', en: 'All time', ar: 'كل الوقت', icon: BarChart3 },
]

const pctLabel = (v: number | null): string =>
  v === null ? 'N/A' : `${Math.round(v)}%`

const dialectLabels: Record<string, [string, string]> = {
  egyptian: ['Egyptian', 'مصري'],
  gulf: ['Gulf', 'خليجي'],
  msa: ['MSA', 'فصحى'],
  mixed: ['Mixed', 'مختلط'],
  english: ['English', 'إنجليزي'],
  unknown: ['Unknown', 'غير معروف'],
}

// Reusable animated card component
function SectionCard({ title, icon: Icon, children, className = "" }: { title: string, icon?: any, children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="w-5 h-5 text-accent" />}
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

function StatCard({ label, value, subtext, icon: Icon, colorClass, gradientClass }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm group hover:shadow-md transition-shadow`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full ${gradientClass} transition-transform group-hover:scale-110`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtext && <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{subtext}</div>}
      </div>
    </motion.div>
  )
}

function Bars({ data, colorClass }: { data: Record<string, number>; colorClass: string }) {
  const fmt = (n: number) => n.toLocaleString()
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((s, [, c]) => s + c, 0)
  
  return (
    <div className="space-y-4">
      {entries.map(([key, count], idx) => {
        const width = total > 0 ? (count / total) * 100 : 0
        return (
          <motion.div 
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {fmt(count)} <span className="text-gray-400 font-normal ml-1">({width > 0 ? `${Math.round(width)}%` : '0%'})</span>
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${colorClass}`}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function EmptyState({ text, icon: Icon }: { text: string, icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 opacity-60">
      <Icon className="w-10 h-10 mb-3 text-gray-400" />
      <div className="text-sm font-medium text-gray-500 text-center">{text}</div>
    </div>
  )
}

export default function TrainingDashboard() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => (isRTL ? ar : en)

  const [preset, setPreset] = useState('last_30_days')
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inflight = useRef(false)
  const wanted = useRef(preset)

  const load = useCallback(async (p: string) => {
    wanted.current = p
    if (inflight.current) return
    inflight.current = true

    if (stats) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API}/training/stats?preset=${encodeURIComponent(p)}`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: TrainingStats = await res.json()
      if (wanted.current === p) setStats(data)
    } catch (e: unknown) {
      if (wanted.current === p) {
        setError(e instanceof Error ? e.message : 'Failed to load statistics')
      }
    } finally {
      inflight.current = false
      setRefreshing(false)
      setLoading(false)
      if (wanted.current !== p) {
        void load(wanted.current)
      }
    }
  }, [stats])

  const refresh = useCallback(() => {
    if (loading || refreshing) return
    void load(wanted.current)
  }, [load, loading, refreshing])

  useEffect(() => {
    void load(preset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  const busy = loading || refreshing
  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-black/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            <BrainCircuit className="w-4 h-4" />
            {L('AI Analytics Core', 'نواة تحليلات الذكاء الاصطناعي')}
          </div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {L('Training Dashboard', 'لوحة التدريب')}
            </h1>
            <a 
              href="/dashboard/training/review" 
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              {L('Review Corrections', 'مراجعة التصحيحات')}
            </a>
          </div>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl">
            {L('Deep insights into AI performance, auto-replies, and human handoffs across all channels.', 'رؤى عميقة حول أداء الذكاء الاصطناعي، والردود التلقائية، والتسليم للبشر عبر جميع القنوات.')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {stats && (
            <div className="text-xs font-medium text-gray-400 bg-white dark:bg-[#1A1D21] px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
              <span className="mr-1">{L('Updated:', 'مُحدث:')}</span> 
              <span className="text-gray-700 dark:text-gray-300">{stats.last_updated}</span>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={busy}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2">
          {PRESETS.map((p) => {
            const isSelected = preset === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                disabled={busy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 disabled:opacity-50 ${
                  isSelected
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'bg-white dark:bg-[#1A1D21] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-accent/30 hover:bg-accent/5'
                }`}
              >
                <p.icon className={`w-4 h-4 ${isSelected ? 'opacity-90' : 'text-gray-400'}`} />
                {L(p.en, p.ar)}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !stats ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col justify-center items-center h-64 gap-4"
          >
            <div className="w-10 h-10 border-3 border-gray-200 dark:border-gray-800 border-t-accent rounded-full animate-spin" />
            <div className="text-sm font-medium text-gray-500 animate-pulse">{L('Crunching numbers...', 'جاري تحليل البيانات...')}</div>
          </motion.div>
        ) : error && !stats ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1A1D21] rounded-3xl border border-red-100 dark:border-red-900/30"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-2">{L('Oops! Something went wrong', 'عذراً! حدث خطأ ما')}</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button onClick={refresh} className="px-6 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition-colors">
              {L('Try again', 'حاول مجدداً')}
            </button>
          </motion.div>
        ) : stats ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {stats.total_ai_messages === 0 && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
                    {L('No AI data yet', 'لا توجد بيانات للذكاء الاصطناعي بعد')}
                  </h4>
                  <p className="text-sm text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                    {L(
                      'Stats will appear here once the AI starts actively replying to conversations. Ensure AI is enabled for your channels.',
                      'ستظهر الإحصائيات هنا بمجرد أن يبدأ الذكاء الاصطناعي بالرد على المحادثات بنشاط. تأكد من تفعيل الذكاء الاصطناعي لقنواتك.',
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              <StatCard 
                label={L('Auto-Reply Rate', 'معدل الرد التلقائي')} 
                value={pctLabel(stats.auto_reply_rate)} 
                subtext={L(`On ${fmt(stats.total_conversations)} total convos`, `على ${fmt(stats.total_conversations)} محادثة إجمالية`)}
                icon={Bot} 
                colorClass="text-emerald-500" 
                gradientClass="bg-gradient-to-br from-emerald-500 to-emerald-300"
              />
              <StatCard 
                label={L('Avg Confidence', 'متوسط الثقة')} 
                value={pctLabel(stats.avg_confidence)} 
                subtext={stats.avg_confidence === null ? L('Need more data', 'بحاجة لمزيد من البيانات') : L(`High accuracy threshold`, `عتبة دقة عالية`)}
                icon={CheckCircle} 
                colorClass={stats.avg_confidence === null ? 'text-gray-400' : stats.avg_confidence >= 70 ? 'text-blue-500' : 'text-amber-500'} 
                gradientClass={stats.avg_confidence === null ? 'bg-gradient-to-br from-gray-400 to-gray-300' : stats.avg_confidence >= 70 ? 'bg-gradient-to-br from-blue-500 to-blue-300' : 'bg-gradient-to-br from-amber-500 to-amber-300'}
              />
              <StatCard 
                label={L('AI Replies Total', 'إجمالي ردود الذكاء الاصطناعي')} 
                value={fmt(stats.total_ai_messages)} 
                subtext={L(`${fmt(stats.ai_messages_today)} today`, `${fmt(stats.ai_messages_today)} اليوم`)}
                icon={MessageSquare} 
                colorClass="text-accent" 
                gradientClass="bg-gradient-to-br from-accent to-purple-400"
              />
              <StatCard 
                label={L('Escalation Rate', 'معدل التصعيد')} 
                value={pctLabel(stats.escalation_rate)} 
                subtext={L(`${fmt(stats.escalations_today)} escalations today`, `${fmt(stats.escalations_today)} تصعيد اليوم`)}
                icon={AlertTriangle} 
                colorClass="text-red-500" 
                gradientClass="bg-gradient-to-br from-red-500 to-red-300"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Intent & Context Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SectionCard title={L('Intent Analysis', 'تحليل النوايا')} icon={TrendingUp}>
                    {Object.keys(stats.intent_breakdown).length > 0 ? (
                      <Bars data={stats.intent_breakdown} colorClass="bg-accent" />
                    ) : (
                      <EmptyState icon={BarChart3} text={L('No intent data available for this period', 'لا توجد بيانات نوايا متاحة لهذه الفترة')} />
                    )}
                  </SectionCard>

                  <SectionCard title={L('Escalation Triggers', 'محفزات التصعيد')} icon={AlertCircle}>
                    {Object.keys(stats.escalation_reasons).length > 0 ? (
                      <Bars data={stats.escalation_reasons} colorClass="bg-red-500" />
                    ) : (
                      <EmptyState icon={CheckCircle} text={L('Great! No specific escalation reasons recorded', 'رائع! لا توجد أسباب تصعيد محددة مسجلة')} />
                    )}
                  </SectionCard>
                </div>

                {/* Feedback Hub */}
                <SectionCard title={L('Customer Feedback Hub', 'مركز تقييمات العملاء')} icon={MessageCircle} className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1A1D21] dark:to-[#15171a]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{L('Satisfaction Score', 'مؤشر الرضا')}</div>
                      <div className="text-4xl font-black text-gray-900 dark:text-white">
                        {stats.feedback_total > 0 ? `${Math.round(stats.satisfaction_percentage ?? 0)}%` : '--'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{L(`Based on ${stats.feedback_total} ratings`, `بناءً على ${stats.feedback_total} تقييم`)}</div>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center">
                      <ThumbsUp className="w-6 h-6 text-emerald-500 mb-2" />
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(stats.feedback_positive)}</div>
                      <div className="text-xs font-medium text-emerald-600/70 dark:text-emerald-500/70 mt-1">{L('Positive', 'إيجابي')}</div>
                    </div>
                    <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center">
                      <ThumbsDown className="w-6 h-6 text-red-500 mb-2" />
                      <div className="text-2xl font-bold text-red-700 dark:text-red-400">{fmt(stats.feedback_negative)}</div>
                      <div className="text-xs font-medium text-red-600/70 dark:text-red-500/70 mt-1">{L('Negative', 'سلبي')}</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-4">{L('Reported Issues', 'المشاكل المبلغ عنها')}</h4>
                    {Object.keys(stats.issue_breakdown).length > 0 ? (
                      <Bars data={stats.issue_breakdown} colorClass="bg-orange-500" />
                    ) : (
                      <p className="text-sm text-gray-500 text-center italic py-2">{L('No negative feedback issues reported.', 'لم يتم الإبلاغ عن أي مشاكل في التقييمات السلبية.')}</p>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-6">
                
                {/* Channels */}
                <SectionCard title={L('Traffic by Channel', 'الزيارات حسب القناة')}>
                  {Object.keys(stats.channel_breakdown).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.channel_breakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([channel, count], i) => {
                          const total = Object.values(stats.channel_breakdown).reduce((a, b) => a + b, 0);
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={channel} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                                channel.toLowerCase().includes('whatsapp') ? 'bg-[#25D366]' :
                                channel.toLowerCase().includes('instagram') ? 'bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]' :
                                channel.toLowerCase().includes('messenger') ? 'bg-[#0084FF]' :
                                'bg-gray-800'
                              }`}>
                                {channel.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-end mb-1">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{channel}</span>
                                  <span className="text-xs font-medium text-gray-500">{fmt(count)} ({Math.round(pct)}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <EmptyState icon={MessageSquare} text={L('No channel data yet', 'لا توجد بيانات قنوات بعد')} />
                  )}
                </SectionCard>

                {/* Demographics / Language */}
                <SectionCard title={L('Audience Demographics', 'ديموغرافية الجمهور')}>
                  {Object.keys(stats.dialect_breakdown).length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.keys(stats.dialect_breakdown).filter(k => dialectLabels[k]).map(k => (
                          <span key={k} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase rounded-md border border-blue-100 dark:border-blue-800/50">
                            {dialectLabels[k][isRTL ? 1 : 0]}
                          </span>
                        ))}
                      </div>
                      <Bars data={stats.dialect_breakdown} colorClass="bg-blue-500" />
                    </div>
                  ) : (
                    <EmptyState icon={BrainCircuit} text={L('No language data yet', 'لا توجد بيانات لغة بعد')} />
                  )}
                </SectionCard>

                {/* Additional Insight block */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-full" />
                  <h3 className="font-bold text-lg mb-2 relative z-10">{L('AI Tip of the Day', 'نصيحة اليوم للذكاء الاصطناعي')}</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed relative z-10 mb-4">
                    {L('To lower your escalation rate, review negative feedback and add the corrected answers to your Business FAQs.', 'لخفض معدل التصعيد، راجع التقييمات السلبية وأضف الإجابات المصححة إلى الأسئلة الشائعة لعملك.')}
                  </p>
                </div>
                
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
