'use client'
/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Bot, CheckCircle2, Clock, Database, Radio, Server, Sparkles, TrendingUp, Users, Wallet, Wifi } from 'lucide-react'
import { AdminShell, Badge, Button, PageHeader, Panel, SkeletonRows, StatCard } from '../../components/admin/AdminUI'
import { useLang } from '../../lib/LangContext'

type DashboardStats = {
  total_users: number
  active_users?: number
  active_subscriptions: number
  total_revenue: number
  total_channels: number
  total_messages: number
  total_conversations: number
  ai_replies?: number
  inbound_messages?: number
  users_this_month: number
  revenue_this_month: number
  messages_today?: number
  conversations_today?: number
}

type User = { id: number; name: string; email: string; created_at: string; is_admin: boolean }
type Subscription = { id: number; user: User; package?: { name?: string }; amount_paid: number; status: string; created_at: string }
type ActivityItem = { id: number; content: string; direction: string; is_ai: boolean; created_at: string; conversation?: { sender_name?: string; channel?: { type?: string } } }
type AiSettings = { provider?: 'gemini' | 'claude'; fallback_provider?: 'gemini' | 'claude'; claude_configured?: boolean; gemini_configured?: boolean }

type DashboardPayload = {
  stats: DashboardStats
  recent_users: User[]
  recent_subscriptions: Subscription[]
  recent_activity?: ActivityItem[]
  ai_settings?: AiSettings
}

export default function AdminDashboard() {
  const { isRTL } = useLang()
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchDashboard() }, [])

  const token = () => document.cookie.split(';').find((c) => c.trim().startsWith('naz_token='))?.split('=')[1]

  const fetchDashboard = async () => {
    try {
      const auth = token()
      if (!auth) throw new Error(isRTL ? '???? ????? ?????? ???? ???? ???????' : 'Please login to view admin dashboard')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${auth}` } })
      if (!response.ok) throw new Error(isRTL ? '???? ????? ?????? ???? ???????' : 'Failed to load dashboard data')
      setData(await response.json())
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  const currency = (value: number) => new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(value || 0)
  const number = (value?: number) => new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(value || 0)

  const derived = useMemo(() => {
    const stats = data?.stats
    const aiRate = stats?.total_messages ? Math.round(((stats.ai_replies || 0) / stats.total_messages) * 100) : 0
    const activeRate = stats?.total_users ? Math.round(((stats.active_users || 0) / stats.total_users) * 100) : 0
    return { aiRate, activeRate }
  }, [data])

  if (loading) return <AdminShell><PageHeader title={isRTL ? '???? ???????' : 'Admin Overview'} description={isRTL ? '???? ????? ?????? ??????.' : 'Loading platform intelligence.'} /><SkeletonRows rows={8} /></AdminShell>
  if (error) return <AdminShell><Panel className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Panel></AdminShell>

  const stats = data!.stats
  const ai = data!.ai_settings || {}
  const providerConfigured = ai.provider === 'claude' ? ai.claude_configured : ai.gemini_configured

  return (
    <AdminShell>
      <PageHeader
        eyebrow={isRTL ? '???? ?????? Naz' : 'Naz Operations'}
        title={isRTL ? '???? ????? ???? ???????' : 'Enterprise Admin Overview'}
        description={isRTL ? '???? ?????????? ?????????? ?????????? ???? ?????? ????????? ?? ???? ????? ????? ??????? ???????.' : 'Monitor revenue, usage, conversations, and AI health from one operational command surface.'}
        actions={<><Button variant="ghost" onClick={fetchDashboard}><Activity size={16} />{isRTL ? '?????' : 'Refresh'}</Button><Button><Sparkles size={16} />{isRTL ? '????? ????' : 'Quick report'}</Button></>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isRTL ? '?????? ?????????' : 'Total Revenue'} value={currency(stats.total_revenue)} detail={isRTL ? '??? ?????' : 'This month'} trend={currency(stats.revenue_this_month)} icon={<Wallet size={22} />} tone="emerald" />
        <StatCard label={isRTL ? '??????????' : 'Total Users'} value={number(stats.total_users)} detail={isRTL ? '???????? ?????' : 'Active users'} trend={`${number(stats.active_users)} (${derived.activeRate}%)`} icon={<Users size={22} />} tone="cyan" />
        <StatCard label={isRTL ? '???? ?????? ?????????' : 'AI Replies'} value={number(stats.ai_replies)} detail={isRTL ? '?? ?????? ???????' : 'Of all messages'} trend={`${derived.aiRate}%`} icon={<Bot size={22} />} tone="violet" />
        <StatCard label={isRTL ? '?????????' : 'Conversations'} value={number(stats.total_conversations)} detail={isRTL ? '?????' : 'Today'} trend={number(stats.conversations_today)} icon={<Radio size={22} />} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{isRTL ? '???? ??????' : 'Performance Summary'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? '?????? ????? ???????? ?????? ????? ??? ?????? ??????.' : 'Daily, weekly, and monthly signals from live platform data.'}</p>
            </div>
            <Badge tone={providerConfigured ? 'emerald' : 'amber'}>{providerConfigured ? (isRTL ? 'AI ????' : 'AI Ready') : (isRTL ? '????? ????? API' : 'API key needed')}</Badge>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[{ label: isRTL ? '????? ?????' : 'Messages today', value: stats.messages_today || 0, total: Math.max(stats.total_messages, 1) }, { label: isRTL ? '????? ?????' : 'Connected channels', value: stats.total_channels, total: Math.max(stats.total_users, 1) }, { label: isRTL ? '???????? ????' : 'Active subscriptions', value: stats.active_subscriptions, total: Math.max(stats.total_users, 1) }].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span><span className="text-slate-500 dark:text-slate-400">{number(item.value)}</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(100, Math.round((item.value / item.total) * 100))}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{isRTL ? '???? ??????' : 'System Status'}</h2>
          <div className="mt-4 space-y-3">
            {[{ icon: Server, label: isRTL ? '??????' : 'Server', status: isRTL ? '?????' : 'Operational' }, { icon: Database, label: isRTL ? '????? ????????' : 'Database', status: isRTL ? '?????' : 'Connected' }, { icon: Wifi, label: isRTL ? '????? API' : 'API', status: isRTL ? '????' : 'Healthy' }, { icon: Bot, label: isRTL ? '???? AI' : 'AI Provider', status: `${ai.provider || 'gemini'} -> ${ai.fallback_provider || 'claude'}` }].map((item) => <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5"><div className="flex items-center gap-3"><item.icon size={18} className="text-emerald-500" /><span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span></div><span className="text-xs text-slate-500 dark:text-slate-400">{item.status}</span></div>)}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950 dark:text-white">{isRTL ? '?????? ??????' : 'Recent Activity'}</h2><Badge tone="cyan">{number(data!.recent_activity?.length)} {isRTL ? '???' : 'events'}</Badge></div>
          <div className="space-y-3">
            {(data!.recent_activity || []).map((item) => <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">{item.is_ai ? <Bot size={17} /> : <CheckCircle2 size={17} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900 dark:text-white">{item.conversation?.sender_name || (isRTL ? '????' : 'Customer')}</span><Badge tone={item.is_ai ? 'violet' : 'slate'}>{item.is_ai ? 'AI' : item.direction}</Badge><span className="text-xs text-slate-500">{item.conversation?.channel?.type || 'channel'}</span></div><p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.content}</p></div><div className="whitespace-nowrap text-xs text-slate-500"><Clock size={13} className="mb-1 inline" /> {formatDate(item.created_at)}</div></div>)}
            {(!data!.recent_activity || data!.recent_activity.length === 0) && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">{isRTL ? '?? ???? ???? ???? ???.' : 'No recent activity yet.'}</div>}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{isRTL ? '???? ??????????' : 'Latest Subscriptions'}</h2>
          <div className="mt-4 space-y-3">
            {data!.recent_subscriptions.map((sub) => <div key={sub.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><div className="flex items-center justify-between gap-3"><div><div className="font-bold text-slate-900 dark:text-white">{sub.user?.name}</div><div className="text-xs text-slate-500">{sub.package?.name || 'Package'}</div></div><Badge tone={sub.status === 'active' ? 'emerald' : 'rose'}>{sub.status}</Badge></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">{formatDate(sub.created_at)}</span><span className="font-black text-slate-950 dark:text-white">{currency(sub.amount_paid)}</span></div></div>)}
          </div>
        </Panel>
      </div>
    </AdminShell>
  )
}



