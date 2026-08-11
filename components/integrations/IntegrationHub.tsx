'use client'

import React from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import IntegrationManagement from '../IntegrationManagement'

export default function IntegrationHub({ businessId }: { businessId: number }) {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()

  if (!businessId) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
      </div>
    )
  }

  return <IntegrationManagement businessId={businessId} />
}