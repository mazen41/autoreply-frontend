'use client'

import React from 'react'
import AuthLeftPanel from './AuthLeftPanel'
import LanguageToggle from './LanguageToggle'
import DarkModeToggle from '../DarkModeToggle'
import { useLang } from '../../lib/LangContext'

interface AuthPageLayoutProps {
  children: React.ReactNode
  mode: 'login' | 'register'
}

export default function AuthPageLayout({ children, mode }: AuthPageLayoutProps) {
  const { isRTL } = useLang()

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden lg:flex-row"
      style={{ background: 'var(--background)' }}
    >
      {/* Left branding and live conversational showcase (hidden on mobile, visible lg+) */}
      <div className="hidden lg:block lg:w-5/12 xl:w-1/2">
        <AuthLeftPanel mode={mode} />
      </div>

      {/* Right form container */}
      <div className="relative flex flex-1 flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16">
        {/* Top Header with Language and Theme Switchers */}
        <header className="flex w-full items-center justify-between pb-6">
          <div className="text-xs text-text-tertiary">
            <span className="hidden sm:inline font-medium">Naz AutoReply Autonomous Cloud</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 p-1 shadow-sm backdrop-blur-md">
            <LanguageToggle />
            <div className="h-4 w-[1px] bg-border" />
            <DarkModeToggle />
          </div>
        </header>

        {/* Center Main Form */}
        <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center py-6 sm:py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="pt-6 text-center text-xs text-text-tertiary">
          © {new Date().getFullYear()} Naz AutoReply. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
