'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const PROPERTY_ID = 'prop_naz_internal'
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io').replace(/\/+$/, '')

type NazAnalytics = ((method: string, ...args: unknown[]) => void) & {
  init?: (propertyId: string) => void
  page?: () => void
  q?: unknown[][]
}

declare global {
  interface Window {
    NazAnalytics?: NazAnalytics
    NazAnalyticsObject?: string
  }
}

function isPublicAnalyticsPath(pathname: string): boolean {
  return pathname === '/' || ['/pricing', '/privacy', '/terms', '/blog', '/tools'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export default function InternalAnalytics() {
  const pathname = usePathname()
  const initialized = useRef(false)

  useEffect(() => {
    if (!isPublicAnalyticsPath(pathname)) return
    if (window.location.hostname !== 'nazbiz.io' && window.location.hostname !== 'www.nazbiz.io') return

    let tracker = window.NazAnalytics
    if (!tracker) {
      tracker = function (...args: unknown[]) {
        tracker!.q = tracker!.q || []
        tracker!.q.push(args)
      }
      tracker.q = []
      window.NazAnalyticsObject = 'NazAnalytics'
      window.NazAnalytics = tracker
    }

    if (!initialized.current) {
      tracker('init', PROPERTY_ID)
      initialized.current = true

      if (!document.querySelector('script[data-naz-internal-analytics]')) {
        const script = document.createElement('script')
        script.async = true
        script.src = `${API_BASE}/api/v1/analytics/tracker.js`
        script.dataset.nazInternalAnalytics = 'true'
        document.head.appendChild(script)
      }
    }

    if (typeof tracker.page === 'function') tracker.page()
    else tracker('page')
  }, [pathname])

  return null
}
