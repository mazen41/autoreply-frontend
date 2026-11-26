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
import InPageDialogProvider from '../components/ui/InPageDialogProvider'

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
    default: 'Nazeer Business | AI customer messaging',
    template: '%s | Nazeer Business',
  },
  description:
    'ندير مراسلاتك و مبيعاتك بذكاء. أتمتة محادثات العملاء عبر واتساب، إنستغرام، تيليجرام، تيك توك، سلة وشوبيفاي مع ردود ذكية وتتبع طلبات مباشر.',
  keywords: [
    'AI customer support',
    'WhatsApp automation',
    'Instagram DM automation',
    'Salla store AI',
    'Shopify AI assistant',
    'Conversational AI',
    'Nazeer Business',
    'NazBiz',
    'أتمتة خدمة العملاء',
    'رد آلي واتساب',
    'ذكاء اصطناعي للمتاجر',
  ],
  authors: [{ name: 'Nazeer Business Team' }],
  creator: 'Nazeer Business',
  publisher: 'Nazeer Business',
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
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    url: '/',
    title: 'Naz AutoReply — ندير مراسلاتك و مبيعاتك بذكاء',
    description:
      'ندير مراسلاتك و مبيعاتك بذكاء. كل المحادثات والمبيعات من منصة ذكاء اصطناعي واحدة متكاملة مع واتساب، إنستغرام، والمتاجر الإلكترونية.',
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
    title: 'Naz AutoReply — ندير مراسلاتك و مبيعاتك بذكاء',
    description:
      'ندير مراسلاتك و مبيعاتك بذكاء. كل المحادثات والمبيعات من منصة ذكاء اصطناعي واحدة متكاملة.',
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
              <InPageDialogProvider>
                <div className="relative z-10 flex min-h-screen flex-col">
                  <div className="flex-1">
                    {children}
                  </div>
                  <FooterWrapper />
                </div>
              </InPageDialogProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
