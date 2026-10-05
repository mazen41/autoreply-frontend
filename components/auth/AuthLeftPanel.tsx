'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { Zap, Bot, BarChart3, CheckCircle2, Lock, Rocket } from 'lucide-react'

// Mini AI Core for the left panel
function MiniCore({ size = 90 }: { size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {[0, 1].map(i => (
        <div key={i} className="absolute rounded-full border border-brand/50" style={{
          width: s * 0.95, height: s * 0.95,
          animation: `coreRing 2.5s ease-out ${i * 1.1}s infinite`,
        }} />
      ))}
      <div className="absolute rounded-full core-rotate border border-transparent border-t-brand/50 border-r-brand/50" style={{
        width: s * 0.88, height: s * 0.88,
      }} />
      <div className="absolute rounded-full core-rotate-rev border border-transparent border-b-brand/50 border-l-brand/50" style={{
        width: s * 0.68, height: s * 0.68,
      }} />
      <div className="relative flex items-center justify-center rounded-full border-2 border-brand/50" style={{
        width: s * 0.5, height: s * 0.5,
        background: 'radial-gradient(circle at 38% 33%, var(--brand) 0%, rgba(0,232,122,0.2) 55%, transparent 80%)',
      }}>
        <svg width={s * 0.22} height={s * 0.22} viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md">
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
    { v: '500+', l: t.auth.stats.businesses, c: 'text-brand' },
    { v: '3.2M', l: t.auth.stats.autoReplies, c: 'text-text-primary' },
    { v: '8s',   l: t.auth.stats.avgReply, c: 'text-brand' },
  ]

  const bullets = isLogin
    ? [
        { icon: <Zap size={16} />, text: t.auth.features.reply8sec },
        { icon: <Bot size={16} />, text: t.auth.features.aiUnderstands },
        { icon: <BarChart3 size={16} />, text: t.auth.features.instantReports },
      ]
    : [
        { icon: <CheckCircle2 size={16} />, text: t.auth.features.freeTrial },
        { icon: <Lock size={16} />, text: t.auth.features.noCreditCard },
        { icon: <Rocket size={16} />, text: t.auth.features.ready5min },
      ]

  return (
    <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden h-full bg-surface border-r border-border">

      {/* Background orbs */}
      <div className="absolute pointer-events-none -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[40px]" style={{
        background: 'radial-gradient(circle, var(--brand) 0%, transparent 65%)',
        opacity: 0.15,
      }} />
      <div className="absolute pointer-events-none -top-16 -right-16 w-[320px] h-[320px] rounded-full blur-[40px]" style={{
        background: 'radial-gradient(circle, var(--info) 0%, transparent 65%)',
        opacity: 0.1,
      }} />
      
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Top: logo + core */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <img src="/icons/logo_icon.png" alt="NazBiz" className="w-16 h-16 object-contain drop-shadow-xl" />
        </div>

        {/* Core + system status */}
        <div className="flex items-center gap-5 mb-10">
          <MiniCore size={80} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-success uppercase">
                {t.auth.systemOnline}
              </span>
            </div>
            <div className="text-xs text-text-secondary">
              {isLogin ? t.auth.welcomeBack : t.auth.joinToday}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-black mb-3 leading-[1.1] text-[clamp(1.6rem,2.5vw,2.2rem)] tracking-tight">
          <span className="block text-text-primary">
            {isLogin ? `${t.auth.welcomeBack}.` : `${t.auth.startFree}.`}
          </span>
          <span className="block text-brand">
            {isLogin ? `${t.auth.yourSystemAwaits}.` : `${t.auth.noCreditCard}.`}
          </span>
        </h2>
        <p className="text-sm mb-8 text-text-secondary">
          {isLogin
            ? t.auth.loginToAccess
            : `${isRTL ? 'انضم لأكثر من 500 عمل يستخدم Naz لأتمتة ردوده' : 'Join 500+ businesses using Naz to automate their replies'}`}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-lg font-black tracking-tight ${s.c}`}>{s.v}</div>
              <div className="text-[10px] text-text-secondary">{s.l}</div>
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border"
            >
              <span className="text-brand flex items-center">{b.icon}</span>
              <span className="text-sm font-medium text-text-secondary">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live activity ticker */}
      <div className="relative z-10">
        <div className="rounded-xl p-3 mb-5 bg-surface-elevated border border-border backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-brand uppercase">{t.auth.liveActivity}</span>
          </div>
          {[
            { t: t.auth.activity.ahmedWhatsapp, r: t.auth.activity.replied },
            { t: t.auth.activity.saraInstagram, r: t.auth.activity.potentialLead },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-text-secondary">{a.t}</span>
              <span className="text-success">{a.r}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-secondary">{t.auth.allRightsReserved}</p>
      </div>
    </div>
  )
}
