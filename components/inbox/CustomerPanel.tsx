'use client'

import React, { useState } from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import {
  User, Phone, Mail, MapPin, Calendar, Clock, ShoppingBag,
  Tag, CreditCard, ExternalLink, ChevronDown, ChevronUp, Edit2, X, Plus
} from 'lucide-react'

interface CustomerPanelProps {
  conv: ApiConversation
  isRTL: boolean
  onClose?: () => void
  customer?: {
    id: number
    name: string | null
    phone: string | null
    email: string | null
    avatar: string | null
    lead_score: number
    tags: string[]
    custom_fields: Record<string, any>
    orders?: Array<{
      id: string
      date: string | null
      amount: string
      status: string
    }>
    conversations?: Array<{
      id: number
      date: string
      preview: string
      ch: string
    }>
  } | null
  notes?: Array<{
    id: number
    content: string
    author: { id: number; name: string }
    created_at: string
  }>
  onAddNote?: (content: string) => void
  isAddingNote?: boolean
}

export default function CustomerPanel({ conv, isRTL, onClose, customer, notes = [], onAddNote, isAddingNote = false }: CustomerPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    orders: true,
    history: true,
    notes: true
  })
  const [newNoteContent, setNewNoteContent] = useState('')
  const L = (en: string, ar: string) => isRTL ? ar : en

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Use real customer data if available, fallback to conversation data
  const customerName = customer?.name || conv.sender_name || L('Unknown Contact', 'جهة اتصال غير معروفة')
  const customerPhone = customer?.phone || conv.sender_id || ''
  const customerEmail = customer?.email || conv.sender_email || ''
  const customerTags = customer?.tags || []
  const leadScore = customer?.lead_score || 0

  // Format phone number for display
  const formatPhone = (phone: string): string => {
    if (!phone) return L('Not provided', 'غير متوفر')
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '')
    // Format based on length
    if (digits.length <= 3) return phone
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    // International format: +XX XXX XXX XXXX
    const countryCode = digits.length > 10 ? digits.slice(0, digits.length - 10) : ''
    const rest = digits.slice(-10)
    const formatted = `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 8)} ${rest.slice(8)}`
    return countryCode ? `+${countryCode} ${formatted}` : formatted
  }

  const displayPhone = formatPhone(customerPhone)
  const displayEmail = customerEmail || L('Not provided', 'غير متوفر')

  // Use real orders from customer prop, fallback to conversation checkout_state
  const orders = customer?.orders || []
  if (orders.length === 0 && conv.checkout_state?.order_id) {
    orders.push({
      id: conv.checkout_state.order_id,
      date: conv.last_message_at,
      amount: conv.checkout_state.product_price ? `${conv.checkout_state.product_price} ${conv.checkout_state.product_currency || 'SAR'}` : 'N/A',
      status: conv.checkout_state.status || 'unknown'
    })
  }

  // Use real history from customer prop, fallback to conversation messages
  const history = customer?.conversations || []
  if (history.length === 0 && conv.messages) {
    history.push(...conv.messages.slice(-5).map((msg: any, i: number) => ({
      id: i,
      date: msg.created_at,
      preview: msg.content?.substring(0, 50) || '',
      ch: conv.channel?.type || 'unknown'
    })))
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border overflow-y-auto w-[320px] flex-shrink-0">
      
      {/* Header Profile */}
      <div className="relative p-6 border-b border-border bg-surface-secondary/40 text-center">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        )}
        
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-secondary border border-border flex items-center justify-center text-text-primary text-xl font-bold shadow-xs mb-3">
          {(conv.sender_name?.charAt(0) || '?').toUpperCase()}
        </div>
        
        <h2 className="text-base font-semibold text-text-primary leading-tight">
          {conv.sender_name || 'Unknown Contact'}
        </h2>
        <p className="text-xs text-text-muted mt-1 font-mono">
          {L('Customer since', 'عميل منذ')} {new Date().getFullYear()}
        </p>

        <div className="flex justify-center gap-2 mt-4">
          <button className="flex-1 bg-surface-secondary border border-border rounded-lg py-2 text-xs font-medium text-text-primary hover:border-brand/40 transition-colors">
            {L('Edit Profile', 'تعديل الملف')}
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-surface-secondary border border-border rounded-lg text-text-primary hover:border-brand/40 transition-colors">
            <Phone size={14} />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{L('Tags', 'العلامات')}</h3>
            <button className="text-brand p-1 hover:bg-brand/10 rounded transition-colors"><Plus size={12} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {customerTags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-surface-secondary border border-border rounded-md text-[10px] font-medium text-text-primary">
                {t}
              </span>
            ))}
            {customerTags.length === 0 && (
              <span className="text-[10px] text-text-muted italic">{L('No tags', 'لا توجد علامات')}</span>
            )}
          </div>
        </div>

        {/* Details Section */}
        <Section title={L('Contact Details', 'تفاصيل الاتصال')} expanded={expandedSections.details} onToggle={() => toggleSection('details')}>
          <div className="space-y-3">
            <DetailRow icon={<Phone size={14} />} label={L('Phone', 'الهاتف')} value={displayPhone} />
            <DetailRow icon={<Mail size={14} />} label={L('Email', 'البريد')} value={displayEmail} />
            <DetailRow icon={<User size={14} />} label={L('Lead Score', 'درجة العميل')} value={`${leadScore}/100`} />
          </div>
        </Section>

        {/* Orders Section */}
        <Section title={L('Recent Orders', 'الطلبات الأخيرة')} expanded={expandedSections.orders} onToggle={() => toggleSection('orders')}>
          <div className="space-y-2">
            {orders.length === 0 ? (
              <p className="text-[10px] text-text-muted italic py-2">{L('No recent orders', 'لا توجد طلبات حديثة')}</p>
            ) : (
              orders.map(o => (
                <div key={o.id} className="p-2.5 rounded-lg border border-border bg-surface-secondary hover:border-brand/30 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs text-text-primary">{o.id}</span>
                    <span className="text-[10px] text-text-muted">{o.date ? new Date(o.date).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary font-mono">{o.amount}</span>
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      o.status === 'delivered' ? 'bg-success/10 text-success border border-success/20' : 'bg-brand/10 text-brand border border-brand/20'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Conversation History */}
        <Section title={L('Previous Conversations', 'المحادثات السابقة')} expanded={expandedSections.history} onToggle={() => toggleSection('history')}>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-[10px] text-text-muted italic py-2">{L('No previous conversations', 'لا توجد محادثات سابقة')}</p>
            ) : (
              history.map((h: any) => (
                <div key={h.id} className="p-2 rounded-lg hover:bg-surface-secondary cursor-pointer group flex items-start gap-2 transition-colors">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                    h.ch === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-brand/10 text-brand'
                  }`}>
                    <MessageSquareIcon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-text-secondary capitalize">{h.ch}</span>
                      <span className="text-[9px] text-text-muted font-mono">{h.date ? new Date(h.date).toLocaleDateString() : '—'}</span>
                    </div>
                    <p className="text-xs text-text-primary truncate">{h.preview}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Internal Notes */}
        <Section title={L('Internal Notes', 'ملاحظات داخلية')} expanded={expandedSections.notes} onToggle={() => toggleSection('notes')}>
          <div className="space-y-2">
            {onAddNote && (
              <div className="mb-3">
                <textarea
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder={L('Add a note...', 'أضف ملاحظة...')}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand resize-none"
                />
                <button
                  onClick={() => {
                    if (newNoteContent.trim()) {
                      onAddNote(newNoteContent.trim())
                      setNewNoteContent('')
                    }
                  }}
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="mt-1 w-full py-1.5 text-xs font-semibold rounded-lg bg-brand text-brand-text hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {isAddingNote ? L('Adding...', 'جاري الإضافة...') : L('Add Note', 'إضافة ملاحظة')}
                </button>
              </div>
            )}
            {notes.length === 0 ? (
              <p className="text-[10px] text-text-muted italic">{L('No notes yet', 'لا توجد ملاحظات بعد')}</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="p-2 rounded-lg bg-surface-secondary border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-brand">{note.author?.name || 'Agent'}</span>
                    <span className="text-[9px] text-text-muted font-mono">{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-text-primary">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, expanded, onToggle, children }: { title: string, expanded: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl bg-surface-secondary/50 overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex justify-between items-center p-3 bg-transparent hover:bg-surface-hover transition-colors"
      >
        <span className="text-xs font-semibold text-text-primary">{title}</span>
        {expanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>
      {expanded && <div className="p-3 pt-0 border-t border-border mt-1">{children}</div>}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="text-text-muted w-4 flex justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] text-text-muted">{label}</div>
        <div className="font-medium text-text-primary truncate">{value}</div>
      </div>
    </div>
  )
}

function MessageSquareIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
