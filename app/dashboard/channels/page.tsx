'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const CHANNELS = [
  { id: 'instagram', icon: '📸', name: 'Instagram',      color: '#E1306C', connected: true,  msgs: 124, sync: '2 دقائق', plan: 'free' },
  { id: 'facebook',  icon: '🔵', name: 'Facebook',       color: '#1877F2', connected: true,  msgs: 67,  sync: '5 دقائق', plan: 'free' },
  { id: 'gmail',     icon: '📧', name: 'Gmail',          color: '#EA4335', connected: false, msgs: 0,   sync: '',         plan: 'free' },
  { id: 'whatsapp',  icon: '💬', name: 'WhatsApp',       color: '#25D366', connected: false, msgs: 0,   sync: '',         plan: 'business', locked: true },
  { id: 'reviews',   icon: '⭐', name: 'Google Reviews', color: '#FBBC05', connected: false, msgs: 0,   sync: '',         plan: 'free' },
  { id: 'webchat',   icon: '🌐', name: 'شات الموقع',     color: '#7DF9FF', connected: false, msgs: 0,   sync: '',         plan: 'starter' },
]

function ConnectModal({ ch, onClose }: { ch: typeof CHANNELS[0]; onClose: () => void }) {
  const { isRTL } = useLang()
  const [step, setStep] = useState<'info' | 'connecting' | 'done'>('info')

  const handleConnect = () => {
    setStep('connecting')
    setTimeout(() => setStep('done'), 2000)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose} />
      <motion.div className="relative w-full max-w-sm rounded-2xl p-6"
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        {step === 'done' ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(198,255,0,0.1)', border: '2px solid rgba(198,255,0,0.3)' }}>
              <span style={{ fontSize: 32 }}>✅</span>
            </div>
            <h3 className="text-lg font-black mb-2" style={{ color: '#F5F5F5' }}>
              {isRTL ? `تم ربط ${ch.name} بنجاح!` : `${ch.name} Connected!`}
            </h3>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {isRTL ? 'البوت جاهز للرد الآن' : 'The bot is ready to reply'}
            </p>
            <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050505' }}>
              {isRTL ? 'رائع! ✓' : 'Done ✓'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${ch.color}20` }}>
                {ch.icon}
              </div>
              <div>
                <h3 className="font-black" style={{ color: '#F5F5F5' }}>
                  {isRTL ? `ربط ${ch.name}` : `Connect ${ch.name}`}
                </h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {isRTL ? 'ستحتاج إلى تسجيل الدخول' : 'You\'ll need to sign in'}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isRTL
                  ? `سيطلب النظام إذن القراءة والرد على رسائل ${ch.name}. لن يتم حذف أي بيانات.`
                  : `The system will request permission to read and reply to ${ch.name} messages. No data will be deleted.`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleConnect}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050505' }}>
                {step === 'connecting' && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {step === 'connecting' ? (isRTL ? 'جاري الربط...' : 'Connecting...') : (isRTL ? 'متابعة' : 'Continue')}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function ChannelsPage() {
  const { isRTL } = useLang()
  const [connecting, setConnecting] = useState<typeof CHANNELS[0] | null>(null)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-black" style={{ color: '#F5F5F5' }}>
          {isRTL ? 'القنوات المتصلة' : 'Connected Channels'}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isRTL ? 'اربط قنواتك ليعمل البوت على جميع منصاتك' : 'Connect your channels so the bot works everywhere'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNELS.map((ch, i) => (
          <motion.div key={ch.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 relative"
            style={{
              background: 'rgba(13,13,13,0.9)',
              border: `1px solid ${ch.connected ? 'rgba(198,255,0,0.15)' : 'rgba(255,255,255,0.06)'}`,
              opacity: ch.locked ? 0.7 : 1,
            }}>
            {ch.locked && (
              <div className="absolute top-3 right-3 text-sm">🔒</div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${ch.color}20`, border: `1px solid ${ch.color}30` }}>
                {ch.icon}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: '#F5F5F5' }}>{ch.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {ch.connected ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
                      <span className="text-[11px] font-semibold" style={{ color: '#C6FF00' }}>
                        {isRTL ? 'متصل' : 'Connected'}
                      </span>
                    </>
                  ) : ch.locked ? (
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {isRTL ? 'متاح في باقة الأعمال' : 'Business plan'}
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {isRTL ? 'غير متصل' : 'Not connected'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {ch.connected && (
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isRTL ? 'رسائل الشهر' : 'Messages/month'}</span>
                  <span className="font-bold" style={{ color: '#F5F5F5' }}>{ch.msgs}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isRTL ? 'آخر مزامنة' : 'Last sync'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>{isRTL ? `منذ ${ch.sync}` : `${ch.sync} ago`}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {ch.locked ? (
                <button className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050505' }}>
                  {isRTL ? '⬆ ترقية الآن' : '⬆ Upgrade Now'}
                </button>
              ) : ch.connected ? (
                <>
                  <button className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(198,255,0,0.07)', border: '1px solid rgba(198,255,0,0.2)', color: '#C6FF00' }}>
                    {isRTL ? 'إدارة' : 'Manage'}
                  </button>
                  <button className="py-2.5 px-3 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.18)', color: '#FF3B30' }}>
                    {isRTL ? 'قطع' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button onClick={() => setConnecting(ch)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  + {isRTL ? 'ربط' : 'Connect'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {connecting && <ConnectModal ch={connecting} onClose={() => setConnecting(null)} />}
      </AnimatePresence>
    </div>
  )
}
