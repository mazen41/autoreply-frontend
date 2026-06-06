'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const CONVS = [
  { id: 1, ch: '📸', chColor: '#E1306C', name: 'أحمد الشمري', preview: 'متى تفتحون؟ أريد حجز طاولة لـ 4 أشخاص الجمعة', time: '2د', status: 'alert', unread: true,
    messages: [
      { from: 'customer', text: 'السلام عليكم، متى تفتحون؟', time: '10:02' },
      { from: 'ai', text: 'وعليكم السلام! نفتح من الساعة 12 ظهراً حتى 11 مساءً يومياً. كيف يمكنني مساعدتك؟', time: '10:02' },
      { from: 'customer', text: 'أريد حجز طاولة لـ 4 أشخاص الجمعة القادمة', time: '10:03' },
    ]
  },
  { id: 2, ch: '📧', chColor: '#EA4335', name: 'sara@gmail.com', preview: 'Do you deliver to Riyadh neighborhoods?', time: '15د', status: 'draft', unread: true,
    messages: [
      { from: 'customer', text: 'Hi, do you deliver to Riyadh neighborhoods?', time: '09:45' },
      { from: 'ai', text: '[Draft] Yes, we deliver to most Riyadh neighborhoods. Delivery fee starts at 15 SAR. What area are you in?', time: '09:45', draft: true },
    ]
  },
  { id: 3, ch: '🔵', chColor: '#1877F2', name: 'محمد العتيبي', preview: 'شكراً جزيلاً على الخدمة الممتازة وسرعة التوصيل', time: '1س', status: 'auto', unread: false,
    messages: [
      { from: 'customer', text: 'شكراً جزيلاً على الخدمة الممتازة وسرعة التوصيل!', time: '08:30' },
      { from: 'ai', text: 'شكراً لك على كلماتك الطيبة! يسعدنا دائماً خدمتك. نتطلع لزيارتك القادمة 😊', time: '08:30' },
    ]
  },
  { id: 4, ch: '📸', chColor: '#E1306C', name: 'Lina Hassan', preview: 'What are your prices for catering services?', time: '2س', status: 'auto', unread: false,
    messages: [
      { from: 'customer', text: 'Hi! What are your prices for catering services?', time: '07:15' },
      { from: 'ai', text: 'Hello Lina! Our catering packages start from 3,500 SAR for up to 50 guests. Would you like more details about what\'s included?', time: '07:15' },
      { from: 'customer', text: 'Yes please, we have an event for about 80 people', time: '07:17' },
      { from: 'ai', text: 'For 80 guests, our standard package is 5,500 SAR and includes full setup, service staff, and cleanup. Can I arrange a consultation call?', time: '07:17' },
    ]
  },
  { id: 5, ch: '📧', chColor: '#EA4335', name: 'info@example.com', preview: 'بخصوص الطلب رقم #1204 الذي تم إلغاؤه', time: 'أمس', status: 'auto', unread: false,
    messages: [
      { from: 'customer', text: 'مرحباً، بخصوص الطلب رقم #1204 الذي تم إلغاؤه، متى سيتم استرداد المبلغ؟', time: 'أمس' },
      { from: 'ai', text: 'مرحباً! يُعاد المبلغ خلال 3-5 أيام عمل. إذا مضى أكثر من ذلك فتواصل معنا مباشرة وسنتابع الأمر فوراً.', time: 'أمس' },
    ]
  },
]

const FILTERS = [
  { id: 'all',   ar: 'الكل',         en: 'All' },
  { id: 'alert', ar: 'تنبيه 🔴',     en: 'Alert 🔴' },
  { id: 'draft', ar: 'مسودة',        en: 'Draft' },
  { id: 'ig',    ar: 'Instagram',    en: 'Instagram' },
  { id: 'gmail', ar: 'Gmail',        en: 'Gmail' },
]

const STATUS_MAP: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  auto:  { label: 'تم الرد', labelEn: 'Replied', color: '#C6FF00', bg: 'rgba(198,255,0,0.1)' },
  draft: { label: 'مسودة',   labelEn: 'Draft',   color: '#FFA500', bg: 'rgba(255,165,0,0.1)' },
  alert: { label: 'تنبيه',   labelEn: 'Alert',   color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
}

export default function InboxPage() {
  const { isRTL } = useLang()
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(CONVS[0].id)
  const [reply, setReply] = useState('')

  const filtered = CONVS.filter(c => {
    const matchFilter = activeFilter === 'all' || c.status === activeFilter ||
      (activeFilter === 'ig' && c.ch === '📸') || (activeFilter === 'gmail' && c.ch === '📧')
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.preview.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const selected = CONVS.find(c => c.id === selectedId)

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Left: Conversation List ── */}
      <div className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,9,0.98)' }}>

        {/* Search */}
        <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث...' : 'Search...'}
              className="w-full px-4 py-2.5 rounded-xl text-sm input-os"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#F5F5F5', outline: 'none' }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 p-3 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: activeFilter === f.id ? 'rgba(198,255,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeFilter === f.id ? 'rgba(198,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: activeFilter === f.id ? '#C6FF00' : 'rgba(255,255,255,0.45)',
              }}>
              {isRTL ? f.ar : f.en}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <span style={{ fontSize: 40 }}>📭</span>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {isRTL ? 'لا توجد محادثات' : 'No conversations'}
              </p>
            </div>
          ) : (
            filtered.map(c => {
              const s = STATUS_MAP[c.status]
              const isActive = selectedId === c.id
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-start transition-all duration-150 relative"
                  style={{
                    background: isActive ? 'rgba(198,255,0,0.05)' : 'transparent',
                    borderLeft: isActive ? '2px solid #C6FF00' : '2px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                  <div className="relative flex-shrink-0">
                    <span className="text-xl">{c.ch}</span>
                    {c.unread && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: '#F5F5F5', fontWeight: c.unread ? 700 : 500 }}>{c.name}</span>
                      <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.time}</span>
                    </div>
                    <p className="text-xs truncate mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{c.preview}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}>
                      {isRTL ? s.label : s.labelEn}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: Conversation Detail ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span style={{ fontSize: 48 }}>💬</span>
              <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isRTL ? 'اختر محادثة' : 'Select a conversation'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,9,0.8)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selected.ch}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#F5F5F5' }}>{selected.name}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isRTL ? 'تواصل 3 مرات من قبل' : 'Contacted 3 times before'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { ar: 'تدخل يدوي', en: 'Take Over', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.25)' },
                  { ar: 'وضع المسودة', en: 'Draft Mode', color: '#FFA500', bg: 'rgba(255,165,0,0.07)', border: 'rgba(255,165,0,0.2)' },
                  { ar: 'إغلاق', en: 'Close', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
                ].map((btn, i) => (
                  <button key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                    style={{ background: btn.bg, border: `1px solid ${btn.border}`, color: btn.color }}>
                    {isRTL ? btn.ar : btn.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'customer' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')} gap-3`}>
                  {msg.from !== 'customer' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: 'rgba(198,255,0,0.1)', border: '1px solid rgba(198,255,0,0.2)' }}>
                      <span style={{ fontSize: 12 }}>⚡</span>
                    </div>
                  )}
                  <div className="max-w-xs md:max-w-md">
                    <div className="px-4 py-3 rounded-2xl text-sm"
                      style={{
                        background: msg.from === 'customer'
                          ? 'rgba(255,255,255,0.06)'
                          : (msg as any).draft
                            ? 'rgba(255,165,0,0.1)'
                            : 'rgba(198,255,0,0.08)',
                        border: msg.from === 'customer'
                          ? '1px solid rgba(255,255,255,0.07)'
                          : (msg as any).draft
                            ? '1px solid rgba(255,165,0,0.2)'
                            : '1px solid rgba(198,255,0,0.15)',
                        color: '#F5F5F5',
                      }}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      {msg.from !== 'customer' && !((msg as any).draft) && (
                        <span className="text-[10px]" style={{ color: 'rgba(198,255,0,0.5)' }}>⚡ {isRTL ? 'ذكاء اصطناعي' : 'AI reply'}</span>
                      )}
                      {(msg as any).draft && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,165,0,0.1)', color: '#FFA500' }}>
                          {isRTL ? 'مسودة' : 'Draft'}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,9,0.8)' }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'اكتب رداً...' : 'Write a reply...'}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none input-os"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#F5F5F5', outline: 'none' }}
              />
              <div className="flex items-center gap-2 mt-2">
                <button className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050505' }}>
                  {isRTL ? '↩ إرسال يدوياً' : '↩ Send Manually'}
                </button>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{ background: 'rgba(198,255,0,0.06)', border: '1px solid rgba(198,255,0,0.2)', color: '#C6FF00' }}>
                  {isRTL ? '⚡ اقترح رد' : '⚡ Suggest Reply'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
