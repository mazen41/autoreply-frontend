'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { LightningIcon, ContentIcon, PlusIcon } from '../../../components/ui/DashboardIcons'

const STATUS_COLORS: Record<string, { label: string; en: string; color: string; bg: string }> = {
  scheduled: { label: 'مجدول',    en: 'Scheduled',  color: '#7DF9FF', bg: 'rgba(125,249,255,0.1)' },
  published:  { label: 'نُشر',    en: 'Published',  color: '#C6FF00', bg: 'rgba(198,255,0,0.1)' },
  draft:      { label: 'مسودة',   en: 'Draft',      color: '#FFA500', bg: 'rgba(255,165,0,0.1)' },
}

const AUTO_TYPES = [
  { id: 'morning',  ar: 'تحية الصباح اليومية',         en: 'Daily morning greeting',           on: true },
  { id: 'evening',  ar: 'منشور مساء الخير',             en: 'Good evening post',                on: true },
  { id: 'friday',   ar: 'منشور جمعة مباركة',            en: 'Friday blessing post',             on: true },
  { id: 'national', ar: 'تهنئة المناسبات الوطنية',     en: 'National occasions greeting',      on: false },
  { id: 'eid',      ar: 'تهنئة الأعياد الدينية',        en: 'Religious holidays greeting',      on: false },
]

export default function ContentPage() {
  const { isRTL } = useLang()
  const [tab, setTab] = useState<'scheduled' | 'settings' | 'generate'>('scheduled')
  const [autoTypes, setAutoTypes] = useState(AUTO_TYPES)
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('both')
  const [style, setStyle] = useState('friendly')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getToken = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setPosts(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => setAutoTypes(t => t.map(x => x.id === id ? { ...x, on: !x.on } : x))

  const generate = () => {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 2000)
  }

  const TABS = [
    { id: 'scheduled', ar: 'المنشورات المجدولة',  en: 'Scheduled Posts' },
    { id: 'settings',  ar: 'إعدادات المحتوى',     en: 'Content Settings' },
    { id: 'generate',  ar: 'توليد يدوي',           en: 'Manual Generate' },
  ]

  const VARIATIONS = [
    isRTL ? 'صباح النور والسعادة! يومنا بدأ بأبهى صورة وأنتم معنا. تعالوا وجرّبوا طعمنا المميز اليوم!' : 'Good morning sunshine! Start your day with us. Come taste our special menu today!',
    isRTL ? 'خيرًا أصبحتم! إذا كان يومك محتاج دفعة طاقة، أنتم في المكان الصح. نستقبلكم بابتسامة.' : 'Rise and shine! If your day needs an energy boost, you\'re in the right place. We welcome you with a smile.',
    isRTL ? 'صباح البركة والخير عليكم جميعاً! اليوم عندنا عروض خاصة — كن أول من يزورنا.' : 'Blessed morning to you all! Special offers today — be the first to visit us.',
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 btn-ghost"
            style={{
              background: tab === t.id ? 'rgba(198,255,0,0.1)' : 'transparent',
              color: tab === t.id ? '#C6FF00' : 'rgba(136,136,170,0.8)',
            }}>
            {isRTL ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Tab 1: Scheduled */}
      {tab === 'scheduled' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6FF00]"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <ContentIcon size={48} style={{ color: 'rgba(136,136,170,0.3)' }} />
              <p className="mt-3 text-sm" style={{ color: 'rgba(136,136,170,0.6)' }}>
                {isRTL ? 'لم تُنشر أي منشورات بعد — فعّل محرك المحتوى من الإعدادات' : 'No posts yet — enable the content engine in Settings'}
              </p>
            </div>
          ) : posts.map((post, i) => {
            const s = STATUS_COLORS[post.status || 'draft']
            const date = new Date(post.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            return (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card-os flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs font-semibold flex-shrink-0 w-20" style={{ color: 'rgba(136,136,170,0.6)' }}>
                  {date}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <ContentIcon size={16} style={{ color: '#C6FF00' }} />
                </div>
                <p className="flex-1 text-sm truncate" style={{ color: '#F0F0FF' }}>{post.title || post.content?.substring(0, 50)}</p>
                <span className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: s.bg, color: s.color }}>
                  {isRTL ? s.label : s.en}
                </span>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold btn-ghost"
                    style={{ color: 'rgba(136,136,170,0.8)' }}>
                    {isRTL ? 'تعديل' : 'Edit'}
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                    style={{ background: 'rgba(255,77,109,0.07)', border: '1px solid rgba(255,77,109,0.15)', color: '#FF4D6D' }}>
                    {isRTL ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Tab 2: Settings */}
      {tab === 'settings' && (
        <div className="space-y-3">
          {autoTypes.map(item => (
            <div key={item.id} className="card-os flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#F0F0FF' }}>
                  {isRTL ? item.ar : item.en}
                </div>
                {item.on && (
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(136,136,170,0.6)' }}>
                    {isRTL ? 'ينشر الساعة 09:00 — Instagram + Facebook' : 'Posts at 09:00 — Instagram + Facebook'}
                  </div>
                )}
              </div>
              <button onClick={() => toggle(item.id)}
                className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                style={{ background: item.on ? '#C6FF00' : 'rgba(255,255,255,0.1)' }}>
                <div className="absolute top-1 transition-all duration-200 w-4 h-4 rounded-full"
                  style={{ background: item.on ? '#050505' : 'rgba(255,255,255,0.4)', left: item.on ? (isRTL ? 4 : 'auto') : (isRTL ? 'auto' : 4), right: item.on ? (isRTL ? 'auto' : 4) : (isRTL ? 4 : 'auto') }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Generate */}
      {tab === 'generate' && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(136,136,170,0.8)' }}>
              {isRTL ? 'موضوع المنشور' : 'Post Topic'}
            </label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder={isRTL ? 'مثال: تخفيضات نهاية الأسبوع' : 'e.g. Weekend sale'}
              className="w-full px-4 py-3 rounded-xl text-sm input-os" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(136,136,170,0.8)' }}>
                {isRTL ? 'المنصة' : 'Platform'}
              </label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm input-os">
                <option value="both">{isRTL ? 'الكل' : 'Both'}</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(136,136,170,0.8)' }}>
                {isRTL ? 'الأسلوب' : 'Style'}
              </label>
              <select value={style} onChange={e => setStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm input-os">
                <option value="friendly">{isRTL ? 'ودود' : 'Friendly'}</option>
                <option value="formal">{isRTL ? 'رسمي' : 'Formal'}</option>
                <option value="promo">{isRTL ? 'ترويجي' : 'Promotional'}</option>
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={!topic || generating}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 btn-lime"
            style={{ opacity: topic ? 1 : 0.5 }}>
            {generating && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
            <LightningIcon size={16} />
            {generating ? (isRTL ? 'جاري التوليد...' : 'Generating...') : (isRTL ? 'اطلب من الذكاء الاصطناعي' : 'Ask AI')}
          </button>
          {generated && (
            <div className="space-y-3">
              <p className="text-xs font-bold" style={{ color: 'rgba(136,136,170,0.8)' }}>
                {isRTL ? '3 اقتراحات — اختر واحدة:' : '3 suggestions — pick one:'}
              </p>
              {VARIATIONS.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card-os p-4 rounded-xl cursor-pointer transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(198,255,0,0.3)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.04)' }}>
                  <p className="text-sm mb-3" style={{ color: '#F0F0FF' }}>{v}</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold btn-lime">
                      {isRTL ? 'جدول' : 'Schedule'}
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold btn-ghost"
                      style={{ color: 'rgba(136,136,170,0.8)' }}>
                      {isRTL ? 'نسخ' : 'Copy'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
