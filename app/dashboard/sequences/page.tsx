'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import SequenceManager from '../../../components/sequences/SequenceManager'

export default function SequencesPage() {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessId = async () => {
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const user = await response.json()
        
        if (user.business_id) {
          setBusinessId(user.business_id)
        }
      } catch (error) {
        console.error('Failed to fetch business ID:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessId()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t.nav.sequences}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'إدارة تسلسلات المراسلة التلقائية' : 'Manage automated messaging sequences'}
          </p>
        </div>

        {businessId ? <SequenceManager businessId={businessId} /> : (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
          </div>
        )}
      </div>
    </div>
  )
}