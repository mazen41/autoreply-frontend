'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  const landingFooterRoutes = ['/', '/pricing', '/integrations', '/security', '/about', '/careers', '/contact', '/help-center', '/docs', '/status']

  // These marketing pages render their own landing footer.
  if (pathname?.startsWith('/dashboard') || landingFooterRoutes.includes(pathname ?? '')) {
    return null
  }

  return <Footer />
}
