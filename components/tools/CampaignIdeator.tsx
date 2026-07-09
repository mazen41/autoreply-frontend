'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { askClaude, getToolUsageInfo } from '@/lib/claude'
import Link from 'next/link'

export default function CampaignIdeator() {
  const [storeType, setStoreType] = useState('')
  const [occasion, setOccasion] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const usage = getToolUsageInfo('campaign-ideator')

  const handleGenerate = async () => {
    if (!storeType || !occasion) return
    
    setLoading(true)
    setResult(null)
    
    const response = await askClaude(
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
            نوع المتجر / Store Type
          </label>
          <input
            type="text"
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
            placeholder="مثال: متجر ملابس، مطعم، صالون تجميل"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            المناسبة / Occasion
          </label>
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="مثال: رمضان، العيد، الصيف، العودة للمدارس"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <motion.button
          onClick={handleGenerate}
          disabled={loading || !storeType || !occasion || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'rgba(198,255,0,0.3)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Ideas / إنشاء الأفكار'}
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
      {result && !limitReached && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {result.campaigns?.map((campaign: any, i: number) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ color: '#C6FF00' }}>{campaign.name}</h3>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00' }}>
                  Idea {i + 1}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>الرسالة الرئيسية / Message: </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{campaign.message}</span>
                </div>
                
                <div>
                  <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>المفهوم البصري / Visual: </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{campaign.visual}</span>
                </div>
                
                <div className="p-3 rounded-lg" style={{ background: 'rgba(198,255,0,0.05)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold" style={{ color: '#C6FF00' }}>نص إنستغرام / Caption:</span>
                    <button
                      onClick={() => copyToClipboard(campaign.caption)}
                      className="px-2 py-1 rounded text-xs font-bold transition-all shrink-0"
                      style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{campaign.caption}</p>
                </div>
              </div>
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
