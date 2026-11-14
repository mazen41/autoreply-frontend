import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit AI Bot | Naz AutoReply',
  description: 'Customize and update your AI bot with Naz AutoReply.',
}

export default function BotEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-white selection:bg-brand selection:text-white">
      {children}
    </div>
  )
}
