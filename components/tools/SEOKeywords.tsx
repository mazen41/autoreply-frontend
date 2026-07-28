'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function SEOKeywords() {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('seo-keywords')

  const handleExtract = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setResult(null)

    const response = await callToolsAI(
      'Extract the top 15 Arabic SEO keywords from this product description. Group them into: primary keywords (5), secondary keywords (5), and long-tail keywords (5). Format your response as JSON with these keys: "primary" (array), "secondary" (array), "longtail" (array).',
      inputText,
      'seo-keywords'
    )

    setLoading(false)

    if (response.limitReached) {
      setLimitReached(true)
      return
    }

    if (response.success && response.result) {
      try {
        const jsonMatch = response.result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          setResult(JSON.parse(jsonMatch[0]))
        } else {
          setResult({ primary: [], secondary: [], longtail: [] })
        }
      } catch {
        setResult({ primary: [], secondary: [], longtail: [] })
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyAllKeywords = () => {
    if (!result) return
    const allKeywords = [
      ...result.primary,
      ...result.secondary,
      ...result.longtail,
    ].join(', ')
    navigator.clipboard.writeText(allKeywords)
  }

  return (
    <div>
      {/* Usage Indicator */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Free uses remaining today: <span className="font-bold" style={{ color: 'var(--accent)' }}>{usage.remaining}/{usage.max}</span>
          </span>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            وصف المنتج / Product Description
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق وصف المنتج هنا..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleExtract}
          disabled={loading || !inputText.trim() || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الاستخراج...' : 'Extract Keywords / استخرج الكلمات'}
        </motion.button>
      </div>

      {/* Limit Reached Message */}
      {limitReached && (
        <div className="p-6 rounded-xl text-center mb-6" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
          <p className="text-lg font-bold mb-4" style={{ color: 'var(--error)' }}>
            You've reached your daily limit
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {user ? 'قم بترقية حسابك للوصول غير المحدود لجميع أدوات الذكاء الاصطناعي' : 'Sign up for unlimited access to all AI tools'}
          </p>
          <Link href={user ? '/dashboard' : '/register'} className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
            {user ? 'الذهاب إلى لوحة التحكم' : 'Sign Up Free'}
          </Link>
        </div>
      )}

      {/* Result */}
      {result && !limitReached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>كلمات المفتاحية / SEO Keywords</h3>
            <button
              onClick={copyAllKeywords}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
            >
              Copy All
            </button>
          </div>

          {/* Primary Keywords */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--accent)' }}>الكلمات الأساسية / Primary Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {result.primary?.map((keyword: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
                  onClick={() => copyToClipboard(keyword)}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Secondary Keywords */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>الكلمات الثانوية / Secondary Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {result.secondary?.map((keyword: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--border)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onClick={() => copyToClipboard(keyword)}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Long-tail Keywords */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>الكلمات الطويلة / Long-tail Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {result.longtail?.map((keyword: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--border)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onClick={() => copyToClipboard(keyword)}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Upsell CTA */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              هل تريد أن يرد الذكاء الاصطناعي على عملائك تلقائياً؟ جرّب الرد الآلي مجاناً
            </p>
            <Link href={user ? '/dashboard/channels' : '/register'} className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
              {user ? 'فعّل الرد الآلي على متجرك الآن' : 'جرّب مجاناً'}
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
