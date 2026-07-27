'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

const transformations = [
  { value: 'formal-gulf', labelAr: 'عربي فصحى → لهجة خليجية', labelEn: 'Formal Arabic → Gulf Dialect' },
  { value: 'gulf-formal', labelAr: 'لهجة خليجية → عربي فصحى', labelEn: 'Gulf Dialect → Formal Arabic' },
  { value: 'ar-en', labelAr: 'عربي → إنجليزي', labelEn: 'Arabic → English' },
  { value: 'en-ar', labelAr: 'إنجليزي → عربي', labelEn: 'English → Arabic' },
]

export default function ToneTransformer() {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [transformation, setTransformation] = useState('formal-gulf')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('tone-transformer')

  const getSystemPrompt = (type: string): string => {
    switch (type) {
      case 'formal-gulf':
        return 'Transform this formal Arabic text into natural Gulf dialect (Saudi, UAE, Kuwait, etc.). Keep the same meaning but make it conversational and authentic to the region.'
      case 'gulf-formal':
        return 'Transform this Gulf dialect text into formal Modern Standard Arabic. Keep the same meaning but make it professional and formal.'
      case 'ar-en':
        return 'Translate this Arabic text to English. Keep the same meaning and tone. Make it natural and professional.'
      case 'en-ar':
        return 'Translate this English text to Arabic. Keep the same meaning and tone. Make it natural and professional.'
      default:
        return 'Transform the text according to the selected option.'
    }
  }

  const handleTransform = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setResult('')

    const response = await callToolsAI(
      getSystemPrompt(transformation),
      inputText,
      'tone-transformer'
    )

    setLoading(false)

    if (response.limitReached) {
      setLimitReached(true)
      return
    }

    if (response.success && response.result) {
      setResult(response.result)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
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
            نوع التحويل / Transformation Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {transformations.map((t) => (
              <label key={t.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: transformation === t.value ? 'var(--accent-subtle)' : 'var(--surface)', border: transformation === t.value ? '1px solid var(--accent-focus)' : '1px solid var(--border)' }}>
                <input
                  type="radio"
                  name="transformation"
                  value={t.value}
                  checked={transformation === t.value}
                  onChange={(e) => setTransformation(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="text-sm">
                  <div style={{ color: 'var(--text-primary)' }}>{t.labelAr}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.labelEn}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            النص الأصلي / Original Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق النص هنا..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleTransform}
          disabled={loading || !inputText.trim() || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري التحويل...' : 'Transform / حوّل النص'}
        </motion.button>
      </div>

      {/* Limit Reached Message */}
      {limitReached && (
        <div className="p-6 rounded-xl text-center mb-6" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
          <p className="text-lg font-bold mb-4" style={{ color: 'var(--error)' }}>
            You've reached your daily limit
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Sign up for unlimited access to all AI tools
          </p>
          <Link href="/register" className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
            Sign Up Free
          </Link>
        </div>
      )}

      {/* Result */}
      {result && !limitReached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--accent)' }}>النص المحول / Transformed Text</h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
            >
              Copy / نسخ
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {result}
          </div>

          {/* Upsell CTA */}
          <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              هل تريد أن يرد الذكاء الاصطناعي على عملائك تلقائياً؟ جرّب Naz Autoreply مجاناً
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
