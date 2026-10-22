'use client'

import React from 'react'
import TrainingReview from '../../../../components/dashboard/TrainingReview'
import { useLang } from '../../../../lib/LangContext'
import { getBusinessHeaders } from '../../../../lib/businessContext'
import PageHeader from '../../../../components/ui/PageHeader'
import { Card, CardContent } from '../../../../components/ui/Card'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
    ...getBusinessHeaders(),
  }
}

export default function TrainingReviewPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`${API}/training/corrections/${id}/approve`, {
        method: 'POST',
        headers: authHeaders()
      })
      if (!res.ok) throw new Error('Failed to approve')
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`${API}/training/corrections/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (!res.ok) throw new Error('Failed to reject')
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader title={L('Review AI Corrections', 'مراجعة تصحيحات الذكاء الاصطناعي')} description={L('Approve or reject agent overrides to train the AI and improve future responses.', 'وافق أو ارفض تعديلات الوكلاء لتدريب الذكاء الاصطناعي وتحسين الردود المستقبلية.')} breadcrumbs={[{ label: L('Training', 'التدريب'), href: '/dashboard/training' }, { label: L('Review corrections', 'مراجعة التصحيحات') }]} />
      <Card><CardContent className="p-0"><TrainingReview onApprove={handleApprove} onReject={handleReject} /></CardContent></Card>
    </main>
  )
}
