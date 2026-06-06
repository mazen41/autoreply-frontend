import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '../lib/LangContext'
import { ThemeProvider } from '../lib/ThemeContext'

export const metadata: Metadata = {
  title: 'Naz — موظفك الذكي الذي لا ينام',
  description: 'AI-powered auto-reply platform for businesses. Automatically reply to customer messages across all channels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body>
        {/* AI Operating System background — persists across all pages */}
        <div className="os-bg" aria-hidden="true">
          <div className="orb-lime" />
          <div className="orb-cyan" />
        </div>

        <ThemeProvider>
          <LangProvider>
            <div className="relative z-10">
              {children}
            </div>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
