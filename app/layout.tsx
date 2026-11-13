import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import 'lenis/dist/lenis.css'
import { LangProvider } from '../lib/LangContext'
import type { Language } from '../lib/i18n'
import { ThemeProvider } from '../lib/ThemeContext'
import { AuthProvider } from '../lib/AuthContext'
import { Space_Grotesk, Cairo } from 'next/font/google'
import FooterWrapper from '../components/FooterWrapper'
import InternalAnalytics from '../components/analytics/InternalAnalytics'

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nazbiz.io'),
  title: {
    default: 'Naz AutoReply — Autonomous Conversational AI & Omnichannel Automation',
    template: '%s | Naz AutoReply',
  },
  description:
    'Automate customer conversations across WhatsApp, Instagram, Telegram, TikTok, Salla, and Shopify with intelligent AI-powered replies, live order tracking, and custom workflows.',
  keywords: [
    'AI customer support',
    'WhatsApp automation',
    'Instagram DM automation',
    'Salla store AI',
    'Shopify AI assistant',
    'Conversational AI',
    'Naz AutoReply',
    'أتمتة خدمة العملاء',
    'رد آلي واتساب',
    'ذكاء اصطناعي للمتاجر',
  ],
  authors: [{ name: 'Naz AutoReply Team' }],
  creator: 'Naz AutoReply',
  publisher: 'Naz AutoReply',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icons/logo_icon.png',
    shortcut: '/icons/logo_icon.png',
    apple: '/icons/logo_icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    url: '/',
    title: 'Naz AutoReply — Autonomous Conversational AI Platform',
    description:
      'Every Conversation. One Intelligent AI. Connect WhatsApp, Instagram, Telegram, and e-commerce stores with intelligent autonomous support.',
    siteName: 'Naz AutoReply',
    images: [
      {
        url: '/icons/logo_icon.png',
        width: 512,
        height: 512,
        alt: 'Naz AutoReply Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naz AutoReply — Autonomous Conversational AI Platform',
    description:
      'Automate customer conversations across WhatsApp, Instagram, Telegram, and your online store with AI-powered replies.',
    images: ['/icons/logo_icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the saved theme cookie on the server so the very first paint
  // already matches the visitor's choice — avoids a dark-then-light flash.
  const cookieStore = await cookies()
  const savedTheme = cookieStore.get('naz-theme')?.value
  const savedLanguage = cookieStore.get('naz-lang')?.value
  const initialLang: Language = savedLanguage === 'en' ? 'en' : 'ar'
  const isLight = savedTheme === 'light'

  return (
    <html lang={initialLang} dir={initialLang === 'ar' ? 'rtl' : 'ltr'} className={isLight ? '' : 'dark'} suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${cairo.variable}`}>
        <InternalAnalytics />
        {/* Ambient background glows */}
        <div className="os-bg" aria-hidden="true">
          <div className="orb-lime" />
          <div className="orb-cyan" />
        </div>

        <ThemeProvider>
          <LangProvider initialLang={initialLang}>
            <AuthProvider>
              <div className="relative z-10 flex min-h-screen flex-col">
                <div className="flex-1">
                  {children}
                </div>
                <FooterWrapper />
              </div>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
