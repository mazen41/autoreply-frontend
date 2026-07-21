'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

// Mini AI Core for the left panel
function MiniCore({ size = 90 }: { size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {[0, 1].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: s * 0.95, height: s * 0.95,
          border: '1px solid rgba(59,130,246,0.25)',
          animation: `coreRing 2.5s ease-out ${i * 1.1}s infinite`,
        }} />
      ))}
      <div className="absolute rounded-full core-rotate" style={{
        width: s * 0.88, height: s * 0.88,
        border: '1px solid transparent',
        borderTop: '1px solid rgba(59,130,246,0.5)',
        borderRight: '1px solid rgba(59,130,246,0.15)',
      }} />
      <div className="absolute rounded-full core-rotate-rev" style={{
        width: s * 0.68, height: s * 0.68,
        border: '1px solid transparent',
        borderBottom: '1px solid rgba(96,165,250,0.5)',
        borderLeft: '1px solid rgba(96,165,250,0.15)',
      }} />
      <div className="relative core-glow flex items-center justify-center" style={{
        width: s * 0.5, height: s * 0.5, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 33%, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.04) 55%, transparent 80%)',
        border: '2px solid rgba(59,130,246,0.4)',
      }}>
        <svg width={s * 0.22} height={s * 0.22} viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,1))' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    </div>
  )
}

interface AuthLeftPanelProps {
  mode: 'login' | 'register'
}

export default function AuthLeftPanel({ mode }: AuthLeftPanelProps) {
  const { isRTL, t } = useLang()
  const isLogin = mode === 'login'

  const stats = [
    { v: '500+', l: t.auth.stats.businesses, c: 'var(--accent)' },
    { v: '3.2M', l: t.auth.stats.autoReplies, c: 'var(--accent)' },
    { v: '8s',   l: t.auth.stats.avgReply, c: 'var(--accent)' },
  ]

  const bullets = isLogin
    ? [
        { icon: '⚡', text: t.auth.features.reply8sec, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg> },
        { icon: '🤖', text: t.auth.features.aiUnderstands, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg> },
        { icon: '📊', text: t.auth.features.instantReports, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> },
      ]
    : [
        { icon: '✅', text: t.auth.features.freeTrial, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> },
        { icon: '🔒', text: t.auth.features.noCreditCard, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> },
        { icon: '🚀', text: t.auth.features.ready5min, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> },
      ]

  return (
    <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden h-full dark:bg-surface bg-light-surface"
      style={{ borderRight: '1px solid var(--border)' }}>

      {/* Background orbs */}
      <div className="absolute pointer-events-none" style={{
        bottom: '-80px', left: '-80px', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }} />
      <div className="absolute pointer-events-none" style={{
        top: '-60px', right: '-60px', width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }} />
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.6,
      }} />

      {/* Top: logo + core */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.7))' }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-2xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)' }}>
            AI
          </div>
        </div>

        {/* Core + system status */}
        <div className="flex items-center gap-5 mb-10">
          <MiniCore size={80} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--success)' }} />
              <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color: 'var(--success)' }}>
                {t.auth.systemOnline}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? t.auth.welcomeBack : t.auth.joinToday}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-black mb-3 leading-[1.1]"
          style={{ fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', letterSpacing: '-0.04em' }}>
          <span className="block" style={{ color: 'var(--text-primary)' }}>
            {isLogin ? `${t.auth.welcomeBack}.` : `${t.auth.startFree}.`}
          </span>
          <span className="block" style={{ color: 'var(--accent)' }}>
            {isLogin ? `${t.auth.yourSystemAwaits}.` : `${t.auth.noCreditCard}.`}
          </span>
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {isLogin
            ? t.auth.loginToAccess
            : `${isRTL ? 'انضم لأكثر من 500 عمل يستخدم Naz لأتمتة ردوده' : 'Join 500+ businesses using Naz to automate their replies'}`}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-black" style={{ color: s.c, letterSpacing: '-0.04em' }}>{s.v}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{s.l}</div>
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
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{b.svg}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live activity ticker */}
      <div className="relative z-10">
        <div className="rounded-xl p-3 mb-5 glass"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--accent)' }}>{t.auth.liveActivity}</span>
          </div>
          {[
            { t: t.auth.activity.ahmedWhatsapp, r: t.auth.activity.replied, c: '#25D366' },
            { t: t.auth.activity.saraInstagram, r: t.auth.activity.potentialLead, c: '#E1306C' },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: 'var(--text-secondary)' }}>{a.t}</span>
              <span style={{ color: 'var(--success)' }}>{a.r}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t.auth.allRightsReserved}</p>
      </div>
    </div>
  )
}
