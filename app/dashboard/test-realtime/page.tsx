'use client'

import React, { useState } from 'react'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import PusherTest from '../../../components/webchat/PusherTest'

export default function TestRealtimePage() {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {isRTL ? 'اختبار الوقت الفعلي' : 'Real-time Test'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'اختبار اتصال WebSocket و Pusher' : 'Test WebSocket and Pusher connection'}
          </p>
        </div>

        <div className="max-w-2xl">
          <PusherTest />
        </div>
      </div>
    </div>
  )
}