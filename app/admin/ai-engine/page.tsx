'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Bot, Coins, RefreshCw, Save, Search, Settings2, Pencil, Ban, Check } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import Select from '../../../components/ui/Select'
import { AdminShell, Badge, Button, Field, PageHeader, Panel, SkeletonRows, inputClass } from '../../../components/admin/AdminUI'

const API = process.env.NEXT_PUBLIC_API_URL
type Model = { id: number; provider: string; model_key: string; display_name: string; input_price_per_million: string; output_price_per_million: string; cached_input_price_per_million?: string | null; image_price_per_unit?: string | null; audio_price_per_minute?: string | null; audio_output_price_per_million_chars?: string | null; max_context_tokens?: number | null; max_output_tokens?: number | null; pricing_version: string; is_active: boolean; capabilities?: string[] }
type Rule = { id: number; task_type: string; operating_mode: string; primary_model_id: number; fallback_model_ids?: number[]; max_retries: number; max_latency_ms?: number | null; is_active: boolean; provider?: string; model_key?: string }
type Settings = { credits_per_usd: number; cost_multiplier: string; reservation_minimum: number; reservation_maximum: number; notification_thresholds: number[]; enabled_modes: string[]; system_enabled: boolean }
type Pack = { id: number; name: string; credits: number; price_sar: string; is_active: boolean; sort_order: number }
type Overview = { requests: number; successful_requests: number; failed_requests: number; reconciliation_required?: number; provider_cost_usd: string; credits_consumed: number; credit_purchase_revenue_sar: string; by_provider: { provider: string; requests: number; cost_usd: string; credits: number }[]; provider_health?: { provider:string; model_key:string; consecutive_failures:number; last_error_code:number|null; available_after:string|null }[] }
type Reconciliation = { id: number; business_id: number; task_type: string; provider: string; model_key: string; status: string; created_at: string; failure_type?: string; reserved_credits?: number }
type Provider = { id: number; slug: string; display_name: string; adapter: string; is_active: boolean; priority: number; timeout_seconds: number; configured: boolean; key_set: boolean }

function token() { return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '') }

export default function AiEngineAdminPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [overview, setOverview] = useState<Overview | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [providerKeys, setProviderKeys] = useState<Record<number, string>>({})
  const [providerTests, setProviderTests] = useState<Record<number, string>>({})
  const [rules, setRules] = useState<Rule[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [packs, setPacks] = useState<Pack[]>([])
  const [reconciliation, setReconciliation] = useState<Reconciliation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businessUsage, setBusinessUsage] = useState<any>(null)
  const [adjustment, setAdjustment] = useState({ amount: '', reason: '' })
  const emptyModel = () => ({ provider: 'groq', model_key: '', display_name: '', input_price_per_million: '', output_price_per_million: '', cached_input_price_per_million: '', image_price_per_unit: '', audio_price_per_minute: '', audio_output_price_per_million_chars: '', max_context_tokens: '', max_output_tokens: '', capabilities: 'text', pricing_version: 'admin-v1' })
  const [newModel, setNewModel] = useState(emptyModel)
  const [editingModelId, setEditingModelId] = useState<number | null>(null)
  const [newPack, setNewPack] = useState({ name: '', credits: '', price_sar: '' })
  const [editingPackId, setEditingPackId] = useState<number | null>(null)

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`${API}/api/admin/ai${path}`, { ...init, headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
    return body
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [o, m, r, s, p, usage, providerList] = await Promise.all([request('/overview'), request('/models'), request('/routing-rules'), request('/credit-settings'), request('/credit-packages'), request('/usage?status=needs_reconciliation&per_page=50'), request('/providers')])
      setOverview(o); setModels(m); setRules(r); setSettings(s); setPacks(p); setReconciliation(usage.data || []); setProviders(providerList)
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load AI Engine settings.', 'تعذر تحميل إعدادات محرك الذكاء الاصطناعي.')) }
    finally { setLoading(false) }
  }, [L, request])

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [load])

  const save = async (work: () => Promise<unknown>): Promise<boolean> => {
    setSaving(true); setError('')
    try { await work(); await load(); return true }
    catch (cause) { setError(cause instanceof Error ? cause.message : L('Save failed.', 'تعذر الحفظ.')); return false }
    finally { setSaving(false) }
  }

  const saveRule = (rule: Rule, field: keyof Rule, value: unknown) => setRules((rows) => rows.map((row) => row.id === rule.id ? { ...row, [field]: value } : row))
  const persistRule = (rule: Rule) => save(() => request('/routing-rules', { method: 'POST', body: JSON.stringify({ task_type: rule.task_type, operating_mode: rule.operating_mode, primary_model_id: Number(rule.primary_model_id), fallback_model_ids: rule.fallback_model_ids || [], max_retries: Number(rule.max_retries), max_latency_ms: rule.max_latency_ms ? Number(rule.max_latency_ms) : null, is_active: Boolean(rule.is_active) }) }))
  const saveProvider = (provider: Provider) => save(() => request(`/providers/${provider.id}`, { method: 'PUT', body: JSON.stringify({ is_active: provider.is_active, priority: provider.priority, timeout_seconds: provider.timeout_seconds, ...(providerKeys[provider.id]?.trim() ? { api_key: providerKeys[provider.id].trim() } : {}) }) })).then((ok) => { if (ok) setProviderKeys((keys) => ({ ...keys, [provider.id]: '' })) })
  const testProvider = async (provider: Provider) => {
    setProviderTests((current) => ({ ...current, [provider.id]: L('Testing…', 'جارٍ الاختبار…') }))
    try {
      const result = await request(`/providers/${provider.id}/test`, { method: 'POST' })
      setProviderTests((current) => ({ ...current, [provider.id]: result.message || L('Connection successful.', 'تم الاتصال بنجاح.') }))
    } catch (cause) {
      setProviderTests((current) => ({ ...current, [provider.id]: cause instanceof Error ? cause.message : L('Provider connection failed.', 'فشل الاتصال بالمزوّد.') }))
    }
  }

  const loadBusiness = async () => {
    if (!businessId || !/^\d+$/.test(businessId)) { setError(L('Enter a valid business ID.', 'أدخل رقم نشاط تجاري صحيحًا.')); return }
    try { setBusinessUsage(await request(`/businesses/${businessId}/usage`)); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load business usage.', 'تعذر تحميل استخدام النشاط.')) }
  }

  const reconcile = (row: Reconciliation, resolution: 'release' | 'settle') => {
    if (resolution === 'release' && !window.confirm(L('Confirm the provider did not bill this request and release its reserved credits?', 'أكد أن المزوّد لم يخصم تكلفة هذا الطلب وأنه يمكن تحرير الرصيد المحجوز؟'))) return
    const body: Record<string, unknown> = { resolution }
    if (resolution === 'settle') {
      const input = window.prompt(L('Enter provider-reported input tokens (0 if not applicable).', 'أدخل عدد رموز الإدخال حسب تقرير المزوّد (0 إن لم ينطبق).'), '0')
      if (input === null || !/^\d+$/.test(input)) return
      const output = window.prompt(L('Enter provider-reported output tokens (0 if not applicable).', 'أدخل عدد رموز الإخراج حسب تقرير المزوّد (0 إن لم ينطبق).'), '0')
      if (output === null || !/^\d+$/.test(output)) return
      body.input_tokens = Number(input); body.output_tokens = Number(output)
    }
    void save(() => request(`/usage/${row.id}/reconcile`, { method: 'POST', body: JSON.stringify(body) }))
  }

  if (loading) return <AdminShell><PageHeader title={L('AI Engine', 'محرك الذكاء الاصطناعي')} description={L('Model routing, credit economics, and usage oversight.', 'إدارة توجيه النماذج وتكاليف الرصيد والاستخدام.')} /><SkeletonRows rows={7} /></AdminShell>

  return <AdminShell>
    <PageHeader title={L('AI Engine', 'محرك الذكاء الاصطناعي')} description={L('Control model pricing, task routing, credit rules, and business usage.', 'تحكم في أسعار النماذج وتوجيه المهام وقواعد الرصيد واستخدام الأنشطة.')} actions={<Button variant="ghost" onClick={() => void load()}><RefreshCw size={15} />{L('Refresh', 'تحديث')}</Button>} />
    {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[[L('Requests this month', 'الطلبات هذا الشهر'), overview?.requests ?? 0, Activity], [L('Successful', 'ناجحة'), overview?.successful_requests ?? 0, Bot], [L('Provider cost (USD)', 'تكلفة المزوّد بالدولار'), `$${overview?.provider_cost_usd ?? '0.00'}`, Coins], [L('Credits consumed', 'الرصيد المستهلك'), Number(overview?.credits_consumed ?? 0).toLocaleString(), Settings2]].map(([label, value, Icon]: any) => <Panel key={label} className="flex items-center justify-between"><div><p className="text-xs text-text-muted">{label}</p><p className="mt-2 text-2xl font-black text-text-primary">{value}</p></div><Icon className="text-brand" /></Panel>)}
    </div>

    <Panel><h2 className="mb-4 font-bold">{L('Provider management','إدارة المزوّدين')}</h2><p className="mb-4 text-sm text-text-muted">{L('Provider keys are encrypted at rest and are never returned to the browser. Leave a key blank to keep the current value.','تُشفّر مفاتيح المزوّدين عند التخزين ولا تُرسل إلى المتصفح. اترك الحقل فارغًا للاحتفاظ بالمفتاح الحالي.')}</p><div className="space-y-3">{providers.map((provider)=><div key={provider.id} className="grid items-end gap-3 rounded-xl border border-border p-3 md:grid-cols-[1fr_1.5fr_120px_120px_auto]"><div><div className="font-semibold">{provider.display_name}</div><div className="text-xs text-text-muted">{provider.slug} · {provider.key_set?L('Admin key set','مفتاح الإدارة محفوظ'):provider.configured?L('Using server key','يستخدم مفتاح الخادم'):L('No key configured','لا يوجد مفتاح')}</div></div><Field label={L('Replace API key (optional)','استبدال المفتاح (اختياري)')}><input className={inputClass} type="password" autoComplete="new-password" value={providerKeys[provider.id]||''} onChange={(e)=>setProviderKeys({...providerKeys,[provider.id]:e.target.value})} placeholder="••••••••••••"/></Field><Field label={L('Priority','الأولوية')}><input className={inputClass} type="number" min="0" value={provider.priority} onChange={(e)=>setProviders((rows)=>rows.map((row)=>row.id===provider.id?{...row,priority:Number(e.target.value)}:row))}/></Field><Field label={L('Timeout (s)','المهلة (ث)')}><input className={inputClass} type="number" min="1" max="180" value={provider.timeout_seconds} onChange={(e)=>setProviders((rows)=>rows.map((row)=>row.id===provider.id?{...row,timeout_seconds:Number(e.target.value)}:row))}/></Field><div className="flex items-center gap-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={provider.is_active} onChange={(e)=>setProviders((rows)=>rows.map((row)=>row.id===provider.id?{...row,is_active:e.target.checked}:row))}/>{L('Enabled','مفعّل')}</label><Button disabled={saving} onClick={()=>void saveProvider(provider)}><Save size={14}/>{L('Save','حفظ')}</Button></div></div>)}</div></Panel>

    <Panel><h2 className="mb-4 font-bold">{L('Test provider credentials','اختبار بيانات اتصال المزوّد')}</h2><div className="grid gap-3 md:grid-cols-2">{providers.map((provider)=><div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><div className="font-medium">{provider.display_name}</div>{providerTests[provider.id]&&<p role="status" className="mt-1 text-xs text-text-muted">{providerTests[provider.id]}</p>}</div><Button variant="ghost" disabled={!provider.is_active || saving} onClick={()=>void testProvider(provider)}>{L('Test connection','اختبار الاتصال')}</Button></div>)}</div></Panel>

    <Panel><h2 className="mb-3 font-bold">{L('Provider health and circuit breakers','حالة مزوّدي الذكاء الاصطناعي')}</h2>
      {(overview?.provider_health || []).length === 0 ? <p className="text-sm text-text-muted">{L('No provider failures are currently recorded.','لا توجد أعطال مسجلة حاليًا.')}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-border text-start text-text-muted"><th className="p-2 text-start">{L('Provider / model','المزوّد / النموذج')}</th><th className="p-2">{L('Consecutive failures','الأعطال المتتالية')}</th><th className="p-2">{L('Last status','آخر حالة')}</th><th className="p-2">{L('Available after','متاح بعد')}</th></tr></thead><tbody>{overview?.provider_health?.map((item)=><tr key={`${item.provider}:${item.model_key}`} className="border-b border-border/60"><td className="p-2">{item.provider} · {item.model_key}</td><td className="p-2 text-center">{item.consecutive_failures}</td><td className="p-2 text-center">{item.last_error_code ?? '—'}</td><td className="p-2 text-center">{item.available_after ? new Date(item.available_after).toLocaleString() : L('Available','متاح')}</td></tr>)}</tbody></table></div>}
    </Panel>

    <Panel><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold">{L('Requests needing billing reconciliation','طلبات تحتاج إلى تسوية الفوترة')}</h2><Badge tone={(overview?.reconciliation_required || 0)>0?'rose':'emerald'}>{overview?.reconciliation_required || 0}</Badge></div>
      {reconciliation.length===0?<p className="text-sm text-text-muted">{L('No quarantined reservations need review.','لا توجد أرصدة محجوزة تنتظر المراجعة.')}</p>:<div className="space-y-3">{reconciliation.map((row)=><div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><div className="font-semibold">#{row.id} · {row.task_type}</div><div className="text-xs text-text-muted">{row.provider}/{row.model_key} · {row.failure_type||L('Uncertain provider result','نتيجة مزوّد غير مؤكدة')} · {Number(row.reserved_credits||0).toLocaleString()} {L('credits reserved','رصيد محجوز')}</div><div className="text-xs text-text-muted">{new Date(row.created_at).toLocaleString()}</div></div><div className="flex gap-2"><Button variant="ghost" disabled={saving} onClick={()=>reconcile(row,'settle')}><Check size={14}/>{L('Settle from provider usage','تسوية حسب استخدام المزوّد')}</Button><Button variant="ghost" disabled={saving} onClick={()=>reconcile(row,'release')}><Ban size={14}/>{L('Release as unbilled','تحرير إذا لم تُحتسب تكلفة')}</Button></div></div>)}</div>}
    </Panel>

    <Panel><div className="mb-4 flex items-center gap-2"><Settings2 size={18} className="text-brand"/><h2 className="font-bold">{L('Credit configuration', 'إعدادات الرصيد')}</h2></div>
      {settings && <><div className="grid gap-4 md:grid-cols-3">
        <Field label={L('Credits per USD', 'رصيد لكل دولار')}><input className={inputClass} type="number" min="1" value={settings.credits_per_usd} onChange={(e) => setSettings({ ...settings, credits_per_usd: Number(e.target.value) })}/></Field>
        <Field label={L('Provider cost multiplier', 'مضاعف تكلفة المزوّد')}><input className={inputClass} type="number" min="0.01" step="0.01" value={settings.cost_multiplier} onChange={(e) => setSettings({ ...settings, cost_multiplier: e.target.value })}/></Field>
        <Field label={L('Minimum reservation', 'الحد الأدنى للحجز')}><input className={inputClass} type="number" min="1" value={settings.reservation_minimum} onChange={(e) => setSettings({ ...settings, reservation_minimum: Number(e.target.value) })}/></Field>
        <Field label={L('Maximum reservation per request', 'الحد الأقصى للحجز لكل طلب')}><input className={inputClass} type="number" min={settings.reservation_minimum} value={settings.reservation_maximum} onChange={(e) => setSettings({ ...settings, reservation_maximum: Number(e.target.value) })}/></Field>
        <Field label={L('Enabled operating modes', 'أوضاع التشغيل المتاحة')}><div className="flex flex-wrap gap-3">{(['auto','economy','premium'] as const).map((mode) => <label key={mode} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.enabled_modes.includes(mode)} onChange={(e) => setSettings({ ...settings, enabled_modes: e.target.checked ? [...settings.enabled_modes, mode] : settings.enabled_modes.filter((x) => x !== mode) })}/>{mode}</label>)}</div></Field>
        <Field label={L('System billing', 'فوترة النظام')}><Select value={settings.system_enabled ? 'on' : 'off'} options={[{value:'on',label:L('Enabled','مفعّل')},{value:'off',label:L('Disabled','معطّل')}]} onValueChange={(value) => setSettings({ ...settings, system_enabled: value === 'on' })}/></Field>
      </div><Button className="mt-4" disabled={saving} onClick={() => void save(() => request('/credit-settings', { method: 'PUT', body: JSON.stringify(settings) }))}><Save size={15}/>{L('Save credit settings','حفظ إعدادات الرصيد')}</Button></>}
    </Panel>

    <Panel><h2 className="mb-4 font-bold">{L('Model pricing registry', 'سجل أسعار النماذج')}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b border-border text-start text-text-muted"><th className="p-2 text-start">Provider</th><th className="p-2 text-start">Model</th><th className="p-2 text-start">{L('Input / 1M','الإدخال / مليون')}</th><th className="p-2 text-start">{L('Output / 1M','الإخراج / مليون')}</th><th className="p-2 text-start">{L('Cached / image / audio pricing','أسعار المخزن / الصورة / الصوت')}</th><th className="p-2 text-start">{L('Version','الإصدار')}</th><th className="p-2">{L('Status','الحالة')}</th><th /></tr></thead><tbody>{models.map((model) => <tr key={model.id} className="border-b border-border/60"><td className="p-2">{model.provider}</td><td className="p-2"><div className="font-semibold">{model.display_name}</div><div className="text-xs text-text-muted">{model.model_key}</div></td><td className="p-2">${model.input_price_per_million}</td><td className="p-2">${model.output_price_per_million}</td><td className="p-2 text-xs">{L('Cached','مخزن')}: ${model.cached_input_price_per_million ?? '—'} · {L('Image/unit','الصورة/وحدة')}: ${model.image_price_per_unit ?? '—'} · {L('Audio/min','الصوت/دقيقة')}: ${model.audio_price_per_minute ?? '—'} · {L('TTS/1M chars','الصوت/مليون حرف')}: ${model.audio_output_price_per_million_chars ?? '—'}</td><td className="p-2">{model.pricing_version}</td><td className="p-2 text-center"><Badge tone={model.is_active ? 'emerald' : 'rose'}>{model.is_active ? L('Active','نشط') : L('Inactive','متوقف')}</Badge></td><td className="p-2"><div className="flex gap-1"><Button variant="ghost" onClick={()=>{setEditingModelId(model.id);setNewModel({provider:model.provider,model_key:model.model_key,display_name:model.display_name,input_price_per_million:model.input_price_per_million,output_price_per_million:model.output_price_per_million,cached_input_price_per_million:model.cached_input_price_per_million||'',image_price_per_unit:model.image_price_per_unit||'',audio_price_per_minute:model.audio_price_per_minute||'',audio_output_price_per_million_chars:model.audio_output_price_per_million_chars||'',max_context_tokens:model.max_context_tokens?.toString()||'',max_output_tokens:model.max_output_tokens?.toString()||'',capabilities:(model.capabilities||['text']).join(','),pricing_version:model.pricing_version})}} aria-label={L('Edit model','تعديل النموذج')}><Pencil size={14}/></Button><Button variant="ghost" disabled={!model.is_active||saving} onClick={()=>void save(()=>request(`/models/${model.id}`,{method:'DELETE'}))} aria-label={L('Deactivate model','إيقاف النموذج')}><Ban size={14}/></Button></div></td></tr>)}</tbody></table></div>
      <form className="mt-5 grid gap-3 border-t border-border pt-4 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); void save(() => request(editingModelId ? `/models/${editingModelId}` : '/models', { method:editingModelId?'PUT':'POST', body: JSON.stringify({ ...newModel, input_price_per_million:Number(newModel.input_price_per_million), output_price_per_million:Number(newModel.output_price_per_million), cached_input_price_per_million:newModel.cached_input_price_per_million ? Number(newModel.cached_input_price_per_million) : null, image_price_per_unit:newModel.image_price_per_unit ? Number(newModel.image_price_per_unit) : null, audio_price_per_minute:newModel.audio_price_per_minute ? Number(newModel.audio_price_per_minute) : null, audio_output_price_per_million_chars:newModel.audio_output_price_per_million_chars ? Number(newModel.audio_output_price_per_million_chars) : null, max_context_tokens:newModel.max_context_tokens ? Number(newModel.max_context_tokens) : null, max_output_tokens:newModel.max_output_tokens ? Number(newModel.max_output_tokens) : null, capabilities:newModel.capabilities.split(',').map((x)=>x.trim()).filter(Boolean) }) })).then((ok)=>{if(ok){setEditingModelId(null);setNewModel(emptyModel())}}) }}>
        <Field label={L('Provider','المزوّد')}><Select value={newModel.provider} options={['openai','claude','gemini','groq'].map((v)=>({value:v,label:v}))} onValueChange={(v)=>setNewModel({...newModel,provider:v})}/></Field>
        <Field label={L('Model key','معرّف النموذج')}><input className={inputClass} value={newModel.model_key} onChange={(e)=>setNewModel({...newModel,model_key:e.target.value})} required/></Field>
        <Field label={L('Display name','الاسم الظاهر')}><input className={inputClass} value={newModel.display_name} onChange={(e)=>setNewModel({...newModel,display_name:e.target.value})} required/></Field>
        <Field label={L('Input price / million USD','سعر مليون إدخال بالدولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.input_price_per_million} onChange={(e)=>setNewModel({...newModel,input_price_per_million:e.target.value})} required/></Field>
        <Field label={L('Output price / million USD','سعر مليون إخراج بالدولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.output_price_per_million} onChange={(e)=>setNewModel({...newModel,output_price_per_million:e.target.value})} required/></Field>
        <Field label={L('Cached input price / million USD','سعر الإدخال المخزن / مليون دولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.cached_input_price_per_million} onChange={(e)=>setNewModel({...newModel,cached_input_price_per_million:e.target.value})}/></Field>
        <Field label={L('Image price / unit USD','سعر الصورة / وحدة بالدولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.image_price_per_unit} onChange={(e)=>setNewModel({...newModel,image_price_per_unit:e.target.value})}/></Field>
        <Field label={L('Audio price / minute USD','سعر الصوت / دقيقة بالدولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.audio_price_per_minute} onChange={(e)=>setNewModel({...newModel,audio_price_per_minute:e.target.value})}/></Field>
        <Field label={L('Audio output price / million characters USD','سعر مليون حرف صوتي بالدولار')}><input className={inputClass} type="number" min="0" step="0.000001" value={newModel.audio_output_price_per_million_chars} onChange={(e)=>setNewModel({...newModel,audio_output_price_per_million_chars:e.target.value})}/></Field>
        <Field label={L('Context token limit','حد رموز السياق')}><input className={inputClass} type="number" min="1" value={newModel.max_context_tokens} onChange={(e)=>setNewModel({...newModel,max_context_tokens:e.target.value})}/></Field>
        <Field label={L('Maximum output tokens','الحد الأقصى لرموز الإخراج')}><input className={inputClass} type="number" min="1" value={newModel.max_output_tokens} onChange={(e)=>setNewModel({...newModel,max_output_tokens:e.target.value})}/></Field>
        <Field label={L('Capabilities (comma separated)','القدرات (مفصولة بفواصل)')}><input className={inputClass} value={newModel.capabilities} onChange={(e)=>setNewModel({...newModel,capabilities:e.target.value})} placeholder="text,json,tools,image,audio_transcription"/></Field>
        <Field label={L('Pricing version','نسخة التسعير')}><input className={inputClass} value={newModel.pricing_version} onChange={(e)=>setNewModel({...newModel,pricing_version:e.target.value})} required/></Field>
        <div className="md:col-span-3 flex gap-2"><Button type="submit" disabled={saving || !newModel.model_key}><Save size={15}/>{editingModelId?L('Save model','حفظ النموذج'):L('Add model','إضافة نموذج')}</Button>{editingModelId&&<Button type="button" variant="ghost" onClick={()=>{setEditingModelId(null);setNewModel(emptyModel())}}>{L('Cancel edit','إلغاء التعديل')}</Button>}</div>
      </form>
    </Panel>

    <Panel><h2 className="mb-4 font-bold">{L('Task routing matrix','مصفوفة توجيه المهام')}</h2><div className="space-y-3">{rules.map((rule)=><div key={rule.id} className="rounded-xl border border-border p-3"><div className="grid items-center gap-3 md:grid-cols-[1fr_110px_2fr_100px_120px_140px_auto]"><div><div className="font-semibold capitalize">{rule.task_type.replaceAll('_',' ')}</div></div><Badge>{rule.operating_mode}</Badge><Select ariaLabel={L('Primary AI model','نموذج الذكاء الاصطناعي الأساسي')} value={String(rule.primary_model_id)} options={models.filter((m)=>m.is_active).map((m)=>({value:String(m.id),label:`${m.provider} · ${m.display_name}`}))} onValueChange={(v)=>saveRule(rule,'primary_model_id',Number(v))}/><Field label={L('Max retries','عدد المحاولات')}><input className={inputClass} type="number" min="0" max="3" value={rule.max_retries} onChange={(e)=>saveRule(rule,'max_retries',Number(e.target.value))}/></Field><Field label={L('Max latency (ms)','أقصى زمن (مللي ثانية)')}><input className={inputClass} type="number" min="1" value={rule.max_latency_ms ?? ''} onChange={(e)=>saveRule(rule,'max_latency_ms',e.target.value ? Number(e.target.value) : null)}/></Field><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={rule.is_active} onChange={(e)=>saveRule(rule,'is_active',e.target.checked)}/>{L('Enabled','مفعّل')}</label><Button variant="ghost" disabled={saving} onClick={()=>void persistRule(rule)}><Save size={14}/>{L('Save','حفظ')}</Button></div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3"><span className="text-xs font-medium text-text-muted">{L('Fallback models','النماذج الاحتياطية')}</span>{models.filter((model)=>model.is_active && model.id !== Number(rule.primary_model_id)).map((model)=><label key={model.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={(rule.fallback_model_ids || []).includes(model.id)} onChange={(e)=>saveRule(rule,'fallback_model_ids',e.target.checked ? [...new Set([...(rule.fallback_model_ids || []),model.id])] : (rule.fallback_model_ids || []).filter((id)=>id!==model.id))}/>{model.provider} · {model.display_name}</label>)}</div></div>)}</div></Panel>

    <Panel><h2 className="mb-4 font-bold">{L('AI credit packs','باقات رصيد الذكاء الاصطناعي')}</h2><div className="space-y-2">{packs.map((pack)=><div key={pack.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><span className="font-semibold">{pack.name}</span><span className="ms-3 text-text-muted">{Number(pack.credits).toLocaleString()} · {pack.price_sar} SAR</span></div><div className="flex items-center gap-2"><Badge tone={pack.is_active?'emerald':'rose'}>{pack.is_active?L('Active','نشط'):L('Inactive','متوقف')}</Badge><Button variant="ghost" onClick={()=>{setEditingPackId(pack.id);setNewPack({name:pack.name,credits:String(pack.credits),price_sar:String(pack.price_sar)})}} aria-label={L('Edit credit pack','تعديل باقة الرصيد')}><Pencil size={14}/></Button><Button variant="ghost" disabled={saving} onClick={()=>void save(()=>request(`/credit-packages/${pack.id}`,{method:'DELETE'}))} aria-label={L('Remove credit pack','حذف باقة الرصيد')}><Ban size={14}/></Button></div></div>)}</div>
      <form className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-4" onSubmit={(e)=>{e.preventDefault();void save(()=>request(editingPackId?`/credit-packages/${editingPackId}`:'/credit-packages',{method:editingPackId?'PUT':'POST',body:JSON.stringify({name:newPack.name,credits:Number(newPack.credits),price_sar:Number(newPack.price_sar),is_active:true,sort_order:packs.length+1})})).then((ok)=>{if(ok){setEditingPackId(null);setNewPack({name:'',credits:'',price_sar:''})}})}}><Field label={L('Pack name','اسم الباقة')}><input className={inputClass} value={newPack.name} onChange={(e)=>setNewPack({...newPack,name:e.target.value})} required/></Field><Field label={L('Credits','الرصيد')}><input className={inputClass} type="number" min="1" value={newPack.credits} onChange={(e)=>setNewPack({...newPack,credits:e.target.value})} required/></Field><Field label={L('Price SAR','السعر بالريال')}><input className={inputClass} type="number" min="0.01" step="0.01" value={newPack.price_sar} onChange={(e)=>setNewPack({...newPack,price_sar:e.target.value})} required/></Field><div className="self-end flex gap-2"><Button type="submit" disabled={saving}><Save size={14}/>{editingPackId?L('Save pack','حفظ الباقة'):L('Add pack','إضافة باقة')}</Button>{editingPackId&&<Button type="button" variant="ghost" onClick={()=>{setEditingPackId(null);setNewPack({name:'',credits:'',price_sar:''})}}>{L('Cancel','إلغاء')}</Button>}</div></form>
    </Panel>

    <Panel><h2 className="mb-4 font-bold">{L('Business usage and credit adjustments','استخدام النشاط وتعديل الرصيد')}</h2><div className="flex flex-wrap gap-3"><input className={`${inputClass} max-w-52`} type="number" min="1" placeholder={L('Business ID','رقم النشاط')} value={businessId} onChange={(e)=>setBusinessId(e.target.value)}/><Button variant="ghost" onClick={()=>void loadBusiness()}><Search size={14}/>{L('Inspect','عرض')}</Button></div>
      {businessUsage && <div className="mt-4 space-y-3"><div className="rounded-xl border border-border p-4"><strong>{businessUsage.business.business_name || businessUsage.business.name}</strong><div className="mt-1 text-sm text-text-muted">{L('Available','المتاح')}: {Number(businessUsage.balance.wallet.available_balance).toLocaleString()} · {L('Purchased','المشترى')}: {Number(businessUsage.balance.wallet.purchased_balance).toLocaleString()}</div></div><div className="grid gap-3 md:grid-cols-[160px_1fr_auto]"><input className={inputClass} type="number" placeholder={L('Credits (+/-)','الرصيد (+/-)')} value={adjustment.amount} onChange={(e)=>setAdjustment({...adjustment,amount:e.target.value})}/><input className={inputClass} placeholder={L('Mandatory adjustment reason','سبب التعديل إلزامي')} value={adjustment.reason} onChange={(e)=>setAdjustment({...adjustment,reason:e.target.value})}/><Button disabled={saving || !adjustment.amount || adjustment.reason.trim().length<8} onClick={()=>void save(()=>request(`/businesses/${businessId}/credits/adjust`,{method:'POST',body:JSON.stringify({amount:Number(adjustment.amount),reason:adjustment.reason})}))}>{L('Adjust credits','تعديل الرصيد')}</Button></div></div>}
    </Panel>
  </AdminShell>
}
