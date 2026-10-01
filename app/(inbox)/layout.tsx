'use client'

import React from 'react'

export default function InboxStandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
