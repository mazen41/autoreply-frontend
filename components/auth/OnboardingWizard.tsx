'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  businessType: string
  businessName: string
  phone: string
  city: string
  country: string
  workingDays: string[]
  workingFrom: string
  workingTo: string
  services: string
  faqs: { q: string; a: string }[]
  replyStyle: string
  connectedChannel: string | null
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'restaurant', icon: '🍕', ar: 'مطعم أو كافيه',      en: 'Restaurant / Café' },
  { id: 'clinic',     icon: '🏥', ar: 'عيادة أو مركز طبي', en: 'Clinic / Medical' },
  { id: 'store',      icon: '🛍️', ar: 'متجر إلكتروني',      en: 'E-commerce Store' },
  { id: 'salon',      icon: '💈', ar: 'صالون أو سبا',        en: 'Salon / Spa' },
  { id: 'consulting', icon: '🏢', ar: 'مكتب استشاري',        en: 'Consulting Office' },
  { id: 'other',      icon: '📦', ar: 'أخرى',                en: 'Other' },
]

const DAYS = [
  { id: 'sat', ar: 'سبت',    en: 'Sat' },
  { id: 'sun', ar: 'أحد',    en: 'Sun' },
  { id: 'mon', ar: 'اثنين',  en: 'Mon' },
  { id: 'tue', ar: 'ثلاثاء', en: 'Tue' },
  { id: 'wed', ar: 'أربعاء', en: 'Wed' },
  { id: 'thu', ar: 'خميس',   en: 'Thu' },
  { id: 'fri', ar: 'جمعة',   en: 'Fri' },
]

const REPLY_STYLES = [
  { id: 'friendly', ar: 'ودود وغير رسمي',      en: 'Friendly & Casual',    icon: '😊' },
  { id: 'formal',   ar: 'رسمي ومحترف',          en: 'Formal & Professional', icon: '🎩' },
  { id: 'arabic',   ar: 'بالعربية فقط',          en: 'Arabic Only',          icon: '🇸🇦' },
  { id: 'english',  ar: 'بالإنجليزية فقط',       en: 'English Only',         icon: '🇬🇧' },
  { id: 'auto',     ar: 'حسب لغة العميل',        en: 'Auto-detect Language', icon: '🌍' },
]

const CHANNELS = [
  { id: 'gmail',    icon: '📧', label: 'Gmail',           color: 'var(--accent)', note: '' },
  { id: 'instagram',icon: '📸', label: 'Instagram',       color: 'var(--accent)', note: '' },
  { id: 'facebook', icon: '🔵', label: 'Facebook',        color: 'var(--accent)', note: '' },
  { id: 'reviews',  icon: '⭐', label: 'Google Reviews',  color: 'var(--accent)', note: '' },
]

const COUNTRIES = ['السعودية','الإمارات','مصر','الكويت','البحرين','قطر','الأردن','المغرب','تونس','Other']

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step) / total) * 100
  const STEP_LABELS = ['Business Type', 'Business Info', 'AI Tuning', 'Connect Channel']
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-3">
        <span className="text-text-tertiary">{STEP_LABELS[step - 1] || `Step ${step}`}</span>
        <span className="text-accent">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full w-full bg-white/[0.05] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #0E7AFE, #8B3FFB)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as any }}
        />
      </div>
      <div className="flex items-center justify-between mt-2.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex items-center justify-center">
            <div
              className="rounded-full transition-all duration-400"
              style={{
                width: i + 1 <= step ? 8 : 5,
                height: i + 1 <= step ? 8 : 5,
                background: i + 1 < step
                  ? '#8B3FFB'
                  : i + 1 === step
                    ? '#0E7AFE'
                    : 'rgba(255,255,255,0.08)',
                boxShadow: i + 1 === step ? '0 0 8px rgba(14,122,254,0.5)' : 'none',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── STEP 1: BUSINESS TYPE ────────────────────────────────────────────────────
function Step1({ data, setData, isRTL }: { data: OnboardingData; setData: (d: OnboardingData) => void; isRTL: boolean }) {
  return (
    <div>
      <h2 className="font-black mb-2" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
        {isRTL ? 'ما نوع نشاطك التجاري؟' : 'What type of business?'}
      </h2>
      <p className="text-sm mb-7" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'يساعدنا هذا في ضبط الذكاء الاصطناعي لأسلوب عملك' : 'This helps us tune the AI to your business style'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BUSINESS_TYPES.map((type, i) => {
          const selected = data.businessType === type.id
          return (
            <motion.button key={type.id}
              type="button"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setData({ ...data, businessType: type.id })}
              className="flex flex-col items-center gap-2.5 p-5 rounded-2xl text-center transition-all duration-200"
              style={{
                background: selected ? 'var(--accent-subtle)' : 'var(--surface)',
                border: `2px solid ${selected ? 'var(--accent-focus)' : 'var(--border)'}`,
                boxShadow: selected ? '0 0 24px var(--accent-subtle)' : 'none',
              }}>
              <span style={{ fontSize: 32 }}>{type.icon}</span>
              <span className="text-sm font-bold leading-tight" style={{ color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {isRTL ? type.ar : type.en}
              </span>
              {selected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 900 }}>✓</span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── STEP 2: BUSINESS INFO ────────────────────────────────────────────────────
function Step2({ data, setData, isRTL }: { data: OnboardingData; setData: (d: OnboardingData) => void; isRTL: boolean }) {
  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent-focus)'
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.boxShadow = 'none'
  }

  const toggleDay = (id: string) => {
    const days = data.workingDays.includes(id)
      ? data.workingDays.filter(d => d !== id)
      : [...data.workingDays, id]
    setData({ ...data, workingDays: days })
  }

  return (
    <div>
      <h2 className="font-black mb-2" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
        {isRTL ? 'معلومات نشاطك التجاري' : 'Your Business Info'}
      </h2>
      <p className="text-sm mb-7" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'يستخدم الذكاء الاصطناعي هذه البيانات للرد بشكل صحيح' : 'The AI uses this to reply accurately'}
      </p>

      <div className="space-y-4">
        {/* Business name */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'اسم النشاط التجاري *' : 'Business Name *'}
          </label>
          <input type="text" required
            value={data.businessName}
            onChange={e => setData({ ...data, businessName: e.target.value })}
            placeholder={isRTL ? 'مثال: مطعم الأصيل' : 'e.g. Al-Aseel Restaurant'}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
            style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
          />
        </div>

        {/* Phone + country row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'رقم الجوال' : 'Phone Number'}
            </label>
            <input type="tel"
              value={data.phone}
              onChange={e => setData({ ...data, phone: e.target.value })}
              placeholder="+966 5xx xxx xxxx"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'الدولة' : 'Country'}
            </label>
            <select
              value={data.country}
              onChange={e => setData({ ...data, country: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={{ ...inputStyle, appearance: 'none' as any }}
              onFocus={inputFocus} onBlur={inputBlur}>
              <option value="">{isRTL ? 'اختر الدولة' : 'Select country'}</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'المدينة' : 'City'}
          </label>
          <input type="text"
            value={data.city}
            onChange={e => setData({ ...data, city: e.target.value })}
            placeholder={isRTL ? 'الرياض' : 'Riyadh'}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
            style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
          />
        </div>

        {/* Working days */}
        <div>
          <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'أيام العمل' : 'Working Days'}
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const on = data.workingDays.includes(day.id)
              return (
                <button key={day.id} type="button" onClick={() => toggleDay(day.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{
                    background: on ? 'var(--accent-subtle)' : 'var(--surface)',
                    border: `1px solid ${on ? 'var(--accent-focus)' : 'var(--border)'}`,
                    color: on ? 'var(--accent)' : 'var(--text-tertiary)',
                  }}>
                  {isRTL ? day.ar : day.en}
                </button>
              )
            })}
          </div>
        </div>

        {/* Working hours */}
        <div>
          <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'ساعات العمل' : 'Working Hours'}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'من' : 'From'}</span>
              <input type="time" value={data.workingFrom}
                onChange={e => setData({ ...data, workingFrom: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{ ...inputStyle, colorScheme: 'dark' } as any}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'إلى' : 'To'}</span>
              <input type="time" value={data.workingTo}
                onChange={e => setData({ ...data, workingTo: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{ ...inputStyle, colorScheme: 'dark' } as any}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STEP 3: AI BRAIN ─────────────────────────────────────────────────────────
function Step3({ data, setData, isRTL }: { data: OnboardingData; setData: (d: OnboardingData) => void; isRTL: boolean }) {
  const addFaq = () => setData({ ...data, faqs: [...data.faqs, { q: '', a: '' }] })
  const removeFaq = (i: number) => setData({ ...data, faqs: data.faqs.filter((_, j) => j !== i) })
  const updateFaq = (i: number, field: 'q' | 'a', val: string) => {
    const faqs = [...data.faqs]
    faqs[i] = { ...faqs[i], [field]: val }
    setData({ ...data, faqs })
  }

  const taStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'none' as const,
  }
  const taFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent-focus)'
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
  }
  const taBlur = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div>
      <h2 className="font-black mb-1" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
        {isRTL ? 'عقل الذكاء الاصطناعي 🧠' : 'Train the AI Brain 🧠'}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'كلما أضفت تفاصيل أكثر، كلما كانت الردود أذكى وأدق' : 'The more details you add, the smarter the replies'}
      </p>

      <div className="space-y-5">
        {/* Services */}
        <div>
          <label className="block text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>
            {isRTL ? '📋 خدماتك أو منتجاتك' : '📋 Your Services / Products'}
          </label>
          <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? 'مثال: برجر كلاسيك 35 ريال، بيتزا مارجريتا 45 ريال، توصيل مجاني فوق 80 ريال' : 'e.g. Classic Burger $12, Margherita Pizza $15, Free delivery over $30'}
          </p>
          <textarea rows={4}
            value={data.services}
            onChange={e => setData({ ...data, services: e.target.value })}
            placeholder={isRTL ? 'اكتب خدماتك ومنتجاتك وأسعارها هنا...' : 'List your services, products, and prices here...'}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
            style={taStyle} onFocus={taFocus} onBlur={taBlur}
          />
        </div>

        {/* FAQs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {isRTL ? '❓ الأسئلة الشائعة' : '❓ Frequently Asked Questions'}
              </label>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? 'أكثر الأسئلة التي يسألها عملاؤك مع إجاباتها' : 'Questions your customers ask most, with answers'}
              </p>
            </div>
            <button type="button" onClick={addFaq}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
              + {isRTL ? 'إضافة' : 'Add'}
            </button>
          </div>
          <div className="space-y-3">
            {data.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl p-3 relative"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => removeFaq(i)}
                  className="absolute text-[11px] transition-colors"
                  style={{ top: 10, [isRTL ? 'left' : 'right']: 10, color: 'var(--accent-focus)' }}>
                  ✕
                </button>
                <input type="text"
                  value={faq.q}
                  onChange={e => updateFaq(i, 'q', e.target.value)}
                  placeholder={isRTL ? 'السؤال...' : 'Question...'}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2 transition-all duration-200"
                  style={{ ...taStyle, borderRadius: 10 }}
                  onFocus={taFocus} onBlur={taBlur}
                />
                <input type="text"
                  value={faq.a}
                  onChange={e => updateFaq(i, 'a', e.target.value)}
                  placeholder={isRTL ? 'الإجابة...' : 'Answer...'}
                  className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{ ...taStyle, borderRadius: 10 }}
                  onFocus={taFocus} onBlur={taBlur}
                />
              </div>
            ))}
            {data.faqs.length === 0 && (
              <button type="button" onClick={addFaq}
                className="w-full py-4 rounded-xl text-sm border-dashed transition-all duration-200"
                style={{ border: '2px dashed var(--accent-focus)', color: 'var(--text-tertiary)', background: 'transparent' }}>
                + {isRTL ? 'أضف سؤالاً وإجابة' : 'Add a question and answer'}
              </button>
            )}
          </div>
        </div>

        {/* Reply style */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>
            {isRTL ? '💬 أسلوب الرد المطلوب' : '💬 Reply Style'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REPLY_STYLES.map(style => {
              const selected = data.replyStyle === style.id
              return (
                <button key={style.id} type="button"
                  onClick={() => setData({ ...data, replyStyle: style.id })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-start transition-all duration-200"
                  style={{
                    background: selected ? 'var(--accent-subtle)' : 'var(--surface)',
                    border: `1px solid ${selected ? 'var(--accent-focus)' : 'var(--border)'}`,
                    color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                  <span style={{ fontSize: 18 }}>{style.icon}</span>
                  <span className="font-semibold">{isRTL ? style.ar : style.en}</span>
                  {selected && <span className="mr-auto text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Knowledge file upload */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>
            {isRTL ? '📎 رفع ملف معرفة (اختياري)' : '📎 Upload Knowledge File (Optional)'}
          </label>
          <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? 'PDF أو Excel - سنستخرج النص لتدريب الذكاء الاصطناعي' : 'PDF or Excel - we\'ll extract text to train the AI'}
          </p>
          <div className="border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
            }}>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
                const formData = new FormData()
                formData.append('file', file)
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/upload-knowledge`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                  })
                  if (res.ok) {
                    alert(isRTL ? 'تم رفع الملف بنجاح' : 'File uploaded successfully')
                  } else {
                    alert(isRTL ? 'فشل رفع الملف' : 'Failed to upload file')
                  }
                } catch (err) {
                  alert(isRTL ? 'حدث خطأ أثناء الرفع' : 'Error uploading file')
                }
              }}
              className="hidden"
              id="knowledge-file-input"
            />
            <label htmlFor="knowledge-file-input" className="cursor-pointer">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'انقر لرفع ملف' : 'Click to upload file'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? 'PDF, XLSX, XLS (حد أقصى 10MB)' : 'PDF, XLSX, XLS (max 10MB)'}
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STEP 4: CONNECT CHANNEL ──────────────────────────────────────────────────
function Step4({ data, setData, isRTL }: { data: OnboardingData; setData: (d: OnboardingData) => void; isRTL: boolean }) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = (id: string) => {
    setConnecting(id)
    if (id === 'facebook' || id === 'instagram') {
      const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
      const token = match ? decodeURIComponent(match[1]) : ''
      const width = 600, height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/channels/connect/facebook?token=${token}&redirect=popup`, 'connect_facebook', `width=${width},height=${height},left=${left},top=${top}`)
    } else {
      setTimeout(() => {
        setData({ ...data, connectedChannel: id })
        setConnecting(null)
      }, 1800)
    }
  }

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'facebook_connected') {
        // Here we just hardcode setting the channel to facebook, since the API was hit successfully.
        setData({ ...data, connectedChannel: 'facebook' })
        setConnecting(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setData, data])

  return (
    <div>
      <h2 className="font-black mb-1" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
        {isRTL ? 'ربط أول قناة 🔗' : 'Connect Your First Channel 🔗'}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'لن يعمل البوت بدون ربط قناة واحدة على الأقل' : 'The AI won\'t work without at least one connected channel'}
      </p>

      {/* Recommended */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
        style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>💡</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'نوصي بربط Gmail أولاً — الأسهل والأسرع' : 'We recommend Gmail first — easiest to connect'}
        </span>
      </div>

      <div className="space-y-3 mb-5">
        {CHANNELS.map((ch, i) => {
          const connected = data.connectedChannel === ch.id
          const isConnecting = connecting === ch.id
          return (
            <motion.div key={ch.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
              style={{
                background: connected ? 'var(--accent-subtle)' : 'var(--surface)',
                border: `1px solid ${connected ? 'var(--accent-focus)' : 'var(--border)'}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}25` }}>
                  {ch.icon}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ch.label}</div>
                  {connected && (
                    <div className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                      ✓ {isRTL ? 'تم الربط' : 'Connected'}
                    </div>
                  )}
                </div>
              </div>

              {connected ? (
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                  ✓ {isRTL ? 'مربوط' : 'Connected'}
                </div>
              ) : (
                <button type="button" onClick={() => handleConnect(ch.id)}
                  disabled={!!connecting}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200"
                  style={{
                    background: 'var(--border)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}>
                  {isConnecting && (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                  {isConnecting ? (isRTL ? 'جاري الربط...' : 'Connecting...') : (isRTL ? 'ربط' : 'Connect')}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Skip */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
        <p className="text-xs" style={{ color: 'var(--accent)' }}>
          ⚠️ {isRTL
            ? 'يمكنك تخطي هذه الخطوة الآن وربط قناة لاحقاً من لوحة التحكم، لكن لن يعمل البوت حتى ذلك الحين.'
            : 'You can skip this step and connect a channel later from the dashboard, but the bot won\'t work until then.'}
        </p>
      </div>
    </div>
  )
}

// ─── CELEBRATION ──────────────────────────────────────────────────────────────
function Celebration({ data, isRTL, onGo }: { data: OnboardingData; isRTL: boolean; onGo: () => void }) {
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const trialStr = trialEnd.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="text-center">
      {/* Checkmark animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'var(--accent-subtle)', border: '3px solid var(--accent-focus)', boxShadow: '0 0 40px var(--accent-focus)' }}>
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          style={{ fontSize: 36 }}>🎉</motion.span>
      </motion.div>

      {/* Rings */}
      {[1,2,3].map(i => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 80 + i * 40, height: 80 + i * 40,
            border: '1px solid var(--accent-focus)',
            left: '50%', top: 80,
            transform: 'translate(-50%,-50%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="font-black mb-2" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          {isRTL ? '🎉 موظفك الذكي جاهز!' : '🎉 Your AI is ready!'}
        </h2>
        <p className="text-base mb-8" style={{ color: 'var(--text-tertiary)' }}>
          {isRTL ? 'كل شيء تم إعداده بنجاح. الآن دعه يعمل.' : 'Everything is set up. Now let it work.'}
        </p>

        {/* Summary */}
        <div className="glass rounded-2xl p-5 mb-6 text-start"
          style={{ background: 'var(--surface)', border: '1px solid var(--accent-subtle)' }}>
          <div className="text-[10px] font-bold tracking-widest mb-3 text-center" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'ملخص الإعداد' : 'SETUP SUMMARY'}
          </div>
          {[
            { icon: '🏢', label: isRTL ? 'اسم النشاط' : 'Business Name', val: data.businessName || (isRTL ? 'غير محدد' : 'Not set') },
            { icon: '🤖', label: isRTL ? 'نوع النشاط' : 'Business Type', val: BUSINESS_TYPES.find(t => t.id === data.businessType)?.[isRTL ? 'ar' : 'en'] || '—' },
            { icon: '🔗', label: isRTL ? 'القناة المربوطة' : 'Connected Channel', val: data.connectedChannel ? CHANNELS.find(c => c.id === data.connectedChannel)?.label ?? '—' : (isRTL ? 'لم يتم الربط بعد' : 'Not connected yet') },
            { icon: '💬', label: isRTL ? 'أسلوب الرد' : 'Reply Style', val: REPLY_STYLES.find(s => s.id === data.replyStyle)?.[isRTL ? 'ar' : 'en'] || '—' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 3 ? '1px solid var(--divider)' : 'none' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)', minWidth: 100 }}>{item.label}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.val}</span>
            </div>
          ))}
        </div>

        <motion.button onClick={onGo}
          className="w-full py-4 rounded-xl font-black text-base mb-4"
          style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
          whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          {isRTL ? 'اذهب إلى لوحة التحكم ←' : 'Go to Dashboard →'}
        </motion.button>

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {isRTL
            ? `تجربتك المجانية تنتهي في ${trialStr} — لا يلزم بطاقة ائتمانية الآن`
            : `Your free trial ends on ${trialStr} — no credit card required now`}
        </p>
      </motion.div>
    </div>
  )
}

// ─── MAIN WIZARD ──────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1–4 + 5 = celebration
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    businessName: '',
    phone: '',
    city: '',
    country: '',
    workingDays: ['sat','sun','mon','tue','wed','thu'],
    workingFrom: '09:00',
    workingTo: '22:00',
    services: '',
    faqs: [{ q: '', a: '' }],
    replyStyle: 'auto',
    connectedChannel: null,
  })

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io'

  const getToken = () => {
    return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
  }

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const token = getToken()
      if (!token) { setLoading(false); return }
      try {
        const res = await fetch(`${API}/api/onboarding`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (res.ok) {
          const json = await res.json()
          // If already completed, redirect to dashboard
          if (json.completed) {
            router.replace('/dashboard')
            return
          }
          // Restore business data into form
          if (json.business) {
            const b = json.business
            setData(prev => ({
              ...prev,
              businessType:     b.business_type     || prev.businessType,
              businessName:     b.business_name     || prev.businessName,
              phone:            b.phone             || prev.phone,
              city:             b.city              || prev.city,
              country:          b.country           || prev.country,
              workingDays:      b.working_days       || prev.workingDays,
              workingFrom:      b.working_from       || prev.workingFrom,
              workingTo:        b.working_to         || prev.workingTo,
              services:         b.services           || prev.services,
              faqs:             b.faqs?.length       ? b.faqs : prev.faqs,
              replyStyle:       b.reply_style        || prev.replyStyle,
            }))
          }
          // Restore step from completed steps
          const completedSteps: string[] = json.completed_steps || []
          if (completedSteps.includes('step3') || completedSteps.includes('enable_ai')) setStep(4)
          else if (completedSteps.includes('step2') || completedSteps.includes('business_info')) setStep(3)
          else if (completedSteps.includes('step1')) setStep(2)
        }
      } catch { /* silent — start from step 1 */ }
      setLoading(false)
    }
    loadProgress()
  }, [])

  const canProceed = () => {
    if (step === 1) return data.businessType !== ''
    if (step === 2) return data.businessName.trim() !== ''
    return true
  }

  const saveStep = async (stepNum: number) => {
    const token = getToken()
    if (!token) return
    const endpoints: Record<number, string> = {
      1: `${API}/api/onboarding/step1`,
      2: `${API}/api/onboarding/step2`,
      3: `${API}/api/onboarding/step3`,
      4: `${API}/api/onboarding/step4`,
    }
    const payloads: Record<number, object> = {
      1: { business_type: data.businessType },
      2: { business_name: data.businessName, phone: data.phone, city: data.city, country: data.country, working_days: data.workingDays, working_from: data.workingFrom, working_to: data.workingTo },
      3: { services: data.services, faqs: data.faqs, reply_style: data.replyStyle },
      4: { connected_channel: data.connectedChannel },
    }
    try {
      const res = await fetch(endpoints[stepNum], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payloads[stepNum]),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(`Step ${stepNum} save failed:`, err)
      }
    } catch (e) {
      console.error(`Step ${stepNum} network error:`, e)
    }
  }

  const next = async () => {
    if (!canProceed()) return
    setSaving(true)
    await saveStep(step)
    setSaving(false)
    setDirection(1)
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  const back = () => {
    setDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }

  const finish = async () => {
    setSaving(true)
    try {
      await fetch(`${API}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
      })
    } catch { /* silent */ }
    setSaving(false)

    const packageId = searchParams.get('package')
    const billingCycle = searchParams.get('billing')

    if (packageId) {
      window.location.href = `/checkout?package=${packageId}${billingCycle ? `&billing=${billingCycle}` : ''}`
    } else {
      window.location.href = '/dashboard'
    }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#04061A]">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-4 bg-[#04061A] relative overflow-hidden">
      {/* Deep background glows */}
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#8B3FFB]/[0.06] blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">

        {/* Top bar: logo + step badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-[#8B3FFB] flex items-center justify-center">
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="text-sm font-black text-white tracking-tight">NazBiz</span>
          </div>
          {step <= 4 && (
            <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-accent/10 border border-accent/20 text-accent">
              {isRTL ? `${step} / 4` : `Step ${step} of 4`}
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="rounded-3xl p-7 bg-[#0C0E1E] border border-white/[0.06] shadow-2xl shadow-black/40 relative overflow-hidden">
          {/* inner subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-[#8B3FFB]/[0.02] pointer-events-none" />

          <div className="relative">
            {step <= 4 && <ProgressBar step={step} total={4} />}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as any }}
              >
                {step === 1 && <Step1 data={data} setData={setData} isRTL={isRTL} />}
                {step === 2 && <Step2 data={data} setData={setData} isRTL={isRTL} />}
                {step === 3 && <Step3 data={data} setData={setData} isRTL={isRTL} />}
                {step === 4 && <Step4 data={data} setData={setData} isRTL={isRTL} />}
                {step === 5 && <Celebration data={data} isRTL={isRTL} onGo={finish} />}
              </motion.div>
            </AnimatePresence>

            {step <= 4 && (
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/[0.04]">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] text-text-secondary hover:text-white transition-all"
                  >
                    {isRTL ? '← رجوع' : '← Back'}
                  </button>
                )}

                {step === 4 && (
                  <button
                    type="button"
                    onClick={next}
                    className="px-3 py-3 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {isRTL ? 'تخطي' : 'Skip'}
                  </button>
                )}

                <motion.button
                  type="button"
                  onClick={next}
                  disabled={!canProceed() || saving}
                  className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: canProceed()
                      ? 'linear-gradient(135deg, #0E7AFE, #8B3FFB)'
                      : 'rgba(255,255,255,0.04)',
                    color: canProceed() ? '#fff' : 'rgba(255,255,255,0.2)',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    boxShadow: canProceed() ? '0 6px 20px -6px rgba(14,122,254,0.4)' : 'none',
                  }}
                  whileHover={canProceed() ? { scale: 1.015 } : {}}
                  whileTap={canProceed() ? { scale: 0.985 } : {}}
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {saving
                    ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                    : step === 4
                      ? (isRTL ? 'إنهاء الإعداد ✓' : 'Complete Setup ✓')
                      : (isRTL ? 'التالي ←' : 'Next →')
                  }
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {step <= 4 && (
          <p className="text-center text-[10px] text-text-tertiary mt-5">
            {isRTL
              ? 'يمكنك تعديل هذه الإعدادات في أي وقت من لوحة التحكم'
              : 'You can update these settings anytime from your dashboard'}
          </p>
        )}
      </div>
    </div>
  )
}
