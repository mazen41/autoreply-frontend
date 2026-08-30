'use client'

import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import OSExperience from '../components/landing/OSExperience'
import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import { Bot } from 'lucide-react'

function Hero() {
  const { t, isRTL } = useLang()
  const { user } = useAuth()

  return (
    <section className="relative z-10 px-6 py-16 md:py-24" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-48 h-14 flex items-center justify-center">
            <img src="/icons/logo_icon.png" alt="NazBiz" className="w-16 h-16 object-contain" />
          </div>
        </div>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {isRTL
            ? 'منصة ذكاء اصطناعي يرد تلقائياً على رسائل عملائك على واتساب، إنستغرام، وفيسبوك — على مدار الساعة.'
            : 'An AI platform that automatically replies to your customers on WhatsApp, Instagram, and Facebook — 24/7.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/pricing"
            className="px-8 py-3 rounded-xl font-bold btn-primary"
          >
            {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
          </a>
          {user ? (
            <a
              href="/dashboard"
              className="px-8 py-3 rounded-xl font-bold btn-secondary"
            >
              {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            </a>
          ) : (
            <a
              href="/login"
              className="px-8 py-3 rounded-xl font-bold btn-secondary"
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </a>
          )}
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
