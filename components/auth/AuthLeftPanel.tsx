'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Mini AI Core for the left panel
function MiniCore({ size = 90 }: { size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {[0, 1].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: s * 0.95, height: s * 0.95,
          border: '1px solid rgba(198,255,0,0.25)',
          animation: `energyPulse 2.5s ease-out ${i * 1.1}s infinite`,
        }} />
      ))}
      <div className="absolute rounded-full core-rotate" style={{
        width: s * 0.88, height: s * 0.88,
        border: '1px solid transparent',
        borderTop: '1px solid rgba(198,255,0,0.5)',
        borderRight: '1px solid rgba(198,255,0,0.15)',
      }} />
      <div className="absolute rounded-full core-rotate-rev" style={{
        width: s * 0.68, height: s * 0.68,
        border: '1px solid transparent',
        borderBottom: '1px solid rgba(125,249,255,0.5)',
        borderLeft: '1px solid rgba(125,249,255,0.15)',
      }} />
      <div className="relative core-glow flex items-center justify-center" style={{
        width: s * 0.5, height: s * 0.5, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 33%, rgba(198,255,0,0.2) 0%, rgba(198,255,0,0.04) 55%, transparent 80%)',
        border: '2px solid rgba(198,255,0,0.4)',
      }}>
        <span style={{ fontSize: s * 0.22, filter: 'drop-shadow(0 0 10px rgba(198,255,0,1))' }}>✦</span>
      </div>
    </div>
  )
}

interface AuthLeftPanelProps {
  mode: 'login' | 'register'
}

export default function AuthLeftPanel({ mode }: AuthLeftPanelProps) {
  const isLogin = mode === 'login'

  const stats = [
    { v: '500+', l: 'عمل تجاري', c: '#C6FF00' },
    { v: '3.2M', l: 'رد تلقائي', c: '#7DF9FF' },
    { v: '8s',   l: 'متوسط الرد', c: '#C6FF00' },
  ]

  const bullets = isLogin
    ? [
        { icon: '⚡', text: 'رد في 8 ثوانٍ على كل رسالة' },
        { icon: '🤖', text: 'ذكاء اصطناعي يفهم لهجتك' },
        { icon: '📊', text: 'تقارير لحظية لأداء نشاطك' },
      ]
    : [
        { icon: '✅', text: '14 يوم تجربة مجانية كاملة' },
        { icon: '🔒', text: 'لا حاجة لبطاقة ائتمانية' },
        { icon: '🚀', text: 'جاهز في أقل من 5 دقائق' },
      ]

  return (
    <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden h-full"
      style={{ background: 'rgba(9,9,9,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Background orbs */}
      <div className="absolute pointer-events-none" style={{
        bottom: '-80px', left: '-80px', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(198,255,0,0.08) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }} />
      <div className="absolute pointer-events-none" style={{
        top: '-60px', right: '-60px', width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(125,249,255,0.07) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }} />
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(198,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(198,255,0,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.6,
      }} />

      {/* Top: logo + core */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <span style={{ color: '#C6FF00', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.7))' }}>✦</span>
          <span className="text-2xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.2)' }}>
            AI
          </div>
        </div>

        {/* Core + system status */}
        <div className="flex items-center gap-5 mb-10">
          <MiniCore size={80} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
              <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
                SYSTEM ONLINE
              </span>
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {isLogin ? 'مرحباً بعودتك' : 'انضم اليوم'}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-black mb-3 leading-[1.1]"
          style={{ fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', letterSpacing: '-0.04em' }}>
          <span className="block" style={{ color: '#F5F5F5' }}>
            {isLogin ? 'مرحباً بعودتك.' : 'ابدأ مجاناً.'}
          </span>
          <span className="block text-dual">
            {isLogin ? 'نظامك في انتظارك.' : 'بدون بطاقة ائتمانية.'}
          </span>
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isLogin
            ? 'سجل دخولك للوصول إلى لوحة تحكم الذكاء الاصطناعي'
            : 'انضم لأكثر من 500 عمل يستخدم Naz لأتمتة ردوده'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-black" style={{ color: s.c, letterSpacing: '-0.04em' }}>{s.v}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Bullets */}
        <div className="space-y-2.5">
          {bullets.map((b, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.1)' }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live activity ticker */}
      <div className="relative z-10">
        <div className="rounded-xl p-3 mb-5 glass"
          style={{ background: 'rgba(14,14,14,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#7DF9FF' }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: '#7DF9FF' }}>LIVE ACTIVITY</span>
          </div>
          {[
            { t: 'أحمد — WhatsApp', r: 'تم الرد ✓', c: '#25D366' },
            { t: 'سارة — Instagram', r: 'عميل محتمل ⚡', c: '#E1306C' },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{a.t}</span>
              <span style={{ color: a.c }}>{a.r}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2025 Naz. All rights reserved.</p>
      </div>
    </div>
  )
}
