'use client'

import React from 'react'
import { useLang } from '../lib/LangContext'
import { useTheme } from '../lib/ThemeContext'
import Link from 'next/link'

export default function Footer() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()

  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            © 2026 Naz Autoreply — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/privacy"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link 
              href="/terms"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isRTL ? 'شروط الخدمة' : 'Terms of Service'}
            </Link>
            <a 
              href="mailto:support@nazautoreply.com"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              support@nazautoreply.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
