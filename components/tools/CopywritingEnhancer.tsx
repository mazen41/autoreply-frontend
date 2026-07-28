'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function CopywritingEnhancer() {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('copy-enhancer')

  const handleEnhance = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setResult('')

    const response = await callToolsAI(
      'You are an expert Arabic marketing copywriter. Rewrite this ad text to be more persuasive, emotional, and action-driving. Keep it in the same language as the input. Make it punchy and compelling.',
      inputText,
      'copy-enhancer'
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
            نص الإعلان الأصلي / Original Ad Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق نص إعلانك هنا..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleEnhance}
          disabled={loading || !inputText.trim() || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري التحسين...' : 'Enhance / حسّن النص'}
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

      {/* Result - Before/After */}
      {result && !limitReached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Before */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>Before / قبل</h3>
              <button
                onClick={() => copyToClipboard(inputText)}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Copy
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {inputText}
            </div>
          </div>

          {/* After */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: 'var(--accent)' }}>After / بعد</h3>
              <button
                onClick={() => copyToClipboard(result)}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
              >
                Copy
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {result}
            </div>
          </div>

          {/* Upsell CTA */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
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
