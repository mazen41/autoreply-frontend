'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { askClaude, getToolUsageInfo } from '@/lib/claude'
import Link from 'next/link'

export default function PolicyGenerator() {
  const [storeName, setStoreName] = useState('')
  const [policies, setPolicies] = useState({
    return: false,
    exchange: false,
    privacy: false,
    shipping: false,
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const usage = getToolUsageInfo('policy-generator')

  const handleGenerate = async () => {
    if (!storeName) return
    
    const selectedPolicies = Object.entries(policies)
      .filter(([_, checked]) => checked)
      .map(([policy]) => policy)
    
    if (selectedPolicies.length === 0) return
    
    setLoading(true)
    setResult('')
    
    const response = await askClaude(
      `Write professional Arabic store policies for an e-commerce store called "${storeName}". Be clear, fair to both customer and merchant. Include these policy types: ${selectedPolicies.join(', ')}. Format each policy with a clear heading and detailed terms in Arabic.`,
      `Store: ${storeName}\nPolicies needed: ${selectedPolicies.join(', ')}`,
      'policy-generator'
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
            اسم المتجر / Store Name
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="مثال: متجر الأناقة، عالم الجمال"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            اختر السياسات / Select Policies
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'return', labelAr: 'سياسة الإرجاع', labelEn: 'Return Policy' },
              { key: 'exchange', labelAr: 'سياسة الاستبدال', labelEn: 'Exchange Policy' },
              { key: 'privacy', labelAr: 'سياسة الخصوصية', labelEn: 'Privacy Policy' },
              { key: 'shipping', labelAr: 'سياسة الشحن', labelEn: 'Shipping Policy' },
            ].map((policy) => (
              <label key={policy.key} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: policies[policy.key as keyof typeof policies] ? 'rgba(198,255,0,0.1)' : 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="checkbox"
                  checked={policies[policy.key as keyof typeof policies]}
                  onChange={(e) => setPolicies({ ...policies, [policy.key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <div className="text-sm">
                  <div style={{ color: '#F5F5F5' }}>{policy.labelAr}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{policy.labelEn}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <motion.button
          onClick={handleGenerate}
          disabled={loading || !storeName || Object.values(policies).every(v => !v) || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'rgba(198,255,0,0.3)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري الإنشاء...' : 'Generate Policies / إنشاء السياسات'}
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
          className="p-6 rounded-xl"
          style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: '#F5F5F5' }}>السياسات المقترحة / Generated Policies</h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}
            >
              Copy / نسخ
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {result}
          </div>

          {/* Upsell CTA */}
          <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
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
