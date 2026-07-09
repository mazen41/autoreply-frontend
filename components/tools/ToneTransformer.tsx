'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { askClaude, getToolUsageInfo } from '@/lib/claude'
import Link from 'next/link'

const transformations = [
  { value: 'formal-gulf', labelAr: 'عربي فصحى → لهجة خليجية', labelEn: 'Formal Arabic → Gulf Dialect' },
  { value: 'gulf-formal', labelAr: 'لهجة خليجية → عربي فصحى', labelEn: 'Gulf Dialect → Formal Arabic' },
  { value: 'ar-en', labelAr: 'عربي → إنجليزي', labelEn: 'Arabic → English' },
  { value: 'en-ar', labelAr: 'إنجليزي → عربي', labelEn: 'English → Arabic' },
]

export default function ToneTransformer() {
  const [inputText, setInputText] = useState('')
  const [transformation, setTransformation] = useState('formal-gulf')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
    
    const response = await askClaude(
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
            نوع التحويل / Transformation Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {transformments.map((t) => (
              <label key={t.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: transformation === t.value ? 'rgba(198,255,0,0.1)' : 'rgba(17,17,17,0.9)', border: transformation === t.value ? '1px solid rgba(198,255,0,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="radio"
                  name="transformation"
                  value={t.value}
                  checked={transformation === t.value}
                  onChange={(e) => setTransformation(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="text-sm">
                  <div style={{ color: '#F5F5F5' }}>{t.labelAr}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.labelEn}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            النص الأصلي / Original Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق النص هنا..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
          />
        </div>
        
        <motion.button
          onClick={handleTransform}
          disabled={loading || !inputText.trim() || usage.remaining === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading || usage.remaining === 0 ? 'rgba(198,255,0,0.3)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
          }}
          whileHover={!loading && usage.remaining > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && usage.remaining > 0 ? { scale: 0.98 } : {}}
        >
          {loading ? 'جاري التحويل...' : 'Transform / حوّل النص'}
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
          style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: '#C6FF00' }}>النص المحول / Transformed Text</h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}
            >
              Copy / نسخ
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
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
