import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create AI Bot | Naz AutoReply',
  description: 'Design and bring your custom AI bot to life with Naz AutoReply.',
}

export default function BotCreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-white selection:bg-brand selection:text-white">
      {children}
    </div>
  )
}
