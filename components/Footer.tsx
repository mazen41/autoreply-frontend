'use client'

import React from 'react'
import { useLang } from '../lib/LangContext'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import Link from 'next/link'

export default function Footer() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const { user } = useAuth()

  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            © 2026 Nazeer Business (NazBiz). Operated by Nazir Saleh Khashim Establishment for Information Technology, Al Shuraibat District, Madinah, Saudi Arabia. Commercial Registration No. 7055562016.
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
              href="mailto:support@nazbiz.io"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              support@nazbiz.io
            </a>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
              >
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
