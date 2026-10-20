'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Search, Users, Upload, RefreshCw, MessageSquare, ShoppingBag, Plus, X } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type Contact = { id:number; name:string|null; phone:string|null; email:string|null; avatar:string|null; tags:string[]|null; lead_score:number; assigned_to:number|null; assignee?:{id:number;name:string}|null; custom_fields:Record<string, unknown>|null; conversations_count:number; conversations_max_last_message_at:string|null; created_at:string }
type Channel = { id:number; type:string; page_name:string|null; page_id:string; status:string }
type Assignee = {id:number;name:string;email?:string|null;role:string}
type ContactDetail = { customer:Contact & { conversations:Array<{id:number; channel?:Channel; status:string; sender_name:string|null; subject:string|null; last_message_at:string|null; created_at:string}>; notes:Array<{id:number; content:string; author?:{name:string}; created_at:string}> }; orders:Array<{id:number; order_number:string|null; status:string|null; fulfillment_status:string|null; total:string|number; currency:string|null; ordered_at:string|null; channel?:Channel}>; consents:Array<{channel:string; scope:string; status:string; source:string; captured_at:string|null}>; comments:Array<{id:number; channel_id:number; platform:string; comment_text:string|null; status:string; public_reply_id:string|null; platform_created_at:string|null}> }

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
  const [loading,setLoading] = useState(false)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [note,setNote] = useState('')
  const [csvFile,setCsvFile] = useState<File|null>(null)
  const [importPreview,setImportPreview] = useState<{valid_rows:number;invalid_rows:number;errors:Array<{row:number;error:string}>}|null>(null)
  const [edit,setEdit] = useState({name:'',email:'',phone:'',tags:'',lead_score:0,lifecycle_stage:'new_lead',language:'',source:'',assigned_to:''})
  const loadSequence = useRef(0)
  const loadRef = useRef<(id:number,nextPage?:number)=>Promise<void>>(async()=>{})

  const headers = useMemo(() => authHeaders(businessId), [businessId])

  const load = useCallback(async (id:number, nextPage=page) => {
    const requestSequence = ++loadSequence.current
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({per_page:'25',page:String(nextPage)})
      if (search.trim()) params.set('search',search.trim())
      if (stage) params.set('lifecycle_stage',stage)
      if (channelId) params.set('channel_id',channelId)
      const [contactsResponse,channelsResponse,assigneesResponse] = await Promise.all([
        fetch(`${API}/customers?${params}`,{headers}),
        fetch(`${API}/channels`,{headers}),
        fetch(`${API}/customers/assignees`,{headers}),
      ])
      if (requestSequence !== loadSequence.current) return
      if (!contactsResponse.ok || !channelsResponse.ok) throw new Error(L('Could not load contacts for the selected workspace.','تعذر تحميل جهات الاتصال لمساحة العمل المحددة.'))
      const contactPayload = await contactsResponse.json()
      setContacts(Array.isArray(contactPayload.data) ? contactPayload.data : [])
      setPage(contactPayload.current_page || 1); setLastPage(contactPayload.last_page || 1)
      const channelPayload = await channelsResponse.json()
      setChannels(Array.isArray(channelPayload) ? channelPayload.filter((c:Channel)=>!['salla','shopify','woocommerce'].includes(c.type)) : (channelPayload.data || []))
      const assigneePayload = await assigneesResponse.json()
      setAssignees(Array.isArray(assigneePayload.assignees) ? assigneePayload.assignees : [])
    } catch (cause) {
      if (requestSequence === loadSequence.current) setError(cause instanceof Error ? cause.message : L('Could not load contacts.','تعذر تحميل جهات الاتصال.'))
    }
    finally { if (requestSequence === loadSequence.current) setLoading(false) }
  },[page,search,stage,channelId,headers,L])
  useEffect(()=>{loadRef.current=load},[load])

  const loadDetail = useCallback(async (id:number, customerId:number) => {
    const response = await fetch(`${API}/customers/${customerId}`,{headers})
    const payload = await response.json().catch(()=>({}))
    if (!response.ok) throw new Error(payload.message || L('Could not load this contact.','تعذر تحميل جهة الاتصال.'))
    const value = payload as ContactDetail
    setDetail(value)
    const fields = value.customer.custom_fields || {}
    setEdit({name:value.customer.name || '',email:value.customer.email || '',phone:value.customer.phone || '',tags:(value.customer.tags || []).join(', '),lead_score:value.customer.lead_score || 0,lifecycle_stage:String(fields.lifecycle_stage || 'new_lead'),language:String(fields.language || ''),source:String(fields.source || ''),assigned_to:value.customer.assigned_to ? String(value.customer.assigned_to) : ''})
    setNotice('')
    void id
  },[headers,L])

  useEffect(()=>{
    const sync=()=>{const id=getSelectedBusinessId(); setBusinessId(id); setDetail(null); setContacts([]); if(id) void loadRef.current(id,1); else setError(L('Select a workspace to manage contacts.','اختر مساحة عمل لإدارة جهات الاتصال.'))}
    sync(); window.addEventListener('naz:business-changed',sync); window.addEventListener('storage',sync)
    return ()=>{window.removeEventListener('naz:business-changed',sync);window.removeEventListener('storage',sync)}
  },[L])

  async function openContact(contact:Contact) { try { await loadDetail(contact.id,contact.id) } catch(cause) {setError(cause instanceof Error?cause.message:'Could not load contact.')} }
  async function saveContact() {
    if(!detail) return
    setSaving(true);setError('');setNotice('')
    try {
      const response=await fetch(`${API}/customers/${detail.customer.id}`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({...edit,assigned_to:edit.assigned_to ? Number(edit.assigned_to) : null,tags:edit.tags.split(',').map(x=>x.trim()).filter(Boolean),lead_score:Number(edit.lead_score)})})
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

  return <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
    <PageHeader title={L('Contacts','جهات الاتصال')} description={L('Business-scoped customer profiles, conversation history, consent, notes, and synced store orders.','ملفات العملاء ومحادثاتهم وموافقتهم وملاحظاتهم وطلبات المتاجر المتزامنة ضمن مساحة العمل.')} primaryAction={<Button variant="outline" onClick={exportCsv}><Download size={16}/>{L('Export CSV','تصدير CSV')}</Button>} />
    {error&&<div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>}{notice&&<div role="status" className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">{notice}</div>}
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-48 flex-1 text-xs text-muted-foreground">{L('Search contacts','ابحث عن جهات الاتصال')}<span className="mt-1 flex items-center gap-2 rounded-lg border bg-background px-3"><Search size={16}/><input className="w-full bg-transparent py-2 text-sm outline-none" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&businessId&&load(businessId,1)} placeholder={L('Name, email, or phone','الاسم أو البريد أو الهاتف')}/></span></label>
        <label className="text-xs text-muted-foreground">{L('Lifecycle','مرحلة العميل')}<select className="mt-1 block min-w-40 rounded-lg border bg-background px-3 py-2 text-sm" value={stage} onChange={e=>setStage(e.target.value)}><option value="">{L('All stages','كل المراحل')}</option>{[['new_lead','New lead'],['qualified','Qualified'],['customer','Customer'],['lost','Lost']].map(([v,l])=><option key={v} value={v}>{L(l, v==='new_lead'?'عميل محتمل جديد':v==='qualified'?'مؤهل':v==='customer'?'عميل':'غير نشط')}</option>)}</select></label>
        <label className="text-xs text-muted-foreground">{L('Channel account','حساب القناة')}<select className="mt-1 block min-w-48 rounded-lg border bg-background px-3 py-2 text-sm" value={channelId} onChange={e=>setChannelId(e.target.value)}><option value="">{L('All accounts','كل الحسابات')}</option>{channels.map(c=><option key={c.id} value={c.id}>{c.page_name||c.page_id} · {c.type}</option>)}</select></label>
        <Button onClick={()=>businessId&&load(businessId,1)} disabled={loading}><RefreshCw size={15} className={loading?'animate-spin':''}/>{L('Apply filters','تطبيق')}</Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-xs text-muted-foreground"><Users size={15}/>{L('Showing','عرض')} {contacts.length} {L('contacts on this page','جهة في هذه الصفحة')}{' · '}{L('Page','صفحة')} {page} {L('of','من')} {lastPage}
        <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm text-foreground"><Upload size={15}/>{L('Choose CSV','اختر CSV')}<input type="file" accept=".csv,text/csv" className="sr-only" onChange={e=>{setCsvFile(e.target.files?.[0]||null);setImportPreview(null)}}/></label>
        {csvFile&&<><span className="max-w-40 truncate">{csvFile.name}</span><Button variant="outline" disabled={saving} onClick={()=>importCsv(false)}>{L('Preview import','معاينة الاستيراد')}</Button></>}
      </div>
      {importPreview&&<div className="mt-3 rounded-xl border bg-background p-3 text-sm"><p>{L('Preview','معاينة')}: {importPreview.valid_rows} {L('valid rows','صف صالح')}, {importPreview.invalid_rows} {L('invalid rows','صف غير صالح')}</p>{importPreview.errors.slice(0,5).map(e=><p key={e.row} className="text-error">{L('Row','صف')} {e.row}: {e.error}</p>)}<div className="mt-3 flex gap-2"><Button disabled={saving||importPreview.invalid_rows>0} onClick={()=>importCsv(true)}>{L('Confirm import','تأكيد الاستيراد')}</Button><Button variant="outline" onClick={()=>setImportPreview(null)}>{L('Cancel','إلغاء')}</Button></div></div>}
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">{L('Contact','جهة الاتصال')}</th><th className="px-4 py-3">{L('Lifecycle','المرحلة')}</th><th className="px-4 py-3">{L('Tags','العلامات')}</th><th className="px-4 py-3">{L('Conversations','المحادثات')}</th><th className="px-4 py-3">{L('Last interaction','آخر تفاعل')}</th></tr></thead><tbody>
          {contacts.map(c=><tr key={c.id} onClick={()=>void openContact(c)} className={`cursor-pointer border-t hover:bg-muted/40 ${detail?.customer.id===c.id?'bg-muted/30':''}`}><td className="px-4 py-3"><div className="font-medium">{c.name||L('Unnamed contact','جهة اتصال بلا اسم')}</div><div className="text-xs text-muted-foreground">{[c.email,c.phone].filter(Boolean).join(' · ')||L('No email or phone','لا يوجد بريد أو هاتف')}</div></td><td className="px-4 py-3">{String(c.custom_fields?.lifecycle_stage||'new_lead').replace('_',' ')}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(c.tags||[]).slice(0,3).map(tag=><span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>)}</div></td><td className="px-4 py-3">{c.conversations_count}</td><td className="px-4 py-3 text-xs text-muted-foreground">{c.conversations_max_last_message_at?new Date(c.conversations_max_last_message_at).toLocaleString():'—'}</td></tr>)}
        </tbody></table></div>
        {!loading&&!contacts.length&&<div className="p-10 text-center text-sm text-muted-foreground">{L('No contacts match these filters. Contacts are created from connected-channel activity or CSV imports.','لا توجد جهات اتصال مطابقة. تُنشأ الملفات من نشاط القنوات المتصلة أو استيراد CSV.')}</div>}
        <div className="flex justify-between border-t p-3"><Button variant="outline" disabled={page<=1||loading} onClick={()=>businessId&&load(businessId,page-1)}>{L('Previous','السابق')}</Button><Button variant="outline" disabled={page>=lastPage||loading} onClick={()=>businessId&&load(businessId,page+1)}>{L('Next','التالي')}</Button></div>
      </section>
      <aside className="rounded-2xl border border-border bg-card p-4">
        {!detail?<div className="flex min-h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground"><Users size={28} className="mb-3"/>{L('Select a contact to view its profile, consent, conversations, notes, and store orders.','اختر جهة اتصال لعرض ملفها وموافقتها ومحادثاتها وملاحظاتها وطلبات المتجر.')}</div>:<div className="space-y-5">
          <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{edit.name||L('Unnamed contact','جهة اتصال بلا اسم')}</h2><p className="text-xs text-muted-foreground">#{detail.customer.id} · {L('Added','تاريخ الإضافة')} {new Date(detail.customer.created_at).toLocaleDateString()}</p></div><button aria-label={L('Close profile','إغلاق الملف')} onClick={()=>setDetail(null)}><X size={18}/></button></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">{L('Name','الاسم')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></label><label className="text-xs">{L('Email','البريد')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.email} onChange={e=>setEdit({...edit,email:e.target.value})}/></label><label className="text-xs">{L('Phone','الهاتف')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.phone} onChange={e=>setEdit({...edit,phone:e.target.value})}/></label><label className="text-xs">{L('Lifecycle stage','مرحلة العميل')}<select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.lifecycle_stage} onChange={e=>setEdit({...edit,lifecycle_stage:e.target.value})}>{['new_lead','qualified','customer','lost'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></label><label className="text-xs">{L('Assigned to','مسند إلى')}<select aria-label={L('Assigned to','مسند إلى')} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.assigned_to} onChange={e=>setEdit({...edit,assigned_to:e.target.value})}><option value="">{L('Unassigned','غير مسند')}</option>{assignees.map(person=><option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}</select></label><label className="text-xs">{L('Tags, comma separated','العلامات، افصل بينها بفاصلة')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.tags} onChange={e=>setEdit({...edit,tags:e.target.value})}/></label><label className="text-xs">{L('Lead score','تقييم العميل')}<input type="number" min="0" max="100" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.lead_score} onChange={e=>setEdit({...edit,lead_score:Number(e.target.value)})}/></label><label className="text-xs">{L('Language','اللغة')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.language} onChange={e=>setEdit({...edit,language:e.target.value})}/></label><label className="text-xs">{L('Source','المصدر')}<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={edit.source} onChange={e=>setEdit({...edit,source:e.target.value})}/></label></div>
          <Button disabled={saving} onClick={saveContact}>{L('Save profile','حفظ الملف')}</Button>
          <div className="border-t pt-4"><h3 className="mb-2 flex items-center gap-2 font-medium"><ShoppingBag size={16}/>{L('Synced orders','الطلبات المتزامنة')}</h3>{detail.orders.length?detail.orders.map(o=><div key={o.id} className="border-t py-2 text-sm"><div>{o.order_number||o.id} · {o.status||'—'} · {o.total} {o.currency}</div><p className="text-xs text-muted-foreground">{o.channel?.page_name||o.channel?.type} · {o.ordered_at?new Date(o.ordered_at).toLocaleString():'—'}</p></div>):<p className="text-xs text-muted-foreground">{L('No synced orders matched this contact’s email or phone. Draft checkout state is not counted as an order.','لا توجد طلبات متزامنة تطابق بريد العميل أو هاتفه. لا تُحسب مسودة الدفع طلبًا.')}</p>}</div>
          <div className="border-t pt-4"><h3 className="mb-2 font-medium">{L('Communication consent','موافقة التواصل')}</h3>{detail.consents.length?detail.consents.map((c,i)=><p key={`${c.channel}-${c.scope}-${i}`} className="py-1 text-xs">{c.channel} · {c.scope}: <b>{c.status}</b> · {c.source}</p>):<p className="text-xs text-muted-foreground">{L('No consent record found for this contact identity.','لا يوجد سجل موافقة لهوية جهة الاتصال.')}</p>}</div>
          <div className="border-t pt-4"><h3 className="mb-2 flex items-center gap-2 font-medium"><MessageSquare size={16}/>{L('Conversation history','سجل المحادثات')}</h3>{detail.customer.conversations.length?detail.customer.conversations.map(c=><div key={c.id} className="border-t py-2 text-xs">{c.channel?.page_name||c.channel?.type||L('Channel','قناة')} · {c.status} · {c.last_message_at?new Date(c.last_message_at).toLocaleString():'—'}</div>):<p className="text-xs text-muted-foreground">{L('No linked conversations.','لا توجد محادثات مرتبطة.')}</p>}</div>
          <div className="border-t pt-4"><h3 className="mb-2 font-medium">{L('Comment history','سجل التعليقات')}</h3>{detail.comments?.length?detail.comments.map(comment=><div key={comment.id} className="border-t py-2 text-xs"><p>{comment.comment_text||L('Comment text unavailable','نص التعليق غير متاح')}</p><p className="mt-1 text-muted-foreground">{channels.find(channel=>channel.id===comment.channel_id)?.page_name||comment.platform} · {comment.status}{comment.public_reply_id?` · ${L('Replied','تم الرد')}`:''} · {comment.platform_created_at?new Date(comment.platform_created_at).toLocaleString():'—'}</p></div>):<p className="text-xs text-muted-foreground">{L('No comments are linked to this contact identity.','لا توجد تعليقات مرتبطة بهوية جهة الاتصال.')}</p>}</div>
          <div className="border-t pt-4"><h3 className="mb-2 font-medium">{L('Internal notes','ملاحظات داخلية')}</h3>{detail.customer.notes.map(n=><div key={n.id} className="border-t py-2 text-sm"><p>{n.content}</p><p className="text-xs text-muted-foreground">{n.author?.name||L('Team member','عضو الفريق')} · {new Date(n.created_at).toLocaleString()}</p></div>)}<textarea className="mt-2 w-full rounded-md border bg-background p-2 text-sm" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder={L('Add a private note','أضف ملاحظة خاصة')}/><Button className="mt-2" disabled={saving||!note.trim()} onClick={addNote}><Plus size={15}/>{L('Add note','إضافة ملاحظة')}</Button></div>
        </div>}
      </aside>
    </div>
  </div>
}
