'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, FileUp, Filter, MessageSquare, Plus, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, UserRound, Users, X } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import { getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type Contact = { id:number; name:string|null; phone:string|null; phone_is_displayable?:boolean; email:string|null; avatar:string|null; tags:string[]|null; lead_score:number; assigned_to:number|null; assignee?:{id:number;name:string}|null; custom_fields:Record<string, unknown>|null; conversations_count:number; conversations_max_last_message_at:string|null; created_at:string }
type Channel = { id:number; type:string; page_name:string|null; page_id:string; status:string }
type Assignee = {id:number;name:string;email?:string|null;role:string}
type ContactDetail = { customer:Contact & { merged_into_customer_id:number|null; merged_into?:{id:number;name:string|null;email:string|null}|null; merge_records_as_target?:Array<{id:number;source_customer_id:number;source?:{id:number;name:string|null;email:string|null}}>; conversations:Array<{id:number; channel?:Channel; status:string; sender_name:string|null; subject:string|null; last_message_at:string|null; created_at:string}>; notes:Array<{id:number; content:string; author?:{name:string}; created_at:string}> }; orders:Array<{id:number; order_number:string|null; status:string|null; fulfillment_status:string|null; total:string|number; currency:string|null; ordered_at:string|null; channel?:Channel}>; consents:Array<{channel:string; scope:string; status:string; source:string; captured_at:string|null}>; comments:Array<{id:number; channel_id:number; platform:string; comment_text:string|null; status:string; public_reply_id:string|null; platform_created_at:string|null}> }

function authHeaders(businessId?:number|null): Record<string,string> {
  const match = typeof document === 'undefined' ? null : document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return { Authorization: `Bearer ${match ? decodeURIComponent(match[1]) : ''}`, Accept: 'application/json', ...(businessId ? {'X-Business-Id':String(businessId)} : {}) }
}

export default function ContactsPage() {
  const { isRTL } = useLang()
  const L = useCallback((en:string, ar:string) => isRTL ? ar : en,[isRTL])
  const [businessId,setBusinessId] = useState<number|null>(null)
  const [contacts,setContacts] = useState<Contact[]>([])
  const [channels,setChannels] = useState<Channel[]>([])
  const [assignees,setAssignees] = useState<Assignee[]>([])
  const [detail,setDetail] = useState<ContactDetail|null>(null)
  const [search,setSearch] = useState('')
  const [stage,setStage] = useState('')
  const [channelId,setChannelId] = useState('')
  const [page,setPage] = useState(1)
  const [lastPage,setLastPage] = useState(1)
  const [totalContacts,setTotalContacts] = useState(0)
  const [loading,setLoading] = useState(false)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [note,setNote] = useState('')
  const [csvFile,setCsvFile] = useState<File|null>(null)
  const [importPreview,setImportPreview] = useState<{valid_rows:number;invalid_rows:number;errors:Array<{row:number;error:string}>}|null>(null)
  const [edit,setEdit] = useState({name:'',email:'',phone:'',tags:'',lead_score:0,lifecycle_stage:'new_lead',language:'',source:'',assigned_to:''})
  const [mergeTargetId,setMergeTargetId] = useState('')
  const loadSequence = useRef(0)
  const loadRef = useRef<(id:number,nextPage?:number,filters?:{search?:string;stage?:string;channelId?:string})=>Promise<void>>(async()=>{})

  const headers = useMemo(() => authHeaders(businessId), [businessId])

  const load = useCallback(async (id:number, nextPage=page, filters?:{search?:string;stage?:string;channelId?:string}) => {
    const requestSequence = ++loadSequence.current
    setLoading(true); setError('')
    try {
      // The workspace-change event calls load before React has committed the
      // new businessId state. Build headers from this request's explicit ID
      // so the first request and workspace switches are correctly scoped.
      const requestHeaders = authHeaders(id)
      const params = new URLSearchParams({per_page:'25',page:String(nextPage)})
      const activeSearch = filters?.search ?? search
      const activeStage = filters?.stage ?? stage
      const activeChannelId = filters?.channelId ?? channelId
      if (activeSearch.trim()) params.set('search',activeSearch.trim())
      if (activeStage) params.set('lifecycle_stage',activeStage)
      if (activeChannelId) params.set('channel_id',activeChannelId)
      const [contactsResponse,channelsResponse,assigneesResponse] = await Promise.all([
        fetch(`${API}/customers?${params}`,{headers:requestHeaders}),
        fetch(`${API}/channels`,{headers:requestHeaders}),
        fetch(`${API}/customers/assignees`,{headers:requestHeaders}),
      ])
      if (requestSequence !== loadSequence.current) return
      if (!contactsResponse.ok || !channelsResponse.ok) throw new Error(L('Could not load contacts for the selected workspace.','تعذر تحميل جهات الاتصال لمساحة العمل المحددة.'))
      const contactPayload = await contactsResponse.json()
      setContacts(Array.isArray(contactPayload.data) ? contactPayload.data : [])
      setPage(contactPayload.current_page || 1); setLastPage(contactPayload.last_page || 1)
      setTotalContacts(Number(contactPayload.total ?? 0))
      const channelPayload = await channelsResponse.json()
      setChannels(Array.isArray(channelPayload) ? channelPayload.filter((c:Channel)=>!['salla','shopify','woocommerce'].includes(c.type)) : (channelPayload.data || []))
      const assigneePayload = await assigneesResponse.json()
      setAssignees(Array.isArray(assigneePayload.assignees) ? assigneePayload.assignees : [])
    } catch (cause) {
      if (requestSequence === loadSequence.current) setError(cause instanceof Error ? cause.message : L('Could not load contacts.','تعذر تحميل جهات الاتصال.'))
    }
    finally { if (requestSequence === loadSequence.current) setLoading(false) }
  },[page,search,stage,channelId,L])
  useEffect(()=>{loadRef.current=load},[load])

  const loadDetail = useCallback(async (id:number, customerId:number) => {
    const response = await fetch(`${API}/customers/${customerId}`,{headers})
    const payload = await response.json().catch(()=>({}))
    if (!response.ok) throw new Error(payload.message || L('Could not load this contact.','تعذر تحميل جهة الاتصال.'))
    const value = payload as ContactDetail
    setDetail(value)
    const fields = value.customer.custom_fields || {}
    setEdit({name:value.customer.name || '',email:value.customer.email || '',phone:value.customer.phone || '',tags:(value.customer.tags || []).join(', '),lead_score:value.customer.lead_score || 0,lifecycle_stage:String(fields.lifecycle_stage || 'new_lead'),language:String(fields.language || ''),source:String(fields.source || ''),assigned_to:value.customer.assigned_to ? String(value.customer.assigned_to) : ''})
    setMergeTargetId('')
    setNotice('')
    void id
  },[headers,L])

  useEffect(()=>{
    const sync=()=>{const id=getSelectedBusinessId(); setBusinessId(id); setDetail(null); setContacts([]); setSearch(''); setStage(''); setChannelId(''); setPage(1); setImportPreview(null); setCsvFile(null); if(id) void loadRef.current(id,1,{search:'',stage:'',channelId:''}); else setError(L('Select a workspace to manage contacts.','اختر مساحة عمل لإدارة جهات الاتصال.'))}
    sync(); window.addEventListener('naz:business-changed',sync); window.addEventListener('storage',sync)
    return ()=>{window.removeEventListener('naz:business-changed',sync);window.removeEventListener('storage',sync)}
  },[L])

  async function openContact(contact:Contact) { try { await loadDetail(contact.id,contact.id) } catch(cause) {setError(cause instanceof Error?cause.message:'Could not load contact.')} }
  async function saveContact() {
    if(!detail) return
    setSaving(true);setError('');setNotice('')
    try {
      const profilePayload = {name:edit.name,email:edit.email,...(detail.customer.phone_is_displayable?{phone:edit.phone}:{}),tags:edit.tags.split(',').map(x=>x.trim()).filter(Boolean),lead_score:Number(edit.lead_score),lifecycle_stage:edit.lifecycle_stage,language:edit.language,source:edit.source,assigned_to:edit.assigned_to?Number(edit.assigned_to):null}
      const response=await fetch(`${API}/customers/${detail.customer.id}`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(profilePayload)})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(payload.message||L('Could not save contact.','تعذر حفظ جهة الاتصال.'))
      setNotice(L('Contact updated.','تم تحديث جهة الاتصال.'));await load(businessId!,page);await loadDetail(detail.customer.id,detail.customer.id)
    } catch(cause) {setError(cause instanceof Error?cause.message:'Could not save contact.')} finally {setSaving(false)}
  }
  async function addNote() {
    if(!detail||!note.trim()) return
    setSaving(true);setError('')
    try { const response=await fetch(`${API}/customers/${detail.customer.id}/notes`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({content:note.trim()})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||'Could not save note.');setNote('');await loadDetail(detail.customer.id,detail.customer.id) }
    catch(cause){setError(cause instanceof Error?cause.message:'Could not save note.')}finally{setSaving(false)}
  }
  async function mergeContact() {
    if(!detail||!businessId||!mergeTargetId||!window.confirm(L('Merge this contact into the selected profile? Conversations, notes, and account identities move, and the action can be undone.','هل تريد دمج جهة الاتصال مع الملف المحدد؟ ستُنقل المحادثات والملاحظات والهويات ويمكن التراجع عن العملية.')))return
    const targetId=Number(mergeTargetId);setSaving(true);setError('');setNotice('')
    try {const response=await fetch(`${API}/customers/${detail.customer.id}/merge`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({target_customer_id:targetId})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||'Could not merge contacts.');setNotice(L('Contacts merged. The target profile contains an undo option.','تم دمج جهات الاتصال. يحتوي الملف الهدف على خيار للتراجع.'));await load(businessId,1);await loadDetail(targetId,targetId)}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not merge contacts.')}finally{setSaving(false)}
  }
  async function undoMerge(mergeId:number) {
    if(!detail||!businessId||!window.confirm(L('Undo this merge and restore the moved conversations, notes, and identities?','هل تريد التراجع عن الدمج وإعادة المحادثات والملاحظات والهويات المنقولة؟')))return
    setSaving(true);setError('');setNotice('')
    try {const response=await fetch(`${API}/customer-merges/${mergeId}/unmerge`,{method:'POST',headers});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||'Could not undo contact merge.');setNotice(L('Contact merge undone.','تم التراجع عن دمج جهة الاتصال.'));await load(businessId,page);await loadDetail(detail.customer.id,detail.customer.id)}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not undo contact merge.')}finally{setSaving(false)}
  }
  async function exportCsv() {
    setError('');setNotice('')
    try {const params=new URLSearchParams();if(search.trim())params.set('search',search.trim());if(stage)params.set('lifecycle_stage',stage);if(channelId)params.set('channel_id',channelId);const response=await fetch(`${API}/customers/export?${params}`,{headers});if(!response.ok)throw new Error('Could not export contacts.');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='contacts.csv';a.click();URL.revokeObjectURL(url)}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not export contacts.')}
  }
  async function importCsv(confirm:boolean) {
    if(!csvFile)return
    setSaving(true);setError('');setNotice('')
    try {const form=new FormData();form.set('file',csvFile);if(confirm)form.set('confirm','1');const response=await fetch(`${API}/customers/import`,{method:'POST',headers:authHeaders(businessId),body:form});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||'Could not import contacts.');if(confirm){setNotice(L(`Imported ${payload.created}; skipped ${payload.skipped_existing} existing contacts.`,`تم استيراد ${payload.created} وتجاوز ${payload.skipped_existing} جهة موجودة.`));setImportPreview(null);setCsvFile(null);await load(businessId!,1)}else setImportPreview(payload)}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not import contacts.')}finally{setSaving(false)}
  }

  const lifecycleOptions = [
    { value: '', label: L('All stages', 'كل المراحل') },
    { value: 'new_lead', label: L('New lead', 'عميل محتمل جديد') },
    { value: 'qualified', label: L('Qualified', 'مؤهل') },
    { value: 'customer', label: L('Customer', 'عميل') },
    { value: 'lost', label: L('Lost', 'غير نشط') },
  ]
  const channelOptions = [
    { value: '', label: L('All accounts', 'كل الحسابات') },
    ...channels.map(channel => ({
      value: String(channel.id),
      label: `${channel.page_name || channel.page_id} · ${channel.type}`,
      description: channel.status,
    })),
  ]
  const lifecycleLabel = (contact: Contact) => {
    const value = String(contact.custom_fields?.lifecycle_stage || 'new_lead')
    return lifecycleOptions.find(option => option.value === value)?.label || value.replaceAll('_', ' ')
  }
  const displayContactMethods = (contact: Contact) => [
    contact.email,
    contact.phone_is_displayable ? contact.phone : null,
  ].filter(Boolean).join(' · ')
  const selectedContactCanShowPhone = !!detail?.customer.phone_is_displayable
  const mergeOptions = [
    { value: '', label: L('Choose target contact', 'اختر جهة الاتصال الهدف') },
    ...contacts.filter(contact => contact.id !== detail?.customer.id).map(contact => ({
      value: String(contact.id),
      label: contact.name || `#${contact.id}`,
      description: contact.email || (contact.phone_is_displayable ? contact.phone : null) || `#${contact.id}`,
    })),
  ]
  const formatDate = (value: string | null | undefined) => value
    ? new Date(value).toLocaleString(isRTL ? 'ar' : undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
      <PageHeader
        title={L('Contacts', 'جهات الاتصال')}
        description={L('A clear view of customer profiles, conversations, consent, and orders across your workspace.', 'عرض واضح لملفات العملاء والمحادثات والموافقات والطلبات في مساحة العمل.')}
        breadcrumbs={[{ label: L('Workspace', 'مساحة العمل'), href: '/dashboard' }, { label: L('Contacts', 'جهات الاتصال') }]}
        primaryAction={<Button variant="outline" size="md" icon={<Download size={16} />} onClick={exportCsv}>{L('Export CSV', 'تصدير CSV')}</Button>}
      />

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/25 bg-error/5 px-4 py-3 text-sm text-error"><span className="mt-0.5">!</span><p>{error}</p></div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success"><Check size={16} /><p>{notice}</p></div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={L('Contact overview', 'ملخص جهات الاتصال')}>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/12 text-brand"><Users size={20} /></div>
          <div><p className="text-xs text-text-secondary">{L('Contacts in workspace', 'جهات الاتصال في مساحة العمل')}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight text-text-primary">{totalContacts.toLocaleString(isRTL ? 'ar' : undefined)}</p></div>
          <span className="ms-auto rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-text-secondary">{L('All sources', 'كل المصادر')}</span>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-text-secondary"><MessageSquare size={19} /></div>
          <div><p className="text-xs text-text-secondary">{L('Visible on this page', 'المعروض في هذه الصفحة')}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight text-text-primary">{contacts.length}</p></div>
          <span className="ms-auto text-xs text-text-tertiary">{L('Page', 'صفحة')} {page} / {lastPage}</span>
        </div>
        <div className="hidden items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm xl:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success"><ShieldCheck size={19} /></div>
          <div><p className="text-xs text-text-secondary">{L('WhatsApp phone details', 'أرقام واتساب')}</p><p className="mt-0.5 text-sm font-semibold text-text-primary">{L('Only direct contacts', 'جهات الاتصال المباشرة فقط')}</p></div>
          <span className="ms-auto text-[11px] text-text-tertiary">{L('Group and social IDs hidden', 'معرّفات المجموعات والمنصات مخفية')}</span>
        </div>
      </section>

      <section className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><SlidersHorizontal size={16} className="text-brand" />{L('Find and filter contacts', 'البحث عن جهات الاتصال وتصفيتها')}</div>
          <div className="grid items-end gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(180px,.55fr)_minmax(240px,.85fr)_auto]">
            <label className="block text-xs font-medium text-text-secondary">
              {L('Search', 'بحث')}
              <span className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-text-secondary transition-colors focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10">
                <Search size={16} className="shrink-0 text-text-tertiary" />
                <input aria-label={L('Search contacts', 'ابحث عن جهات الاتصال')} className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && businessId && void load(businessId, 1)} placeholder={L('Name, email, or phone', 'الاسم أو البريد أو الهاتف')} />
                {search && <button type="button" onClick={() => setSearch('')} className="rounded-md p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary" aria-label={L('Clear search', 'مسح البحث')}><X size={14} /></button>}
              </span>
            </label>
            <Select label={L('Lifecycle', 'مرحلة العميل')} ariaLabel={L('Filter by lifecycle stage', 'تصفية حسب مرحلة العميل')} dir={isRTL ? 'rtl' : 'ltr'} value={stage} options={lifecycleOptions} onChange={(event: {target:{value:string}}) => setStage(event.target.value)} />
            <Select label={L('Channel account', 'حساب القناة')} ariaLabel={L('Filter by channel account', 'تصفية حسب حساب القناة')} dir={isRTL ? 'rtl' : 'ltr'} searchable value={channelId} options={channelOptions} onChange={(event: {target:{value:string}}) => setChannelId(event.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => businessId && void load(businessId, 1)} disabled={loading} loading={loading} icon={<Filter size={15} />} className="w-full lg:w-auto">{L('Apply filters', 'تطبيق')}</Button>
              {(search || stage || channelId) && <Button variant="ghost" onClick={() => { setSearch(''); setStage(''); setChannelId(''); if (businessId) void load(businessId, 1, {search:'',stage:'',channelId:''}) }} aria-label={L('Clear all filters', 'مسح كل عوامل التصفية')}>{L('Reset', 'إعادة ضبط')}</Button>}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-divider pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary"><Users size={15} className="text-text-tertiary" /><span>{L('Showing', 'عرض')} <strong className="text-text-primary">{contacts.length}</strong> {L('of', 'من')} <strong className="text-text-primary">{totalContacts.toLocaleString(isRTL ? 'ar' : undefined)}</strong></span><span className="text-text-tertiary">·</span><span>{L('Page', 'صفحة')} {page} {L('of', 'من')} {lastPage}</span></div>
            <div className="flex flex-wrap items-center gap-2">
              {csvFile && <span className="max-w-36 truncate text-xs text-text-secondary" title={csvFile.name}>{csvFile.name}</span>}
              <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/35 hover:bg-surface-elevated hover:text-text-primary">
                <FileUp size={15} />{csvFile ? L('Change CSV', 'تغيير الملف') : L('Import CSV', 'استيراد CSV')}
                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={event => { setCsvFile(event.target.files?.[0] || null); setImportPreview(null) }} />
              </label>
              {csvFile && <Button variant="secondary" size="sm" disabled={saving} onClick={() => void importCsv(false)}>{L('Preview import', 'معاينة الاستيراد')}</Button>}
            </div>
          </div>
          {importPreview && <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-text-primary">{L('Import preview', 'معاينة الاستيراد')}</p><p className="text-xs text-text-secondary">{importPreview.valid_rows} {L('valid', 'صالح')} · {importPreview.invalid_rows} {L('invalid', 'غير صالح')}</p></div>
            {importPreview.errors.slice(0,5).map(item => <p key={item.row} className="mt-2 text-xs text-error">{L('Row', 'صف')} {item.row}: {item.error}</p>)}
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={saving || importPreview.invalid_rows > 0} onClick={() => void importCsv(true)}>{L('Confirm import', 'تأكيد الاستيراد')}</Button><Button size="sm" variant="outline" onClick={() => setImportPreview(null)}>{L('Cancel', 'إلغاء')}</Button></div>
          </div>}
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3.5 sm:px-5">
            <div><h2 className="text-sm font-semibold text-text-primary">{L('Customer directory', 'دليل العملاء')}</h2><p className="mt-0.5 text-xs text-text-tertiary">{L('Select a profile to see its activity and details.', 'اختر ملفاً لعرض نشاطه وتفاصيله.')}</p></div>
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary">{totalContacts.toLocaleString(isRTL ? 'ar' : undefined)} {L('total', 'الإجمالي')}</span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-surface/70 text-start text-[11px] font-semibold uppercase tracking-wide text-text-tertiary"><tr>
                <th scope="col" className="px-5 py-3 text-start">{L('Contact', 'جهة الاتصال')}</th><th scope="col" className="px-3 py-3 text-start">{L('Lifecycle', 'المرحلة')}</th><th scope="col" className="px-3 py-3 text-start">{L('Tags', 'العلامات')}</th><th scope="col" className="px-3 py-3 text-center">{L('Chats', 'المحادثات')}</th><th scope="col" className="px-5 py-3 text-end">{L('Last activity', 'آخر نشاط')}</th>
              </tr></thead>
              <tbody className="divide-y divide-divider">
                {contacts.map(contact => {
                  const selected = detail?.customer.id === contact.id
                  return <tr key={contact.id}>
                    <td colSpan={5} className="p-0">
                      <button type="button" onClick={() => void openContact(contact)} aria-current={selected ? 'true' : undefined} className={`grid w-full grid-cols-[minmax(210px,1.45fr)_minmax(100px,.75fr)_minmax(110px,.8fr)_70px_minmax(150px,1fr)] items-center text-start transition-colors hover:bg-surface-elevated/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50 ${selected ? 'bg-brand/5' : ''}`}>
                        <span className="flex min-w-0 items-center gap-3 px-5 py-3.5">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-brand/15 to-surface text-sm font-semibold text-brand ${selected ? 'ring-2 ring-brand/25' : ''}`}>{contact.avatar ? <img src={contact.avatar} alt="" className="h-full w-full object-cover" /> : (contact.name?.trim()?.charAt(0)?.toLocaleUpperCase() || <UserRound size={17} />)}</span>
                          <span className="min-w-0"><span className="block truncate font-semibold text-text-primary">{contact.name || L('Unnamed contact', 'جهة اتصال بلا اسم')}</span><span className="mt-0.5 block truncate text-xs text-text-tertiary">{displayContactMethods(contact) || L('No contact details', 'لا توجد تفاصيل اتصال')}</span></span>
                        </span>
                        <span className="px-3 py-3.5"><span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold ${contact.custom_fields?.lifecycle_stage === 'customer' ? 'border-success/20 bg-success/10 text-success' : 'border-border bg-surface text-text-secondary'}`}>{lifecycleLabel(contact)}</span></span>
                        <span className="flex min-w-0 flex-wrap gap-1 px-3 py-3.5">{(contact.tags || []).slice(0,2).map(tag => <span key={tag} className="max-w-24 truncate rounded-md bg-surface-elevated px-2 py-1 text-[10px] text-text-secondary">{tag}</span>)}{(contact.tags || []).length > 2 && <span className="rounded-md bg-surface-elevated px-2 py-1 text-[10px] text-text-tertiary">+{contact.tags!.length - 2}</span>}</span>
                        <span className="px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-text-primary">{contact.conversations_count}</span>
                        <span className="px-5 py-3.5 text-end text-xs text-text-secondary">{formatDate(contact.conversations_max_last_message_at)}</span>
                      </button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-divider md:hidden">
            {contacts.map(contact => {
              const selected = detail?.customer.id === contact.id
              return <button key={contact.id} type="button" onClick={() => void openContact(contact)} className={`flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-surface-elevated/60 ${selected ? 'bg-brand/5' : ''}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-brand/15 to-surface text-sm font-semibold text-brand">{contact.avatar ? <img src={contact.avatar} alt="" className="h-full w-full object-cover" /> : (contact.name?.trim()?.charAt(0)?.toLocaleUpperCase() || <UserRound size={18} />)}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-text-primary">{contact.name || L('Unnamed contact', 'جهة اتصال بلا اسم')}</span><span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-text-secondary">{lifecycleLabel(contact)}</span></span>
                  <span className="mt-1 block truncate text-xs text-text-secondary">{displayContactMethods(contact) || L('No contact details', 'لا توجد تفاصيل اتصال')}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">{(contact.tags || []).slice(0,3).map(tag => <span key={tag} className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] text-text-secondary">{tag}</span>)}<span className="ms-auto inline-flex items-center gap-1 text-[10px] text-text-tertiary"><MessageSquare size={12}/>{contact.conversations_count}</span></span>
                  <span className="mt-2 block text-[10px] text-text-tertiary">{formatDate(contact.conversations_max_last_message_at)}</span>
                </span>
              </button>
            })}
          </div>

          {!loading && contacts.length === 0 && <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Users size={23} /></span>
            <h3 className="mt-4 text-sm font-semibold text-text-primary">{L('No contacts found', 'لم يتم العثور على جهات اتصال')}</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-text-secondary">{L('Try changing your search or filters. Contacts are added from connected channel activity or a CSV import.', 'جرّب تعديل البحث أو عوامل التصفية. تُضاف جهات الاتصال من نشاط القنوات المتصلة أو عبر استيراد CSV.')}</p>
            {(search || stage || channelId) && <Button className="mt-4" variant="outline" size="sm" onClick={() => { setSearch(''); setStage(''); setChannelId(''); if (businessId) void load(businessId,1,{search:'',stage:'',channelId:''}) }}>{L('Clear filters', 'مسح عوامل التصفية')}</Button>}
          </div>}

          {loading && <div className="space-y-3 p-5" aria-label={L('Loading contacts', 'جارٍ تحميل جهات الاتصال')}><div className="h-11 animate-pulse rounded-xl bg-surface-elevated"/><div className="h-11 animate-pulse rounded-xl bg-surface-elevated"/><div className="h-11 animate-pulse rounded-xl bg-surface-elevated"/></div>}

          <div className="flex items-center justify-between gap-3 border-t border-divider p-3.5 sm:px-5">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => businessId && void load(businessId, page - 1)} icon={isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}>{L('Previous', 'السابق')}</Button>
            <span className="text-xs tabular-nums text-text-secondary">{page} / {lastPage}</span>
            <Button variant="outline" size="sm" disabled={page >= lastPage || loading} onClick={() => businessId && void load(businessId, page + 1)} iconRight={isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}>{L('Next', 'التالي')}</Button>
          </div>
        </section>

        <aside className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm 2xl:sticky 2xl:top-4">
          {!detail ? <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/10 to-surface text-brand"><UserRound size={25} /></span>
            <h2 className="mt-4 text-sm font-semibold text-text-primary">{L('Contact profile', 'ملف جهة الاتصال')}</h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-text-secondary">{L('Select a contact to review their channel activity, consent, notes, and synced orders.', 'اختر جهة اتصال لمراجعة نشاط القنوات والموافقات والملاحظات والطلبات المتزامنة.')}</p>
          </div> : <>
            <div className="flex items-start justify-between gap-3 border-b border-divider bg-gradient-to-br from-brand/8 via-card to-card p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand/15 bg-brand/10 text-lg font-semibold text-brand">{detail.customer.avatar ? <img src={detail.customer.avatar} alt="" className="h-full w-full object-cover" /> : (edit.name.trim().charAt(0).toLocaleUpperCase() || <UserRound size={20} />)}</span>
                <div className="min-w-0"><h2 className="truncate text-base font-semibold text-text-primary">{edit.name || L('Unnamed contact', 'جهة اتصال بلا اسم')}</h2><p className="mt-1 truncate text-xs text-text-secondary">#{detail.customer.id} <span className="text-text-tertiary">·</span> {L('Added', 'أضيف')} {new Date(detail.customer.created_at).toLocaleDateString(isRTL ? 'ar' : undefined)}</p></div>
              </div>
              <button type="button" aria-label={L('Close profile', 'إغلاق الملف')} onClick={() => setDetail(null)} className="rounded-lg border border-transparent p-2 text-text-tertiary transition-colors hover:border-border hover:bg-surface hover:text-text-primary"><X size={17} /></button>
            </div>

            <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto p-4 sm:p-5">
              <section aria-labelledby="contact-profile-heading">
                <div className="mb-3 flex items-center justify-between"><div><h3 id="contact-profile-heading" className="text-sm font-semibold text-text-primary">{L('Profile details', 'تفاصيل الملف')}</h3><p className="mt-0.5 text-[11px] text-text-tertiary">{L('Edit customer information and ownership.', 'عدّل معلومات العميل والمسؤول عنه.')}</p></div><span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-text-secondary">{lifecycleOptions.find(option => option.value === edit.lifecycle_stage)?.label || edit.lifecycle_stage}</span></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label={L('Name', 'الاسم')} value={edit.name} onChange={value => setEdit(current => ({...current,name:value}))} />
                  <TextField label={L('Email', 'البريد الإلكتروني')} type="email" value={edit.email} onChange={value => setEdit(current => ({...current,email:value}))} />
                  {selectedContactCanShowPhone && <TextField label={L('WhatsApp phone', 'رقم واتساب')} type="tel" value={edit.phone} onChange={value => setEdit(current => ({...current,phone:value}))} hint={L('Direct WhatsApp contact only', 'جهة واتساب مباشرة فقط')} />}
                  <Select label={L('Lifecycle stage', 'مرحلة العميل')} dir={isRTL ? 'rtl' : 'ltr'} value={edit.lifecycle_stage} options={lifecycleOptions.slice(1)} onChange={(event: {target:{value:string}}) => setEdit(current => ({...current,lifecycle_stage:event.target.value}))} />
                  <Select label={L('Assigned to', 'مسند إلى')} ariaLabel={L('Assigned to', 'مسند إلى')} dir={isRTL ? 'rtl' : 'ltr'} searchable value={edit.assigned_to} options={[{value:'',label:L('Unassigned','غير مسند')},...assignees.map(person=>({value:String(person.id),label:person.name,description:person.role}))]} onChange={(event: {target:{value:string}}) => setEdit(current => ({...current,assigned_to:event.target.value}))} />
                  <TextField label={L('Tags, comma separated', 'العلامات، افصل بينها بفاصلة')} value={edit.tags} onChange={value => setEdit(current => ({...current,tags:value}))} />
                  <TextField label={L('Lead score', 'تقييم العميل')} type="number" min={0} max={100} value={String(edit.lead_score)} onChange={value => setEdit(current => ({...current,lead_score:Number(value)}))} />
                  <TextField label={L('Language', 'اللغة')} value={edit.language} onChange={value => setEdit(current => ({...current,language:value}))} />
                  <TextField label={L('Source', 'المصدر')} value={edit.source} onChange={value => setEdit(current => ({...current,source:value}))} />
                </div>
                {detail.customer.merged_into_customer_id ? <p className="mt-3 rounded-xl border border-warning/25 bg-warning/5 p-3 text-xs leading-5 text-text-secondary">{L('This profile was merged into', 'تم دمج هذا الملف مع')} <strong className="text-text-primary">{detail.customer.merged_into?.name || `#${detail.customer.merged_into_customer_id}`}</strong>. {L('Open the target profile to undo the merge.', 'افتح الملف الهدف للتراجع عن الدمج.')}</p> : <div className="mt-4 flex justify-end"><Button loading={saving} disabled={saving} onClick={saveContact} icon={<Check size={15} />}>{L('Save profile', 'حفظ الملف')}</Button></div>}
              </section>

              {!detail.customer.merged_into_customer_id && <section className="rounded-xl border border-border bg-surface/40 p-3.5">
                <div className="flex items-start gap-2.5"><span className="rounded-lg bg-surface-elevated p-2 text-text-secondary"><Users size={15} /></span><div><h3 className="text-xs font-semibold text-text-primary">{L('Merge duplicate contact', 'دمج جهة اتصال مكررة')}</h3><p className="mt-1 text-[11px] leading-4 text-text-secondary">{L('Move conversations and notes into another profile. You can undo a merge later.', 'انقل المحادثات والملاحظات إلى ملف آخر، ويمكن التراجع عن الدمج لاحقاً.')}</p></div></div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Select className="min-w-0 flex-1" dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Merge into contact', 'دمج مع جهة اتصال')} searchable value={mergeTargetId} options={mergeOptions} onChange={(event: {target:{value:string}}) => setMergeTargetId(event.target.value)} /><Button variant="secondary" disabled={saving || !mergeTargetId} loading={saving} onClick={() => void mergeContact()}>{L('Merge', 'دمج')}</Button></div>
              </section>}
              {(detail.customer.merge_records_as_target || []).length > 0 && <section className="space-y-2 rounded-xl border border-border p-3.5"><h3 className="text-xs font-semibold text-text-primary">{L('Merge history', 'سجل الدمج')}</h3>{detail.customer.merge_records_as_target?.map(record => <div key={record.id} className="flex items-center justify-between gap-2 border-t border-divider pt-2 text-xs"><span className="truncate text-text-secondary">{record.source?.name || `#${record.source_customer_id}`} · {record.source?.email || ''}</span><Button size="sm" variant="outline" disabled={saving} onClick={() => void undoMerge(record.id)}>{L('Undo', 'تراجع')}</Button></div>)}</section>}

              <ProfileSection icon={<ShoppingBag size={16}/>} title={L('Synced orders', 'الطلبات المتزامنة')} count={detail.orders.length}>
                {detail.orders.length ? detail.orders.map(order => <div key={order.id} className="rounded-lg border border-divider bg-surface/50 p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><strong className="text-text-primary">{order.order_number || order.id}</strong><span className="rounded-full bg-surface-elevated px-2 py-0.5 text-text-secondary">{order.fulfillment_status || order.status || '—'}</span></div><p className="mt-1 text-xs text-text-secondary">{order.total} {order.currency} <span className="text-text-tertiary">·</span> {order.channel?.page_name || order.channel?.type}</p><p className="mt-1 text-[10px] text-text-tertiary">{formatDate(order.ordered_at)}</p></div>) : <EmptyDetail text={L('No synced orders matched this contact’s email or direct WhatsApp number. Draft checkout state is not counted as an order.', 'لا توجد طلبات متزامنة تطابق البريد أو رقم واتساب المباشر. لا تُحسب مسودة الدفع طلباً.')} />}
              </ProfileSection>

              <ProfileSection icon={<ShieldCheck size={16}/>} title={L('Communication consent', 'موافقة التواصل')} count={detail.consents.length}>
                {detail.consents.length ? detail.consents.map((consent,index) => <div key={`${consent.channel}-${consent.scope}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-divider px-3 py-2 text-[11px]"><span className="font-medium text-text-primary">{consent.channel}</span><span className="text-text-tertiary">{consent.scope}</span><span className="ms-auto rounded-full bg-surface-elevated px-2 py-0.5 text-text-secondary">{consent.status}</span></div>) : <EmptyDetail text={L('No consent record found for this contact identity.', 'لا يوجد سجل موافقة لهوية جهة الاتصال.')} />}
              </ProfileSection>

              <ProfileSection icon={<MessageSquare size={16}/>} title={L('Conversation history', 'سجل المحادثات')} count={detail.customer.conversations.length}>
                {detail.customer.conversations.length ? detail.customer.conversations.map(conversation => <div key={conversation.id} className="flex items-center gap-3 rounded-lg border border-divider px-3 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary"><MessageSquare size={14}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-text-primary">{conversation.channel?.page_name || conversation.channel?.type || L('Channel', 'قناة')}</p><p className="mt-0.5 text-[10px] text-text-tertiary">{conversation.status} · {formatDate(conversation.last_message_at)}</p></div></div>) : <EmptyDetail text={L('No linked conversations.', 'لا توجد محادثات مرتبطة.')} />}
              </ProfileSection>

              <ProfileSection icon={<MessageSquare size={16}/>} title={L('Comment history', 'سجل التعليقات')} count={detail.comments?.length || 0}>
                {detail.comments?.length ? detail.comments.map(comment => <div key={comment.id} className="rounded-lg border border-divider px-3 py-2.5"><p className="text-xs leading-5 text-text-primary">{comment.comment_text || L('Comment text unavailable', 'نص التعليق غير متاح')}</p><p className="mt-1 text-[10px] text-text-tertiary">{channels.find(channel => channel.id === comment.channel_id)?.page_name || comment.platform} · {comment.status}{comment.public_reply_id ? ` · ${L('Replied', 'تم الرد')}` : ''} · {formatDate(comment.platform_created_at)}</p></div>) : <EmptyDetail text={L('No comments are linked to this contact identity.', 'لا توجد تعليقات مرتبطة بهوية جهة الاتصال.')} />}
              </ProfileSection>

              <ProfileSection icon={<FileUp size={16}/>} title={L('Internal notes', 'ملاحظات داخلية')} count={detail.customer.notes.length}>
                {detail.customer.notes.length > 0 && <div className="max-h-52 space-y-2 overflow-y-auto">{detail.customer.notes.map(item => <div key={item.id} className="rounded-lg border border-divider bg-surface/50 p-3"><p className="whitespace-pre-wrap text-xs leading-5 text-text-primary">{item.content}</p><p className="mt-2 text-[10px] text-text-tertiary">{item.author?.name || L('Team member', 'عضو الفريق')} · {formatDate(item.created_at)}</p></div>)}</div>}
                <label className="mt-2 block text-xs font-medium text-text-secondary">{L('Add a private note', 'أضف ملاحظة خاصة')}<textarea className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand/50 focus:ring-2 focus:ring-brand/10" rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder={L('Only your team can see this note…', 'هذه الملاحظة مرئية لفريقك فقط…')} /></label>
                <div className="mt-2 flex justify-end"><Button size="sm" disabled={saving || !note.trim()} loading={saving} onClick={() => void addNote()} icon={<Plus size={14}/>}>{L('Add note', 'إضافة ملاحظة')}</Button></div>
              </ProfileSection>
            </div>
          </>}
        </aside>
      </div>
    </main>
  )
}

function TextField({ label, value, onChange, type = 'text', min, max, hint }: {label:string;value:string;onChange:(value:string)=>void;type?:string;min?:number;max?:number;hint?:string}) {
  return <label className="block min-w-0 text-xs font-medium text-text-secondary">{label}<input type={type} min={min} max={max} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand/50 focus:ring-2 focus:ring-brand/10" />{hint && <span className="mt-1 block text-[10px] font-normal text-text-tertiary">{hint}</span>}</label>
}

function ProfileSection({ icon, title, count, children }: {icon:ReactNode;title:string;count?:number;children:ReactNode}) {
  return <section className="space-y-3 border-t border-divider pt-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/8 text-brand">{icon}</span><h3 className="text-xs font-semibold text-text-primary">{title}</h3>{count !== undefined && <span className="ms-auto rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] tabular-nums text-text-secondary">{count}</span>}</div><div className="space-y-2">{children}</div></section>
}

function EmptyDetail({ text }: {text:string}) {
  return <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-5 text-text-tertiary">{text}</p>
}
