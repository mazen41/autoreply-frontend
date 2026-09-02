'use client'

import React from 'react'
import TrainingReview from '../../../../components/dashboard/TrainingReview'
import { motion } from 'framer-motion'
import { useLang } from '../../../../lib/LangContext'

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
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-black/20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          {L('Review AI Corrections', 'مراجعة تصحيحات الذكاء الاصطناعي')}
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl">
          {L('Approve or reject agent overrides to train the AI and improve future responses.', 'وافق أو ارفض تعديلات الوكلاء لتدريب الذكاء الاصطناعي وتحسين الردود المستقبلية.')}
        </p>
      </motion.div>

      <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <TrainingReview onApprove={handleApprove} onReject={handleReject} />
      </div>
    </div>
  )
}
