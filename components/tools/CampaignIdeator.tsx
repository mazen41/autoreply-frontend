'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function CampaignIdeator() {
  const { user } = useAuth()
  const [storeType, setStoreType] = useState('')
  const [occasion, setOccasion] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('campaign-ideator')

  const handleGenerate = async () => {
    if (!storeType || !occasion) return

    setLoading(true)
    setResult(null)

    const response = await callToolsAI(
      'Generate 5 creative ad campaign ideas for this store for the given occasion. Each idea should have: campaign name, main message, suggested visual concept, and a sample caption for Instagram. Format your response as JSON with a "campaigns" array, where each item has: "name", "message", "visual", "caption".',
      `Store Type: ${storeType}\nOccasion: ${occasion}`,
      'campaign-ideator'
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
          setResult({ campaigns: [] })
        }
      } catch {
        setResult({ campaigns: [] })
      }
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
            نوع المتجر / Store Type
          </label>
          <input
            type="text"
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
            placeholder="مثال: متجر ملابس، مطعم، صالون تجميل"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            المناسبة / Occasion
          </label>
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="مثال: رمضان، العيد، الصيف، العودة للمدارس"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={loading || !storeType || !occasion || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Ideas / إنشاء الأفكار'}
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
          className="space-y-4"
        >
          {result.campaigns?.map((campaign: any, i: number) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ color: 'var(--accent)' }}>{campaign.name}</h3>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  Idea {i + 1}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>الرسالة الرئيسية / Message: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{campaign.message}</span>
                </div>

                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>المفهوم البصري / Visual: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{campaign.visual}</span>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-subtle)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>نص إنستغرام / Caption:</span>
                    <button
                      onClick={() => copyToClipboard(campaign.caption)}
                      className="px-2 py-1 rounded text-xs font-bold transition-all shrink-0"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{campaign.caption}</p>
                </div>
              </div>
            </div>
          ))}

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
