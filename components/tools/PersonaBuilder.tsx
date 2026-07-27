'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { callToolsAI, getToolUsageInfo } from '@/lib/ToolsAIService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

export default function PersonaBuilder() {
  const { user } = useAuth()
  const [storeNiche, setStoreNiche] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [targetCountry, setTargetCountry] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const usage = getToolUsageInfo('persona-builder')

  const handleGenerate = async () => {
    if (!storeNiche || !priceRange || !targetCountry) return

    setLoading(true)
    setResult(null)

    const response = await callToolsAI(
      'Build 2 detailed customer personas for this store. Each persona should include: name, age, job, income, pain points, buying motivations, preferred social platforms, and best time to reach them. Format your response as JSON with a "personas" array, where each item has: "name", "age", "job", "income", "painPoints" (array), "motivations" (array), "platforms" (array), "bestTime".',
      `Store Niche: ${storeNiche}\nPrice Range: ${priceRange}\nTarget Country: ${targetCountry}`,
      'persona-builder'
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
          setResult({ personas: [] })
        }
      } catch {
        setResult({ personas: [] })
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
            مجال المتجر / Store Niche
          </label>
          <input
            type="text"
            value={storeNiche}
            onChange={(e) => setStoreNiche(e.target.value)}
            placeholder="مثال: ملابس نسائية، إلكترونيات، منتجات تجميل"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            نطاق السعر / Price Range
          </label>
          <input
            type="text"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            placeholder="مثال: 50-200 ريال، 500-1000 ريال"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            الدولة المستهدفة / Target Country
          </label>
          <input
            type="text"
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            placeholder="مثال: السعودية، الإمارات، الكويت"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={loading || !storeNiche || !priceRange || !targetCountry || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'var(--surface)',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Personas / إنشاء الشخصيات'}
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
          className="space-y-6"
        >
          {result.personas?.map((persona: any, i: number) => (
            <div key={i} className="p-6 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                    {persona.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{persona.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {persona.age} years old • {persona.job}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  Persona {i + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg" style={{ background: 'var(--border)' }}>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>الدخل / Income</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{persona.income}</div>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--border)' }}>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>أفضل وقت للوصول / Best Time</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{persona.bestTime}</div>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--border)' }}>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>نقاط الألم / Pain Points</div>
                  <ul className="space-y-1">
                    {persona.painPoints?.map((point: string, j: number) => (
                      <li key={j} style={{ color: 'var(--text-secondary)' }}>• {point}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg" style={{ background: 'var(--border)' }}>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>الدوافع الشرائية / Motivations</div>
                  <ul className="space-y-1">
                    {persona.motivations?.map((motivation: string, j: number) => (
                      <li key={j} style={{ color: 'var(--text-secondary)' }}>• {motivation}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-subtle)' }}>
                <div className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>المنصات المفضلة / Preferred Platforms</div>
                <div className="flex flex-wrap gap-2">
                  {persona.platforms?.map((platform: string, j: number) => (
                    <span key={j} className="px-3 py-1 rounded-lg text-sm"
                      style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {platform}
                    </span>
                  ))}
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
