'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Scopes the "Graphite & Amber" palette to the homepage only.
 * Adds/removes `landing-theme` on <html> as the route changes
 * (client-side nav), on top of the blocking inline script in
 * layout.tsx that prevents a flash on the very first load.
 */
export default function LandingThemeSync() {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.classList.toggle('landing-theme', pathname === '/')
  }, [pathname])

  return null
}
