'use client'

import { motion } from 'framer-motion'
import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import OSExperience from '../components/landing/OSExperience'
import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import { springs, variants } from '../lib/motion'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, MessageSquare, Bot, ArrowRight, CheckCircle } from 'lucide-react'

const PROOF_POINTS = [
  { icon: CheckCircle, text: '78% AI autonomy rate' },
  { icon: Zap, text: '1.2s avg response time' },
  { icon: MessageSquare, text: 'WhatsApp, Instagram, Telegram & more' },
]

const CHANNEL_LOGOS = [
  { name: 'WhatsApp', color: '#25D366', char: 'W' },
  { name: 'Instagram', color: '#E4405F', char: 'I' },
  { name: 'Facebook', color: '#1877F2', char: 'F' },
  { name: 'Telegram', color: '#2AABEE', char: 'T' },
  { name: 'Gmail', color: '#EA4335', char: 'G' },
  { name: 'Salla', color: '#00B4D8', char: 'S' },
]

function Hero() {
  const { isRTL } = useLang()
  const { user } = useAuth()

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }}
      />
      {/* Subtle brand glow — top center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, color-mix(in srgb, var(--brand) 12%, transparent), transparent 70%)',
        }}
      />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={variants.fadeUp} transition={springs.standard} className="flex justify-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-surface/60 backdrop-blur-sm">
            <Image src="/icons/logo_icon.png" alt="NazBiz" width={28} height={28} className="object-contain" />
            <span className="text-sm font-bold text-text-primary">NazBiz</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">AI POWERED</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div variants={variants.fadeUp} transition={springs.standard} className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-text-primary leading-[1.05]">
            {isRTL ? 'ردود تلقائية ذكية' : 'AI that replies'}
            <br />
            <span style={{ color: 'var(--brand)' }}>
              {isRTL ? 'على كل قناة' : 'before you wake up'}
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {isRTL
              ? 'منصة ذكاء اصطناعي ترد تلقائياً على عملائك عبر واتساب وإنستغرام وفيسبوك — 24/7.'
              : 'NazBiz handles every customer message on WhatsApp, Instagram, Telegram, and Gmail — autonomously, in seconds, 24/7.'}
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={variants.fadeUp} transition={springs.standard} className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm btn-primary"
            style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={springs.snap}
          >
            {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
            <ArrowRight size={16} />
          </motion.a>
          <motion.a
            href={user ? '/dashboard' : '/login'}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border border-border bg-surface hover:bg-surface-elevated"
            style={{ color: 'var(--text-primary)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snap}
          >
            {user ? (isRTL ? 'لوحة التحكم' : 'Dashboard') : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
          </motion.a>
        </motion.div>

        {/* Proof points */}
        <motion.div variants={variants.fadeUp} transition={springs.standard} className="flex flex-wrap items-center justify-center gap-4">
          {PROOF_POINTS.map((p) => (
            <div key={p.text} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <p.icon size={13} className="text-brand flex-shrink-0" />
              <span>{p.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Channel logos strip */}
        <motion.div variants={variants.fadeUp} transition={springs.standard} className="pt-4">
          <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold mb-4">Works with every channel</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {CHANNEL_LOGOS.map((ch) => (
              <motion.div
                key={ch.name}
                className="w-10 h-10 rounded-xl border border-border bg-surface flex items-center justify-center text-sm font-black"
                style={{ color: ch.color }}
                whileHover={{ scale: 1.12, y: -3 }}
                transition={springs.bouncy}
                title={ch.name}
              >
                {ch.char}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default function Home() {
  return (
    <main style={{ background: 'var(--background)' }}>
      <Navbar />
      <Hero />
      <OSExperience />
      <Footer />
    </main>
  )
}
