'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function InputField({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none transition-all"
      />
    </div>
  )
}

function ToggleField({ label, value, onChange, description }: {
  label: string
  value: boolean
  onChange: (checked: boolean) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value}
            onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 text-accent focus:ring-accent border-white/[0.2] rounded"
          />
          <span className="text-xs font-black text-white">{label}</span>
        </div>
        {description && (
          <span className="text-xs text-text-secondary">{description}</span>
        )}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all appearance-none"
      >
        <option value="" className="bg-[#14151D]">
          {label}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-[#14151D]">
            {option.label}
          )
        ))}
      </select>
    </div>
  )
}

export default function CommentAutomationPage() {
  const { t, isRTL } = useLang()
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Form state
  const [form, setForm] = useState({
    comment_automation_enabled: false,
    instagram_comments_enabled: false,
    facebook_comments_enabled: false,
    reply_mode: 'public_comment',
    confidence_threshold: 70,
    reply_language: 'automatic',
    max_reply_length: 200,
    use_knowledge: true,
    use_products: true,
    use_prices: true,
    use_inventory: true,
    use_orders: true,
    use_shipping: true,
    use_policies: true,
    ignore_spam: true,
    ignore_offensive: true,
    ignore_competitors: true,
    blocked_keywords: '',
    emoji_enabled: true,
  })

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })
      const data = await res.json()
      if (data.business_id) {
        setBusinessId(data.business_id)
        fetchSettings(token)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSettings(token: string) {
    try {
      const res = await fetch(`${API}/api/automation/comment-settings/${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
      }})
      if (!res.ok) return
      const data = await res.json()
      setForm(data)
    } catch (e) {
      console.error(e)
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/automation/comment-settings/${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed')
      showToast(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!businessId) return (
    <div className="text-center py-24">
      <p className="text-xs text-text-secondary">
        {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
      </p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white tracking-tight">
          {isRTL ? 'أتمتة التعليقات' : 'Comment Automation'}
        </h2>
        <p className="text-sm text-text-secondary">
          {isRTL ? 'التحكم في الردود التلقائية على التعليقات لصفحات الفيسبوك ومنشورات إنستغرام' : 'Control automatic replies to comments on Facebook Pages and Instagram posts/reels'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Platform Selection */}
        <div className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04]">
          <div className="space-y-1 mb-5 pb-4 border-b border-white/[0.04]">
            <div className="text-sm font-bold text-white">{isRTL ? 'اختيار المنصة' : 'Platform Selection'}</div>
            <p className="text-[11px] text-text-secondary">
              {isRTL ? 'اختر المنصات التي ترغب في تفعيل الأتمتة عليها' : 'Select platforms to enable comment automation'}
            </p>
          </div>

          <div className="space-y-4">
            <ToggleField
              label={isRTL ? 'تفعيل أتمتة التعليقات' : 'Enable Comment Automation'}
              value={form.comment_automation_enabled}
              onChange={v => setForm({...form, comment_automation_enabled: v})}
              description={isRTL ? 'عند التفعيل، سيقوم النظام بالرد تلقائيًا على التعليقات' : 'When enabled, the system will automatically reply to comments'}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleField
                label={isRTl ? 'تعليقات إنستغرام' : 'Instagram Comments'}
                value={form.instagram_comments_enabled}
                onChange={v => setForm({...form, instagram_comments_enabled: v})}
                disabled={!form.comment_automation_enabled}
              />
              <ToggleField
                label={isRTL ? 'تعليقات فيسبوك' : 'Facebook Comments'}
                value={form.facebook_comments_enabled}
                onChange={v => setForm({...form, facebook_comments_enabled: v})}
                disabled={!form.comment_automation_enabled}
              />
            </div>
          </div>
        </div>

        {/* Reply Behavior */}
        <div className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04]">
          <div className="space-y-1 mb-5 pb-4 border-b border-white/[0.04]">
            <div className="text-sm font-bold text-white">{isRTL ? 'سلوك الرد' : 'Reply Behavior'}</div>
            <p className="text-[11px] text-text-secondary">
              {isRTL ? 'ضبط كيفية ومتى يتم الرد على التعليقات' : 'Configure how and when replies are sent to comments'}
            </p>
          </div>

          <div className="space-y-4">
            <SelectField
              label={isRTL ? 'نوع الرد' : 'Reply Type'}
              value={form.reply_mode}
              onChange={v => setForm({...form, reply_mode: v})}
              options = {[
                { value: 'public_comment', label: isRTL ? 'تعليق عام' : 'Public Comment' },
                { value: 'public_reply_private_message', label: isRTL ? 'رد عام + رسالة خاصة' : 'Public Reply + Private Message' },
                { value: 'private_message', label: isRTL ? 'رسالة خاصة فقط' : 'Private Message Only' }
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={isRTL ? 'الحد الأدنى للثقة (%)' : 'Minimum Confidence (%)'}
                type="number"
                value={form.confidence_threshold.toString()}
                onChange={v => setForm({...form, confidence_threshold: parseInt(v) || 0})}
                placeholder="70"
              />
              <InputField
                label={isRTL ? 'لغة الرد' : 'Reply Language'}
                value={form.reply_language}
                onChange={v => setForm({...form, reply_language: v})}
                list = {[
                  { label: isRTL ? 'تلقائي' : 'Automatic', value: 'automatic' },
                  { label: isRTL ? 'العربية' : 'Arabic', value: 'arabic' },
                  { label: isRTL ? 'الإنجليزية' : 'English', value: 'english' },
                  { label: isRTL ? 'نفس لغة العميل' : 'Same as Customer', value: 'same_as_customer' }
                ]}
              />
              <InputField
                label={isRTL ? 'الحد الأقصى لطول الرد' : 'Maximum Reply Length'}
                type="number"
                value={form.max_reply_length.toString()}
                onChange={v => setForm({...form, max_reply_length: parseInt(v) || 200})}
                placeholder="200"
              />
            </div>
          </div>
        </div>

        {/* AI Instructions & Knowledge Sources */}
        <div className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04]">
          <div className="space-y-1 mb-5 pb-4 border-b border-white/[0.04]">
            <div className="text-sm font-bold text-white">{isRTL ? 'التعليمات والمصادر' : 'AI Instructions & Knowledge'}</div>
            <p className="text-[11px] text-text-secondary">
              {isRTL ? 'اختر مصادر المعرفة التي سيستخدمها الذكاء الاصطناعي لإنشاء الردود' : 'Select knowledge sources for AI to generate replies'}
            </p>
          </div>

          <div className="space-y-4">
            <ToggleField
              label={isRTL ? 'استخدام قاعدة المعرفة' : 'Use Knowledge Base'}
              value={form.use_knowledge}
              onChange={v => setForm({...form, use_knowledge: v})}
            />

            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <ToggleField
                  label={isRTL ? 'المنتجات' : 'Products'}
                  value={form.use_products}
                  onChange={v => setForm({...form, use_products: v})}
                />
                <ToggleField
                  label={isRTL ? 'الأسعار' : 'Prices'}
                  value={form.use_prices}
                  onChange={v => setForm({...form, use_prices: v})}
                />
                <ToggleField
                  label={isRTL ? 'المخزون' : 'Inventory'}
                  value={form.use_inventory}
                  onChange={v => setForm({...form, use_inventory: v})}
                />
                <ToggleField
                  label={isRTL ? 'الطلبات' : 'Orders'}
                  value={form.use_orders}
                  onChange={v => setForm({...form, use_orders: v})}
                />
                <ToggleField
                  label={isRTL ? 'الشحن' : 'Shipping'}
                  value={form.use_shipping}
                  onChange={v => setForm({...form, use_shipping: v})}
                />
                <ToggleField
                  label={isRTL ? 'السياسات' : 'Policies'}
                  value={form.use_policies}
                  onChange={v => setForm({...form, use_policies: v})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Exclusions */}
        <div className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04]">
          <div className="space-y-1 mb-5 pb-4 border-b border-white/[0.04]">
            <div className="text-sm font-bold text-white">{isRTL ? 'السلامة والاستثناءات' : 'Safety & Exclusions'}</div>
            <p className="text-[11px] text-text-secondary">
              {isRTL ? 'ضبط قواعد السلامة واستثناءات معينة من الأتمتة' : 'Configure safety rules and exclude certain comments from automation'}
            </p>
          </div>

          <div className="space-y-4">
            <ToggleField
              label={isRTL ? 'تجاهل الرسائل غير المرغوب فيها' : 'Ignore Spam'}
              value={form.ignore_spam}
              onChange={v => setForm({...form, ignore_spam: v})}
            />
            <ToggleField
              label={isRTL ? 'تجاهل المحتوى المسيء' : 'Ignore Offensive'}
              value={form.ignore_offensive}
              onChange={v => setForm({...form, ignore_offensive: v})}
            />
            <ToggleField
              label={isRTL ? 'تجاهل تعليقات المنافسين' : 'Ignore Competitors'}
              value={form.ignore_competitors}
              onChange={v => setForm({...form, ignore_competitors: v})}
            />

            <div className="space-y-3">
              <InputField
                label={isRTL ? 'الكلمات المحظورة' : 'Blocked Keywords'}
                value={form.blocked_keywords}
                onChange={v => setForm({...form, blocked_keywords: v})}
                placeholder={isRTL ? 'كلمة1, كلمة2, كلمة3' : 'word1, word2, word3'}
                description={isRTL ? 'فصل الكلمات بالفاصلة' : 'Separate keywords with commas'}
              />
            </div>

            <ToggleField
              label={isRTL ? 'تفعيل الرموز التعبيرية' : 'Enable Emojis'}
              value={form.emoji_enabled}
              onChange={v => setForm({...form, emoji_enabled: v})}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-accent text-white hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {saving ? '...' : (isRTL ? 'حفظ الإعدادات' : 'Save Settings')}
          </button>
        </div>
      </form>

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border flex items-center gap-2 ${
              toast.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${toast.ok ? 'bg-emerald-400' : 'bg-red-400'} animate-ping`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}