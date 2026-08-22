'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Moon, Sun, Bot } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LangContext'
import { useTheme } from '@/lib/ThemeContext'

export default function BlogTopBar() {
  const { user } = useAuth()
  const { isRTL, toggleLang, lang } = useLang()
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40"
      style={{
        background: 'color-mix(in srgb, var(--background) 78%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Bot size={35} className="text-accent" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={isRTL ? 'تبديل المظهر' : 'Toggle theme'}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            onClick={toggleLang}
            aria-label={isRTL ? 'Switch to English' : 'التبديل للعربية'}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors duration-200"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>

          {user ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-bold btn-primary">
              {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
          ) : (
            <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold btn-primary">
              {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}
