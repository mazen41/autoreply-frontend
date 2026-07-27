import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { LangProvider } from '../lib/LangContext'
import { ThemeProvider } from '../lib/ThemeContext'
import { Space_Grotesk, Cairo } from 'next/font/google'
import FooterWrapper from '../components/FooterWrapper'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Naz — AI Customer Support Automation',
  description: 'Naz is an AI platform that automatically replies to your customers on WhatsApp, Instagram, and Facebook — 24/7. Handle customer support, lead qualification, and content creation with intelligent automation.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the saved theme cookie on the server so the very first paint
  // already matches the visitor's choice — avoids a dark-then-light flash.
  const cookieStore = await cookies()
  const savedTheme = cookieStore.get('naz-theme')?.value
  const isLight = savedTheme === 'light'

  return (
    <html lang="ar" dir="rtl" className={isLight ? '' : 'dark'} suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${cairo.variable}`}>
        {/* AI Operating System background — persists across all pages */}
        <div className="os-bg" aria-hidden="true">
          <div className="orb-lime" />
          <div className="orb-cyan" />
        </div>

        <ThemeProvider>
          <LangProvider>
            <div className="relative z-10 flex flex-col min-h-screen">
              <div className="flex-1">
                {children}
              </div>
              <FooterWrapper />
            </div>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
