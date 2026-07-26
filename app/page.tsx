'use client'

import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import OSExperience from '../components/landing/OSExperience'
import { useLang } from '../lib/LangContext'

function Hero() {
  const { t, isRTL } = useLang()

  return (
    <section className="relative z-10 px-6 py-16 md:py-24" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.04em' }}>
          Naz
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.64)', lineHeight: 1.6 }}>
          {isRTL
            ? 'منصة ذكاء اصطناعي ترد تلقائياً على رسائل عملائك على واتساب، إنستغرام، وفيسبوك — على مدار الساعة.'
            : 'An AI platform that automatically replies to your customers on WhatsApp, Instagram, and Facebook — 24/7.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/pricing"
            className="px-8 py-3 rounded-xl font-bold transition-all"
            style={{
              background: '#C7DAF8',
              color: '#121317',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C7DAF8'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#C7DAF8'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
          </a>
          <a
            href="/login"
            className="px-8 py-3 rounded-xl font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
          </a>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <OSExperience />
      <Footer />
    </main>
  )
}
