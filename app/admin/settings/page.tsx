'use client'
/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bot, CheckCircle2, KeyRound, RotateCw, Save, Settings2, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react'
import { AdminShell, Badge, Button, Field, PageHeader, Panel, SkeletonRows, inputClass } from '../../../components/admin/AdminUI'
import { useLang } from '../../../lib/LangContext'

type Provider = 'gemini' | 'claude'

type Settings = {
  app_name: string
  app_url: string
  ai_provider: Provider
  ai_fallback_provider: Provider
  ai_temperature: number
  ai_max_tokens: number
  ai_timeout: number
  ai_retries: number
  ai_streaming: boolean
  gemini_api_key: string | null
  gemini_model: string | null
  gemini_configured: boolean
  claude_api_key: string | null
  claude_model: string | null
  claude_configured: boolean
  meta_app_id: string | null
  meta_app_secret: string | null
  google_client_id: string | null
  google_client_secret: string | null
  pusher_app_id: string | null
  pusher_app_key: string | null
  pusher_cluster: string | null
  pusher_host: string | null
  moyasar_publishable_key: string
  moyasar_secret_key: string | null
}

const defaults = {
  app_name: '',
  ai_provider: 'gemini' as Provider,
  ai_fallback_provider: 'claude' as Provider,
  ai_temperature: 0.7,
  ai_max_tokens: 500,
  ai_timeout: 30,
  ai_retries: 3,
  ai_streaming: false,
  gemini_api_key: '',
  gemini_model: 'gemini-2.5-flash',
  claude_api_key: '',
  claude_model: 'claude-haiku-4-5-20251001',
  meta_app_id: '',
  meta_app_secret: '',
  google_client_id: '',
  google_client_secret: '',
  pusher_app_id: '',
  pusher_app_key: '',
  pusher_secret: '',
  pusher_cluster: '',
  pusher_host: '',
  moyasar_publishable_key: '',
  moyasar_secret_key: '',
}

export default function AdminSettingsPage() {
  const { isRTL } = useLang()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [formData, setFormData] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchSettings() }, [])

  const token = () => document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, '$1')

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, { headers: { Authorization: `Bearer ${token()}` } })
      if (!response.ok) throw new Error(isRTL ? '???? ????? ?????????' : 'Failed to load settings')
      const data = await response.json()
      setSettings(data)
      setFormData({
        ...defaults,
        app_name: data.app_name || '',
        ai_provider: data.ai_provider || 'gemini',
        ai_fallback_provider: data.ai_fallback_provider || (data.ai_provider === 'gemini' ? 'claude' : 'gemini'),
        ai_temperature: Number(data.ai_temperature ?? 0.7),
        ai_max_tokens: Number(data.ai_max_tokens ?? 500),
        ai_timeout: Number(data.ai_timeout ?? 30),
        ai_retries: Number(data.ai_retries ?? 3),
        ai_streaming: Boolean(data.ai_streaming),
        gemini_model: data.gemini_model || 'gemini-2.5-flash',
        claude_model: data.claude_model || 'claude-haiku-4-5-20251001',
        meta_app_id: data.meta_app_id || '',
        google_client_id: data.google_client_id || '',
        pusher_app_id: data.pusher_app_id || '',
        pusher_app_key: data.pusher_app_key || '',
        pusher_cluster: data.pusher_cluster || '',
        pusher_host: data.pusher_host || '',
        moyasar_publishable_key: data.moyasar_publishable_key || '',
      })
    } catch (error: any) {
      setError(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const update = (key: keyof typeof formData, value: any) => setFormData((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || (isRTL ? '???? ??? ?????????' : 'Failed to update settings'))
      }
      toast.success(isRTL ? '?? ??? ????????? ?????' : 'Settings saved successfully')
      await fetchSettings()
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminShell><PageHeader title={isRTL ? '?????????' : 'Settings'} description={isRTL ? '???? ????? ??????? ??????.' : 'Loading platform configuration.'} /><SkeletonRows rows={8} /></AdminShell>

  const primaryConfigured = formData.ai_provider === 'claude' ? settings?.claude_configured : settings?.gemini_configured
  const fallbackConfigured = formData.ai_fallback_provider === 'claude' ? settings?.claude_configured : settings?.gemini_configured

  return (
    <AdminShell>
      <PageHeader
        eyebrow={isRTL ? '??????? ???????' : 'Enterprise Settings'}
        title={isRTL ? '?????? ??????? ??????? ?????????' : 'Platform and AI Control'}
        description={isRTL ? '????? ??????? ????????? ?????????? ??????? ?????? ?? ???? ???? ?? ??? ???? ?? ???? Laravel.' : 'Manage provider switching, secure keys, integrations, performance, and billing from one production settings surface.'}
        actions={<><Button variant="ghost" onClick={fetchSettings}><RotateCw size={16} />{isRTL ? '????? ?????' : 'Reload'}</Button><Button onClick={handleSubmit} disabled={saving}><Save size={16} />{saving ? (isRTL ? '???? ?????' : 'Saving') : (isRTL ? '???' : 'Save')}</Button></>}
      />

      {error && <Panel className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Panel>}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{isRTL ? '???? ?????? ?????????' : 'AI Provider'}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? '?? ????? ?????? ????????? ?????? ??? ????????.' : 'All system AI requests follow this selection.'}</p></div><Bot className="text-emerald-500" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['gemini', 'claude'] as Provider[]).map((provider) => {
              const selected = formData.ai_provider === provider
              const configured = provider === 'claude' ? settings?.claude_configured : settings?.gemini_configured
              return <button key={provider} onClick={() => update('ai_provider', provider)} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:bg-emerald-400/10' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'}`}><div className="flex items-center justify-between"><span className="text-lg font-black capitalize text-slate-950 dark:text-white">{provider}</span><Badge tone={configured ? 'emerald' : 'amber'}>{configured ? (isRTL ? '????' : 'Ready') : (isRTL ? '????' : 'Needs key')}</Badge></div><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{provider === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}</p></button>
            })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={isRTL ? '?????? ?????????' : 'Fallback provider'}><select className={inputClass} value={formData.ai_fallback_provider} onChange={(e) => update('ai_fallback_provider', e.target.value)}><option value="gemini">Gemini</option><option value="claude">Claude</option></select></Field>
            <Field label={isRTL ? '???? ???????' : 'Connection status'}><div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><CheckCircle2 size={17} className={primaryConfigured ? 'text-emerald-500' : 'text-amber-500'} />{primaryConfigured ? (isRTL ? '?????? ??????? ????' : 'Primary provider ready') : (isRTL ? '??? ????? API' : 'Add API key')}</div></Field>
          </div>
        </Panel>

        <Panel>
          <div className="mb-5 flex items-center gap-3"><SlidersHorizontal className="text-cyan-500" /><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{isRTL ? '???? ???????' : 'Model Behavior'}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{isRTL ? '???????? ??????? ??????? ?????? ????????.' : 'Temperature, tokens, timeout, and retry policy.'}</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Gemini Model"><input className={inputClass} value={formData.gemini_model} onChange={(e) => update('gemini_model', e.target.value)} /></Field>
            <Field label="Claude Model"><input className={inputClass} value={formData.claude_model} onChange={(e) => update('claude_model', e.target.value)} /></Field>
            <Field label={isRTL ? '???? ???????' : 'Temperature'}><input className={inputClass} type="number" min="0" max="2" step="0.1" value={formData.ai_temperature} onChange={(e) => update('ai_temperature', Number(e.target.value))} /></Field>
            <Field label={isRTL ? '???? ?????? ??????' : 'Max tokens'}><input className={inputClass} type="number" min="50" max="8000" value={formData.ai_max_tokens} onChange={(e) => update('ai_max_tokens', Number(e.target.value))} /></Field>
            <Field label={isRTL ? '?????? ????????' : 'Timeout seconds'}><input className={inputClass} type="number" min="5" max="120" value={formData.ai_timeout} onChange={(e) => update('ai_timeout', Number(e.target.value))} /></Field>
            <Field label={isRTL ? '????? ????????' : 'Retries'}><input className={inputClass} type="number" min="0" max="5" value={formData.ai_retries} onChange={(e) => update('ai_retries', Number(e.target.value))} /></Field>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel><SectionTitle icon={<KeyRound />} title={isRTL ? '?????? API ??????' : 'Secure API Keys'} /><div className="grid gap-4 md:grid-cols-2"><Field label="Gemini API Key" hint={settings?.gemini_configured ? (isRTL ? '????? ????? ?????? ??? ??????? ??????.' : 'Leave blank to keep the current key.') : undefined}><input type="password" className={inputClass} value={formData.gemini_api_key} onChange={(e) => update('gemini_api_key', e.target.value)} placeholder={settings?.gemini_configured ? 'Configured' : 'AIza...'} /></Field><Field label="Claude API Key" hint={settings?.claude_configured ? (isRTL ? '????? ????? ?????? ??? ??????? ??????.' : 'Leave blank to keep the current key.') : undefined}><input type="password" className={inputClass} value={formData.claude_api_key} onChange={(e) => update('claude_api_key', e.target.value)} placeholder={settings?.claude_configured ? 'Configured' : 'sk-ant-...'} /></Field></div></Panel>
        <Panel><SectionTitle icon={<Zap />} title={isRTL ? '??? ??????' : 'Provider Health'} /><div className="grid gap-3 sm:grid-cols-2"><Health label={isRTL ? '???????' : 'Primary'} provider={formData.ai_provider} ready={Boolean(primaryConfigured)} /><Health label={isRTL ? '?????????' : 'Fallback'} provider={formData.ai_fallback_provider} ready={Boolean(fallbackConfigured)} /></div></Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel><SectionTitle icon={<Settings2 />} title={isRTL ? '????????? ?????? ??????????' : 'General and Integrations'} /><div className="grid gap-4 md:grid-cols-2"><Field label={isRTL ? '??? ???????' : 'App name'}><input className={inputClass} value={formData.app_name} onChange={(e) => update('app_name', e.target.value)} /></Field><Field label={isRTL ? '???? ???????' : 'App URL'}><input className={inputClass} value={settings?.app_url || ''} disabled /></Field><Field label="Meta App ID"><input className={inputClass} value={formData.meta_app_id} onChange={(e) => update('meta_app_id', e.target.value)} /></Field><Field label="Meta App Secret"><input type="password" className={inputClass} value={formData.meta_app_secret} onChange={(e) => update('meta_app_secret', e.target.value)} /></Field><Field label="Google Client ID"><input className={inputClass} value={formData.google_client_id} onChange={(e) => update('google_client_id', e.target.value)} /></Field><Field label="Google Client Secret"><input type="password" className={inputClass} value={formData.google_client_secret} onChange={(e) => update('google_client_secret', e.target.value)} /></Field></div></Panel>
        <Panel><SectionTitle icon={<ShieldCheck />} title={isRTL ? '????? ????? ???????' : 'Payments and Realtime'} /><div className="grid gap-4 md:grid-cols-2"><Field label="Pusher App ID"><input className={inputClass} value={formData.pusher_app_id} onChange={(e) => update('pusher_app_id', e.target.value)} /></Field><Field label="Pusher Key"><input className={inputClass} value={formData.pusher_app_key} onChange={(e) => update('pusher_app_key', e.target.value)} /></Field><Field label="Pusher Secret"><input type="password" className={inputClass} value={formData.pusher_secret} onChange={(e) => update('pusher_secret', e.target.value)} /></Field><Field label="Pusher Cluster"><input className={inputClass} value={formData.pusher_cluster} onChange={(e) => update('pusher_cluster', e.target.value)} /></Field><Field label="Moyasar Publishable Key"><input className={inputClass} value={formData.moyasar_publishable_key} onChange={(e) => update('moyasar_publishable_key', e.target.value)} /></Field><Field label="Moyasar Secret Key"><input type="password" className={inputClass} value={formData.moyasar_secret_key} onChange={(e) => update('moyasar_secret_key', e.target.value)} /></Field></div></Panel>
      </div>
    </AdminShell>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="mb-5 flex items-center gap-3 text-slate-950 dark:text-white"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-emerald-600 dark:bg-white/8 dark:text-emerald-300">{icon}</span><h2 className="text-xl font-black">{title}</h2></div>
}

function Health({ label, provider, ready }: { label: string; provider: string; ready: boolean }) {
  return <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</span><Badge tone={ready ? 'emerald' : 'amber'}>{ready ? 'Ready' : 'Needs key'}</Badge></div><div className="mt-3 text-2xl font-black capitalize text-slate-950 dark:text-white">{provider}</div></div>
}



