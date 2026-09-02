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
}

export default function CustomerPanel({ conv, isRTL, onClose }: CustomerPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    orders: true,
    history: true,
    activity: false
  })
  const L = (en: string, ar: string) => isRTL ? ar : en

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Mock data for UI
  const orders = [
    { id: '#1042', date: '2 days ago', amount: 'SAR 450', status: 'delivered' },
    { id: '#0984', date: '1 month ago', amount: 'SAR 120', status: 'processing' }
  ]
  const history = [
    { id: 1, date: 'Oct 12', preview: 'Where is my order?', ch: 'whatsapp' },
    { id: 2, date: 'Sep 05', preview: 'Do you ship to Dubai?', ch: 'instagram' }
  ]
  const tags = ['VIP', 'Returning', 'Complained']

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--border)] overflow-y-auto w-[320px] flex-shrink-0">
      
      {/* Header Profile */}
      <div className="relative p-6 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--surface)] text-center">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-tertiary)]">
            <X size={16} />
          </button>
        )}
        
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-end)] flex items-center justify-center text-white text-2xl font-black shadow-md mb-3 border-4 border-[var(--surface)]">
          {(conv.sender_name?.charAt(0) || '?').toUpperCase()}
        </div>
        
        <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
          {conv.sender_name || 'Unknown Contact'}
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {L('Customer since', 'عميل منذ')} {new Date().getFullYear()}
        </p>

        <div className="flex justify-center gap-2 mt-4">
          <button className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
            {L('Edit Profile', 'تعديل الملف')}
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
            <Phone size={14} />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{L('Tags', 'العلامات')}</h3>
            <button className="text-[var(--accent)] p-1 hover:bg-[var(--accent-subtle)] rounded"><Plus size={12} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-[10px] font-bold text-[var(--text-primary)]">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <Section title={L('Contact Details', 'تفاصيل الاتصال')} expanded={expandedSections.details} onToggle={() => toggleSection('details')}>
          <div className="space-y-3">
            <DetailRow icon={<Phone size={14} />} label={L('Phone', 'الهاتف')} value="+966 50 123 4567" />
            <DetailRow icon={<Mail size={14} />} label={L('Email', 'البريد')} value={conv.sender_email || 'Not provided'} />
            <DetailRow icon={<MapPin size={14} />} label={L('Location', 'الموقع')} value="Riyadh, SA" />
            <DetailRow icon={<Clock size={14} />} label={L('Local Time', 'الوقت المحلي')} value={new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
          </div>
        </Section>

        {/* Orders Section */}
        <Section title={L('Recent Orders', 'الطلبات الأخيرة')} expanded={expandedSections.orders} onToggle={() => toggleSection('orders')}>
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)] cursor-pointer transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[var(--text-primary)]">{o.id}</span>
                  <span className="text-[10px] font-medium text-[var(--text-tertiary)]">{o.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">{o.amount}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            <button className="w-full py-1.5 text-xs text-[var(--accent)] font-medium hover:underline">
              {L('View all in Salla', 'عرض الكل في سلة')}
            </button>
          </div>
        </Section>

        {/* Conversation History */}
        <Section title={L('Previous Conversations', 'المحادثات السابقة')} expanded={expandedSections.history} onToggle={() => toggleSection('history')}>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] cursor-pointer group flex items-start gap-2 transition-colors">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  h.ch === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-[#C13584]/10 text-[#C13584]'
                }`}>
                  <MessageSquareIcon size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] capitalize">{h.ch}</span>
                    <span className="text-[9px] text-[var(--text-tertiary)]">{h.date}</span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] truncate">{h.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, expanded, onToggle, children }: { title: string, expanded: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--surface-elevated)] overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex justify-between items-center p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] transition-colors"
      >
        <span className="text-xs font-bold text-[var(--text-primary)]">{title}</span>
        {expanded ? <ChevronUp size={14} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={14} className="text-[var(--text-tertiary)]" />}
      </button>
      {expanded && <div className="p-3 pt-0 border-t border-[var(--border)] mt-1">{children}</div>}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="text-[var(--text-tertiary)] w-4 flex justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] text-[var(--text-tertiary)]">{label}</div>
        <div className="font-medium text-[var(--text-primary)] truncate">{value}</div>
      </div>
    </div>
  )
}

function MessageSquareIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
