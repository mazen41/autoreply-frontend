'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function SalesScriptGenerator() {
  const { user } = useAuth()
  const [productName, setProductName] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('sales-script')

  const handleGenerate = async () => {
    if (!productName || !targetAudience) return

    setLoading(true)
    setResult('')

    const response = await callToolsAI(
      'You are an expert Arabic sales coach. Write a persuasive phone/WhatsApp sales script in Arabic. Include: opening hook, value proposition, handling objections, and closing call-to-action. Make it natural and conversational.',
      `Product: ${productName}\nTarget Audience: ${targetAudience}\n\nGenerate a sales script for this product targeting this audience.`,
      'sales-script'
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
            اسم المنتج / Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="مثال: دورة تدريبية، منتج تجميلي، خدمة استشارات"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            الجمهور المستهدف / Target Audience
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="مثال: ربات البيوت، الشباب، أصحاب الأعمال الصغيرة"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={loading || !productName || !targetAudience || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Script / إنشاء النص'}
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
          className="p-6 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>النص المقترح / Generated Script</h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
            >
              Copy / نسخ
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {result}
          </div>

          {/* Upsell CTA */}
          <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
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
