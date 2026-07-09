'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { askClaude, getToolUsageInfo } from '@/lib/claude'
import Link from 'next/link'

const titleTypes = [
  { value: 'email', labelAr: 'عنوان بريد إلكتروني', labelEn: 'Email Subject' },
  { value: 'blog', labelAr: 'عنوان مقال', labelEn: 'Blog Title' },
  { value: 'product', labelAr: 'اسم منتج', labelEn: 'Product Name' },
  { value: 'ad', labelAr: 'عنوان إعلان', labelEn: 'Ad Headline' },
]

export default function TitleGenerator() {
  const [topic, setTopic] = useState('')
  const [titleType, setTitleType] = useState('email')
  const [result, setResult] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const usage = getToolUsageInfo('title-generator')

  const getSystemPrompt = (type: string): string => {
    const typeMap: Record<string, string> = {
      email: 'Generate 10 attention-grabbing Arabic email subject lines. Use proven copywriting formulas: curiosity, urgency, numbers, benefit-driven. Make them high-open-rate worthy.',
      blog: 'Generate 10 attention-grabbing Arabic blog titles. Use proven copywriting formulas: curiosity, urgency, numbers, benefit-driven. Make them SEO-friendly and click-worthy.',
      product: 'Generate 10 attention-grabbing Arabic product names. Use proven copywriting formulas: curiosity, urgency, numbers, benefit-driven. Make them memorable and brandable.',
      ad: 'Generate 10 attention-grabbing Arabic ad headlines. Use proven copywriting formulas: curiosity, urgency, numbers, benefit-driven. Make them conversion-focused.',
    }
    return typeMap[type] || typeMap.email
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    setLoading(true)
    setResult([])
    
    const response = await askClaude(
      getSystemPrompt(titleType),
      topic,
      'title-generator'
    )
    
    setLoading(false)
    
    if (response.limitReached) {
      setLimitReached(true)
      return
    }
    
    if (response.success && response.result) {
      // Parse numbered list
      const titles = response.result
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10)
      setResult(titles.length > 0 ? titles : [response.result])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyAllTitles = () => {
    navigator.clipboard.writeText(result.join('\n'))
  }

  return (
    <div>
      {/* Usage Indicator */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Free uses remaining today: <span className="font-bold" style={{ color: '#C6FF00' }}>{usage.remaining}/{usage.max}</span>
          </span>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            نوع العنوان / Title Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {titleTypes.map((type) => (
              <label key={type.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: titleType === type.value ? 'rgba(198,255,0,0.1)' : 'rgba(17,17,17,0.9)', border: titleType === type.value ? '1px solid rgba(198,255,0,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="radio"
                  name="titleType"
                  value={type.value}
                  checked={titleType === type.value}
                  onChange={(e) => setTitleType(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="text-sm">
                  <div style={{ color: '#F5F5F5' }}>{type.labelAr}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{type.labelEn}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            الموضوع أو المنتج / Topic or Product
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: دورة تدريبية، منتج تجميلي، خدمة استشارات"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <motion.button
          onClick={handleGenerate}
          disabled={loading || !topic.trim() || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'rgba(198,255,0,0.3)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Titles / إنشاء العناوين'}
        </motion.button>
      </div>

      {/* Limit Reached Message */}
      {limitReached && (
        <div className="p-6 rounded-xl text-center mb-6" style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)' }}>
          <p className="text-lg font-bold mb-4" style={{ color: '#FF7070' }}>
            You've reached your daily limit
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Sign up for unlimited access to all AI tools
          </p>
          <Link href="/register" className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#C6FF00', color: '#050505' }}>
            Sign Up Free
          </Link>
        </div>
      )}

      {/* Result */}
      {result.length > 0 && !limitReached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold" style={{ color: '#F5F5F5' }}>العناوين المقترحة / Generated Titles</h3>
            <button
              onClick={copyAllTitles}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}
            >
              Copy All
            </button>
          </div>

          {result.map((title, i) => (
            <div key={i} className="p-4 rounded-lg flex items-center justify-between gap-3"
              style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00' }}>
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{title}</span>
              </div>
              <button
                onClick={() => copyToClipboard(title)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}
              >
                Copy
              </button>
            </div>
          ))}

          {/* Upsell CTA */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
              هل تريد أن يرد الذكاء الاصطناعي على عملائك تلقائياً؟ جرّب Naz Autoreply مجاناً
            </p>
            <Link href={isLoggedIn ? '/dashboard/channels' : '/register'} className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: '#C6FF00', color: '#050505' }}>
              {isLoggedIn ? 'فعّل الرد الآلي على متجرك الآن' : 'جرّب مجاناً'}
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
