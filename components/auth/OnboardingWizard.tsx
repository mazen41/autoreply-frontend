'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import LanguageToggle from './LanguageToggle'
import WhatsAppConnect from '../channels/WhatsAppConnect'
import ShopifyConnect from '../channels/ShopifyConnect'
import WooCommerceConnect from '../channels/WooCommerceConnect'
import Select from '../ui/Select'
import { getBusinessHeaders } from '../../lib/businessContext'
import { Mail, Share2, Music, MessageCircleMore } from 'lucide-react'
import Image from 'next/image'
import BrandLoading from '../brand/BrandLoading'
import gsap from 'gsap'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  businessType: string
  businessName: string
  phone: string
  city: string
  country: string
  currency: string
  timezone: string
  workingDays: string[]
  workingFrom: string
  workingTo: string
  services: string
  faqs: { question: string; answer: string }[]
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

export const CHANNEL_ICONS: Record<string, string | React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  facebook: '/icons/facebook.svg',
  instagram: '/icons/instagram.svg',
  whatsapp: '/icons/whatsapp.svg',
  telegram: '/icons/telegram.svg',
  shopify: '/icons/shopify.svg',
  woocommerce: '/icons/woocommerce-icon.svg',
  salla: '/icons/sllla.svg',
  gmail: Mail,
  twitter: Share2,
  tiktok: Music,
  webchat: MessageCircleMore,
}

const CHANNELS = [
  { id: 'whatsapp', icon: CHANNEL_ICONS.whatsapp, label: 'WhatsApp',        color: '#25D366', note: '' },
  { id: 'salla',    icon: CHANNEL_ICONS.salla,    label: 'Salla',           color: '#00B4D8', note: '' },
  { id: 'gmail',    icon: CHANNEL_ICONS.gmail,    label: 'Gmail',           color: 'var(--brand)', note: '' },
  { id: 'instagram',icon: CHANNEL_ICONS.instagram,label: 'Instagram',       color: 'var(--brand)', note: '' },
  { id: 'facebook', icon: CHANNEL_ICONS.facebook, label: 'Facebook',        color: 'var(--brand)', note: '' },
  { id: 'shopify', icon: CHANNEL_ICONS.shopify, label: 'Shopify', color: '#95BF47', note: '' },
  { id: 'woocommerce', icon: CHANNEL_ICONS.woocommerce, label: 'WooCommerce', color: '#96588A', note: '' },
]

const COUNTRIES = ['السعودية','الإمارات','مصر','الكويت','البحرين','قطر','الأردن','المغرب','تونس','Other']
const REGIONAL_DEFAULTS: Record<string, { currency: string; timezone: string }> = {
  'السعودية': { currency: 'SAR', timezone: 'Asia/Riyadh' },
  'الإمارات': { currency: 'AED', timezone: 'Asia/Dubai' },
  'مصر': { currency: 'EGP', timezone: 'Africa/Cairo' },
  'الكويت': { currency: 'KWD', timezone: 'Asia/Kuwait' },
  'البحرين': { currency: 'BHD', timezone: 'Asia/Bahrain' },
  'قطر': { currency: 'QAR', timezone: 'Asia/Qatar' },
  'الأردن': { currency: 'JOD', timezone: 'Asia/Amman' },
  'المغرب': { currency: 'MAD', timezone: 'Africa/Casablanca' },
  'تونس': { currency: 'TND', timezone: 'Africa/Tunis' },
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total, isRTL }: { step: number; total: number; isRTL: boolean }) {
  const pct = ((step) / total) * 100
  const STEP_LABELS = isRTL ? ['نوع النشاط', 'معلومات النشاط', 'إعداد الذكاء الاصطناعي', 'ربط قناة'] : ['Business Type', 'Business Info', 'AI Tuning', 'Connect Channel']
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-3">
        <span className="text-text-tertiary">{STEP_LABELS[step - 1] || `Step ${step}`}</span>
        <span className="text-accent">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full w-full bg-white/[0.05] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--brand)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
                  ? 'var(--brand)'
                  : i + 1 === step
                    ? 'var(--brand)'
                    : 'rgba(255,255,255,0.08)',
                boxShadow: i + 1 === step ? '0 0 8px color-mix(in srgb, var(--accent) 50%, transparent)' : 'none',
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
                border: `2px solid ${selected ? 'var(--accent-outline)' : 'var(--border)'}`,
                boxShadow: selected ? '0 0 18px color-mix(in srgb, var(--accent) 10%, transparent)' : 'none',
              }}>
              <span style={{ fontSize: 32 }}>{type.icon}</span>
              <span className="text-sm font-bold leading-tight" style={{ color: selected ? 'var(--brand)' : 'var(--text-secondary)' }}>
                {isRTL ? type.ar : type.en}
              </span>
              {selected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--brand)' }}>
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
    e.currentTarget.style.borderColor = 'var(--accent-outline)'
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
            <Select
              label={isRTL ? 'الدولة' : 'Country'}
              value={data.country}
              onChange={e => {
                const country = e.target.value
                const defaults = REGIONAL_DEFAULTS[country] || { currency: 'USD', timezone: 'UTC' }
                setData({ ...data, country, currency: defaults.currency, timezone: defaults.timezone })
              }}
              searchable
              options={[
                { value: '', label: isRTL ? 'اختر الدولة' : 'Select country' },
                ...COUNTRIES.map(c => ({ value: c, label: c })),
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'العملة' : 'Currency'}
            <Select value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })} options={['SAR','EGP','AED','KWD','BHD','QAR','OMR','JOD','MAD','TND','USD','EUR','GBP'].map(code => ({ value: code, label: code }))} />
          </label>
          <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'المنطقة الزمنية' : 'Timezone'}
            <input value={data.timezone} onChange={e => setData({ ...data, timezone: e.target.value })} placeholder="Africa/Cairo" className="mt-1.5 w-full px-3 py-3 rounded-xl text-sm" style={inputStyle} />
          </label>
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
                    border: `1px solid ${on ? 'var(--accent-outline)' : 'var(--border)'}`,
                    color: on ? 'var(--brand)' : 'var(--text-tertiary)',
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
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'إلى' : 'To'}</span>
              <input type="time" value={data.workingTo}
                onChange={e => setData({ ...data, workingTo: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{ ...inputStyle, colorScheme: 'dark' }}
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
  const [uploadState, setUploadState] = useState<{ busy: boolean; message: string; error: boolean }>({ busy: false, message: '', error: false })
  const addFaq = () => setData({ ...data, faqs: [...data.faqs, { question: '', answer: '' }] })
  const removeFaq = (i: number) => setData({ ...data, faqs: data.faqs.filter((_, j) => j !== i) })
  const updateFaq = (i: number, field: 'question' | 'answer', val: string) => {
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
    e.currentTarget.style.borderColor = 'var(--accent-outline)'
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
          <label className="block text-sm font-bold mb-1" style={{ color: 'var(--brand)' }}>
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
              <label className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                {isRTL ? '❓ الأسئلة الشائعة' : '❓ Frequently Asked Questions'}
              </label>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? 'أكثر الأسئلة التي يسألها عملاؤك مع إجاباتها' : 'Questions your customers ask most, with answers'}
              </p>
            </div>
            <button type="button" onClick={addFaq}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: 'var(--accent-subtle)', color: 'var(--brand)', border: '1px solid var(--accent-outline)' }}>
              + {isRTL ? 'إضافة' : 'Add'}
            </button>
          </div>
          <div className="space-y-3">
            {data.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl p-3 relative"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => removeFaq(i)}
                  className="absolute text-[11px] transition-colors"
                  style={{ top: 10, [isRTL ? 'left' : 'right']: 10, color: 'var(--accent-outline)' }}>
                  ✕
                </button>
                <input type="text"
                  value={faq.question}
                  onChange={e => updateFaq(i, 'question', e.target.value)}
                  placeholder={isRTL ? 'السؤال...' : 'Question...'}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2 transition-all duration-200"
                  style={{ ...taStyle, borderRadius: 10 }}
                  onFocus={taFocus} onBlur={taBlur}
                />
                <input type="text"
                  value={faq.answer}
                  onChange={e => updateFaq(i, 'answer', e.target.value)}
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
                style={{ border: '2px dashed var(--accent-outline)', color: 'var(--text-tertiary)', background: 'transparent' }}>
                + {isRTL ? 'أضف سؤالاً وإجابة' : 'Add a question and answer'}
              </button>
            )}
          </div>
        </div>

        {/* Reply style */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--brand)' }}>
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
                    border: `1px solid ${selected ? 'var(--accent-outline)' : 'var(--border)'}`,
                    color: selected ? 'var(--brand)' : 'var(--text-secondary)',
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
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--brand)' }}>
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
                e.currentTarget.value = ''
                if (file.size > 10 * 1024 * 1024) {
                  setUploadState({ busy: false, message: isRTL ? 'حجم الملف يتجاوز 10 ميجابايت.' : 'The file is larger than 10 MB.', error: true })
                  return
                }
                const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
                const formData = new FormData()
                formData.append('file', file)
                setUploadState({ busy: true, message: '', error: false })
                try {
                  const api = process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io'
                  const res = await fetch(`${api}/api/onboarding/upload-knowledge`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
                    body: formData,
                  })
                  const result = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(result.message || result.error || (isRTL ? 'فشل رفع الملف. تحقق من نوع الملف وحاول مرة أخرى.' : 'Upload failed. Check the file type and try again.'))
                  setUploadState({ busy: false, message: result.duplicate ? (isRTL ? 'هذا الملف مضاف بالفعل.' : 'This file is already uploaded.') : (isRTL ? 'تم رفع الملف وإضافته إلى قاعدة المعرفة.' : 'File uploaded and added to your knowledge base.'), error: false })
                } catch (cause) {
                  setUploadState({ busy: false, message: cause instanceof Error ? cause.message : (isRTL ? 'تعذر الاتصال بالخادم لرفع الملف.' : 'Could not reach the server to upload this file.'), error: true })
                }
              }}
              className="hidden"
              id="knowledge-file-input"
            />
            <label htmlFor="knowledge-file-input" className={`cursor-pointer ${uploadState.busy ? 'pointer-events-none opacity-60' : ''}`}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{uploadState.busy ? '⏳' : '📄'}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                {uploadState.busy ? (isRTL ? 'جارٍ رفع الملف...' : 'Uploading file...') : (isRTL ? 'انقر لرفع ملف' : 'Click to upload file')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? 'PDF, XLSX, XLS (حد أقصى 10MB)' : 'PDF, XLSX, XLS (max 10MB)'}
              </div>
            </label>
          </div>
          {uploadState.message && <p role={uploadState.error ? 'alert' : 'status'} className="mt-2 text-xs leading-5" style={{ color: uploadState.error ? 'var(--error)' : 'var(--success)' }}>{uploadState.message}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── STEP 4: CONNECT CHANNEL ──────────────────────────────────────────────────
function Step4({ data, setData, isRTL }: { data: OnboardingData; setData: (d: OnboardingData) => void; isRTL: boolean }) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectedChannels, setConnectedChannels] = useState<string[]>(data.connectedChannel ? [data.connectedChannel] : [])
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showWooCommercePanel, setShowWooCommercePanel] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io'

  const getToken = () => {
    return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
  }

  const saveChannelStep = useCallback(async (channelId: string) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`${API}/api/onboarding/step4`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
        body: JSON.stringify({ connected_channel: channelId }),
      })
    } catch (e) {
      console.error('Failed to save channel step:', e)
    }
  }, [API])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API}/api/channels`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        const types = Array.isArray(result?.data) ? result.data.map((channel: { type?: string }) => channel.type).filter((type: unknown): type is string => typeof type === 'string') : []
        setConnectedChannels((current) => Array.from(new Set([...current, ...types])))
      })
      .catch(() => {})
  }, [API])

  const handleConnect = async (id: string) => {
    setConnecting(id)
    const token = getToken()

    if (id === 'whatsapp') {
      setShowWhatsAppModal(true)
    } else if (id === 'shopify') {
      setShowShopifyModal(true)
      setConnecting(null)
    } else if (id === 'woocommerce') {
      setShowWooCommercePanel(true)
      setConnecting(null)
    } else if (id === 'salla' || id === 'facebook' || id === 'instagram') {
      try {
        const endpoint = id === 'salla' ? 'salla' : 'facebook'
        const response = await fetch(`${API}/api/channels/connect/${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() },
          body: JSON.stringify({ return_to: 'onboarding' }),
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result.url) throw new Error(isRTL ? 'تعذر بدء ربط القناة. حاول مرة أخرى أو اربطها من صفحة القنوات.' : (result.message || 'Could not start channel connection'))
        window.location.assign(result.url)
      } catch (error) {
        console.error('Channel connection could not start:', error)
        setConnecting(null)
      }
    } else if (id === 'gmail') {
      try {
        const res = await fetch(`${API}/api/channels/connect/gmail?return_to=onboarding`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() },
        })
        if (res.ok) {
          const json = await res.json()
          if (json.url) window.location.assign(json.url)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setConnecting(null)
      }
    } else {
      setConnecting(null)
    }
  }

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'facebook_connected' || e.data?.type === 'instagram_connected') {
        const ch = e.data?.type === 'instagram_connected' ? 'instagram' : 'facebook'
        setData({ ...data, connectedChannel: ch })
        setConnectedChannels((current) => Array.from(new Set([...current, ch])))
        saveChannelStep(ch)
        setConnecting(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setData, data, saveChannelStep])

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
        style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-outline)' }}>
        <span style={{ color: 'var(--brand)', fontSize: 13 }}>💡</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'نوصي بربط WhatsApp أو Salla' : 'We recommend WhatsApp or Salla'}
        </span>
      </div>

      <div className="space-y-3 mb-5">
        {CHANNELS.map((ch, i) => {
          const connected = connectedChannels.includes(ch.id)
          const isConnecting = connecting === ch.id
          return (
            <motion.div key={ch.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
              style={{
                background: connected ? 'var(--accent-subtle)' : 'var(--surface)',
                border: `1px solid ${connected ? 'var(--accent-outline)' : 'var(--border)'}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center p-2"
                  style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}25` }}>
                  {typeof ch.icon === 'string' ? (
                    ch.icon.startsWith('/') ? (
                      <Image src={ch.icon} alt={ch.label} width={20} height={20} className="h-5 w-5 object-contain" />
                    ) : (
                      <span className="text-xl">{ch.icon}</span>
                    )
                  ) : ch.icon ? (
                    <ch.icon size={20} className="w-5 h-5" style={{ color: ch.color }} />
                  ) : null}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ch.label}</div>
                  {connected && (
                    <div className="text-[11px] font-bold" style={{ color: 'var(--brand)' }}>
                      ✓ {isRTL ? 'تم الربط' : 'Connected'}
                    </div>
                  )}
                </div>
              </div>

              {connected ? (
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--brand)', border: '1px solid var(--accent-outline)' }}>
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

      {showWhatsAppModal && (
        <WhatsAppConnect
          isConnected={false}
          onConnected={() => {
            setData({ ...data, connectedChannel: 'whatsapp' })
            setConnectedChannels((current) => Array.from(new Set([...current, 'whatsapp'])))
            saveChannelStep('whatsapp')
            setShowWhatsAppModal(false)
            setConnecting(null)
          }}
          onClose={() => {
            setShowWhatsAppModal(false)
            setConnecting(null)
          }}
        />
      )}

      {showShopifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <ShopifyConnect
              isConnected={false}
              onClose={() => setShowShopifyModal(false)}
              onConnect={async (shop) => {
                const response = await fetch(`${API}/api/channels/shopify/connect`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() },
                  body: JSON.stringify({ ...shop, return_to: 'onboarding' }),
                })
                const result = await response.json().catch(() => ({}))
                if (!response.ok || !result.authorization_url) throw new Error(result.error || (isRTL ? 'تعذر بدء ربط Shopify.' : 'Could not start Shopify connection.'))
                window.location.assign(result.authorization_url)
              }}
              onDisconnect={async () => setShowShopifyModal(false)}
            />
          </div>
        </div>
      )}

      {showWooCommercePanel && (
        <div className="mt-4">
          <WooCommerceConnect
            isConnected={false}
            onConnect={async (store) => {
              const response = await fetch(`${API}/api/channels/woocommerce/connect`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() },
                body: JSON.stringify({ ...store, return_to: 'onboarding' }),
              })
              const result = await response.json().catch(() => ({}))
              if (!response.ok || !result.authorization_url) throw new Error(result.error || (isRTL ? 'تعذر بدء ربط WooCommerce.' : 'Could not start WooCommerce connection.'))
              window.location.assign(result.authorization_url)
            }}
            onDisconnect={async () => setShowWooCommercePanel(false)}
          />
        </div>
      )}

      {/* Skip */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-outline)' }}>
        <p className="text-xs" style={{ color: 'var(--brand)' }}>
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
  return (
    <div className="text-center">
      {/* Checkmark animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'var(--accent-subtle)', border: '3px solid var(--accent-outline)', boxShadow: '0 0 28px color-mix(in srgb, var(--accent) 20%, transparent)' }}>
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
            border: '1px solid var(--accent-outline)',
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
          <div className="text-[10px] font-bold tracking-widest mb-3 text-center" style={{ color: 'var(--brand)' }}>
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
          style={{ background: 'var(--brand)', color: 'var(--text-primary)' }}
          whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          {isRTL ? 'اذهب إلى لوحة التحكم ←' : 'Go to Dashboard →'}
        </motion.button>

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {isRTL
            ? 'تبدأ الفترة التجريبية لمدة 14 يوماً بعد إكمال الإعداد — لا يلزم بطاقة ائتمانية الآن'
            : 'Your 14-day trial starts after setup — no credit card required now'}
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
  const reducedMotion = useHydratedReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)

  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    businessName: '',
    phone: '',
    city: '',
    country: '',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    workingDays: ['sat','sun','mon','tue','wed','thu'],
    workingFrom: '09:00',
    workingTo: '22:00',
    services: '',
    faqs: [{ question: '', answer: '' }],
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
      let channelParam = searchParams.get('channel')
      const connectedBySuccess: Record<string, string> = {
        salla_connected: 'salla', shopify_connected: 'shopify', facebook_connected: 'facebook',
        instagram_connected: 'instagram', gmail_connected: 'gmail',
      }
      const successParam = searchParams.get('success')
      channelParam = channelParam || (successParam ? connectedBySuccess[successParam] || null : null)

      if (searchParams.get('connection') === 'woocommerce' && searchParams.get('connection_state')) {
        try {
          const statusResponse = await fetch(`${API}/api/channels/woocommerce/connection-status?state=${encodeURIComponent(searchParams.get('connection_state') || '')}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
          })
          const connectionResult = await statusResponse.json().catch(() => ({}))
          if (statusResponse.ok && connectionResult.status === 'connected') channelParam = 'woocommerce'
          else setError(connectionResult.error || (isRTL ? 'تعذر إكمال ربط WooCommerce. يمكنك المحاولة مرة أخرى من هذه الخطوة.' : 'WooCommerce connection did not finish. You can retry from this step.'))
        } catch {
          setError(isRTL ? 'تعذر التحقق من ربط WooCommerce.' : 'Could not verify the WooCommerce connection.')
        }
      }

      const callbackError = searchParams.get('error')
      if (callbackError) setError(isRTL ? 'تعذر ربط القناة. حاول مرة أخرى من هذه الخطوة.' : 'The channel could not be connected. Please try again from this step.')

      try {
        const res = await fetch(`${API}/api/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (res.ok) {
          const json = await res.json()
          // If already completed, redirect to dashboard
          if (json.completed || json.wizard_dismissed || json.skipped) {
            router.replace('/dashboard/channels')
            return
          }
          // Restore business data into form
          if (json.business) {
            const b = json.business
            if (b.id) window.localStorage.setItem('naz_selected_business_id', String(b.id))
            setData(prev => ({
              ...prev,
              businessType:     b.business_type     || prev.businessType,
              businessName:     b.business_name     || prev.businessName,
              phone:            b.phone             || prev.phone,
              city:             b.city              || prev.city,
              country:          b.country           || prev.country,
              currency:         b.currency          || prev.currency,
              timezone:         b.timezone          || prev.timezone,
              workingDays:      b.working_days       || prev.workingDays,
              workingFrom:      b.working_from       || prev.workingFrom,
              workingTo:        b.working_to         || prev.workingTo,
              services:         b.services           || prev.services,
              faqs:             Array.isArray(b.faqs) && b.faqs.length
                ? b.faqs.map((faq: unknown) => {
                    const item = faq && typeof faq === 'object' ? faq as Record<string, unknown> : {}
                    return {
                      question: String(item.question ?? item.q ?? ''),
                      answer: String(item.answer ?? item.a ?? ''),
                    }
                  })
                : prev.faqs,
              replyStyle:       b.reply_style        || prev.replyStyle,
              connectedChannel: channelParam || b.connected_channel || prev.connectedChannel,
            }))
          }

          if (channelParam) {
            fetch(`${API}/api/onboarding/step4`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ connected_channel: channelParam }),
            }).catch(() => {})
          }

          // Restore step from completed steps
          const completedSteps: string[] = json.completed_steps || []
          if (channelParam || completedSteps.includes('step3') || completedSteps.includes('enable_ai')) setStep(4)
          else if (completedSteps.includes('step2') || completedSteps.includes('business_info')) setStep(3)
          else if (completedSteps.includes('step1')) setStep(2)
        }
      } catch { /* silent — start from step 1 */ }
      setLoading(false)
    }
    loadProgress()
  }, [])

  useEffect(() => {
    if (loading || reducedMotion || !rootRef.current) return
    const context = gsap.context(() => {
      gsap.fromTo('.onboarding-aside, .onboarding-card',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.72, stagger: 0.12, ease: 'power3.out', clearProps: 'all' },
      )
    }, rootRef)
    return () => context.revert()
  }, [loading, reducedMotion])

  const canProceed = () => {
    if (step === 1) return data.businessType !== ''
    if (step === 2) return data.businessName.trim() !== ''
    return true
  }

  const saveStep = async (stepNum: number) => {
    const token = getToken()
    if (!token) throw new Error(isRTL ? 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم أكمل الإعداد.' : 'Your sign-in session expired. Sign in again to continue setup.')
    const endpoints: Record<number, string> = {
      1: `${API}/api/onboarding/step1`,
      2: `${API}/api/onboarding/step2`,
      3: `${API}/api/onboarding/step3`,
      4: `${API}/api/onboarding/step4`,
    }
    const payloads: Record<number, object> = {
      1: { business_type: data.businessType },
      2: { business_name: data.businessName, phone: data.phone, city: data.city, country: data.country, currency: data.currency, timezone: data.timezone, working_days: data.workingDays, working_from: data.workingFrom, working_to: data.workingTo },
      3: { services: data.services, faqs: data.faqs, reply_style: data.replyStyle },
      4: { connected_channel: data.connectedChannel },
    }
    try {
      const res = await fetch(endpoints[stepNum], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
        body: JSON.stringify(payloads[stepNum]),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || (isRTL ? 'تعذر حفظ هذه الخطوة. تحقق من الاتصال وحاول مرة أخرى.' : 'This step could not be saved. Check your connection and try again.'))
      } else if (stepNum === 1) {
        const result = await res.json().catch(() => ({}))
        if (result.business_id) window.localStorage.setItem('naz_selected_business_id', String(result.business_id))
      }
    } catch (cause) {
      if (cause instanceof Error) throw cause
      throw new Error(isRTL ? 'تعذر الاتصال بالخادم. حاول مرة أخرى.' : 'Could not connect to the server. Please try again.')
    }
  }

  const next = async () => {
    if (!canProceed()) return
    setError('')
    setSaving(true)
    try {
      await saveStep(step)
      setDirection(1)
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isRTL ? 'تعذر حفظ هذه الخطوة. حاول مرة أخرى.' : 'This step could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const back = () => {
    setDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }

  const finish = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${getToken()}`, ...getBusinessHeaders() },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not save onboarding progress.')
      const packageId = searchParams.get('package')
      const billingCycle = searchParams.get('billing')
      if (result.setup_ready && packageId) {
        router.push(`/checkout?package=${packageId}${billingCycle ? `&billing=${billingCycle}` : ''}`)
      } else {
        router.replace('/dashboard/channels')
      }
    } catch (cause) {
        setError(isRTL ? 'تعذر حفظ تقدم الإعداد. حاول مرة أخرى.' : (cause instanceof Error ? cause.message : 'Could not save onboarding progress.'))
    } finally { setSaving(false) }
  }

  const skipOnboarding = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/onboarding/skip`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}`, ...getBusinessHeaders() },
      })
      if (!response.ok) throw new Error(isRTL ? 'تعذر تخطي الإعداد.' : 'Could not skip onboarding.')
      router.replace('/dashboard/channels')
    } catch (cause) {
      setError(isRTL ? 'تعذر تخطي الإعداد.' : (cause instanceof Error ? cause.message : 'Could not skip onboarding.'))
    } finally { setSaving(false) }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  }

  if (loading) return <BrandLoading label={isRTL ? 'جارٍ تحميل الإعداد' : 'Loading setup'} />

  return (
    <div ref={rootRef} className="min-h-screen flex items-start justify-center py-6 px-4 sm:py-10 sm:px-6 bg-[var(--background)] relative overflow-x-clip">
      {/* Deep background glows */}
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-72 h-72 rounded-full bg-[var(--brand)]/[0.06] blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl relative z-10">

        {/* Top bar: logo + step badge */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-[var(--brand)] flex items-center justify-center">
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="text-sm font-black text-white tracking-tight">NazBiz</span>
          </div>
          <div className="flex items-center gap-2">
            {step <= 4 && (
              <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-accent/10 border border-accent/20 text-accent">
                {isRTL ? `${step} / 4` : `Step ${step} of 4`}
              </div>
            )}
            <LanguageToggle />
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.28fr)] lg:gap-7">
        <aside className="onboarding-aside hidden lg:block rounded-3xl border p-7 xl:p-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-premium)' }}>
          <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <span className="text-lg font-black">N</span>
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>{isRTL ? 'ابدأ مساحة عملك' : 'SET UP YOUR WORKSPACE'}</p>
          <h1 className="mb-3 text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{isRTL ? 'خطوات قليلة، ومساحة عمل جاهزة.' : 'A few steps to a workspace that fits your business.'}</h1>
          <p className="mb-8 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'أضف معلومات نشاطك، اضبط أسلوب الرد، ثم اربط القنوات التي يستخدمها عملاؤك.' : 'Add your business details, tune the reply style, then connect the channels your customers use.'}</p>
          <div className="space-y-3">
            {(isRTL ? ['نوع النشاط', 'معلومات النشاط', 'إعداد الذكاء الاصطناعي', 'ربط قناة'] : ['Business type', 'Business details', 'AI preferences', 'Connect a channel']).map((label, index) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: index + 1 === step ? 'var(--accent-outline)' : 'var(--border)', background: index + 1 === step ? 'var(--accent-subtle)' : 'var(--surface-elevated)' }}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: index + 1 <= step ? 'var(--accent)' : 'var(--surface-hover)', color: index + 1 <= step ? 'var(--on-accent-text)' : 'var(--text-tertiary)' }}>{index + 1 < step ? '✓' : `0${index + 1}`}</span>
                <span className="text-sm font-semibold" style={{ color: index + 1 === step ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'تواصل وتجارة في مكان واحد' : 'MESSAGING AND COMMERCE, TOGETHER'}</p>
            <div className="flex flex-wrap gap-3">
              {['/icons/instagram.svg', '/icons/whatsapp.svg', '/icons/facebook.svg', '/icons/sllla.svg', '/icons/shopify.svg', '/icons/woocommerce-icon.svg'].map((src) => <span key={src} className="grid h-9 w-9 place-items-center rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}><Image src={src} alt="" aria-hidden="true" width={18} height={18} className="h-[18px] w-[18px] object-contain" /></span>)}
            </div>
          </div>
        </aside>

        {/* Main card */}
        <div className="onboarding-card rounded-3xl p-5 sm:p-7 xl:p-9 bg-[var(--surface)] border border-[var(--border)] shadow-2xl shadow-black/10 relative overflow-hidden">
          {/* inner subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-[var(--brand)]/[0.02] pointer-events-none" />

          <div className="relative">
            {step <= 4 && <ProgressBar step={step} total={4} isRTL={isRTL} />}
            {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
                    onClick={skipOnboarding}
                    disabled={saving}
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
                      ? 'linear-gradient(135deg, var(--brand), var(--brand))'
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
