'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface Subscription {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
  package: {
    id: number
    name: string
    name_ar: string
  }
  status: string
  billing_cycle: string
  amount_paid: number
  moyasar_payment_id: string
  moyasar_invoice_id: string
  starts_at: string
  ends_at: string
  cancelled_at: string | null
  created_at: string
}

export default function AdminPaymentsPage() {
  const { t, isRTL } = useLang()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [page, search, statusFilter])

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }

      const data = await response.json()
      setSubscriptions(data.data)
      setTotalPages(Math.ceil(data.total / data.per_page))
    } catch (error: any) {
      console.error('Failed to fetch subscriptions:', error)
      setError(error.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (subscriptionId: number, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      fetchSubscriptions()
    } catch (error: any) {
      console.error('Failed to update subscription:', error)
      setError(error.message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} SAR`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#00FFB2'
      case 'cancelled':
        return '#FF6B6B'
      case 'expired':
        return '#FFA500'
      case 'trial':
        return '#00BFFF'
      default:
        return 'rgba(240,240,255,0.6)'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'المدفوعات والاشتراكات' : 'Payments & Subscriptions'}
        </h1>
        <p style={{ color: 'rgba(240,240,255,0.6)' }}>
          {isRTL ? 'إدارة المدفوعات وحالة الاشتراكات' : 'Manage payments and subscription status'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={isRTL ? 'بحث بالمستخدم...' : 'Search by user...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-transparent"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F0F0FF',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-transparent"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F0F0FF',
          }}
        >
          <option value="">{isRTL ? 'كل الحالات' : 'All Status'}</option>
          <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
          <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
          <option value="expired">{isRTL ? 'منتهي' : 'Expired'}</option>
          <option value="trial">{isRTL ? 'تجريبي' : 'Trial'}</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0F0F1A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'المستخدم' : 'User'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الباقة' : 'Package'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'المبلغ' : 'Amount'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الحالة' : 'Status'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'تاريخ البدء' : 'Start Date'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
              </th>
              <th className="text-right p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="p-4">
                  <div>
                    <div className="font-bold" style={{ color: '#F0F0FF' }}>{sub.user.name}</div>
                    <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>{sub.user.email}</div>
                  </div>
                </td>
                <td className="p-4" style={{ color: '#F0F0FF' }}>
                  {isRTL ? sub.package.name_ar : sub.package.name}
                </td>
                <td className="p-4">
                  <span className="font-bold" style={{ color: '#00FFB2' }}>
                    {formatCurrency(sub.amount_paid)}
                  </span>
                  <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {sub.billing_cycle}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `${getStatusColor(sub.status)}20`,
                      color: getStatusColor(sub.status),
                    }}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {formatDate(sub.starts_at)}
                </td>
                <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {formatDate(sub.ends_at)}
                </td>
                <td className="p-4 text-right">
                  <select
                    value={sub.status}
                    onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                    className="px-3 py-1 rounded-lg text-xs bg-transparent"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F0F0FF',
                    }}
                  >
                    <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
                    <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
                    <option value="expired">{isRTL ? 'منتهي' : 'Expired'}</option>
                    <option value="trial">{isRTL ? 'تجريبي' : 'Trial'}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscriptions.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'لا توجد اشتراكات' : 'No subscriptions found'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#F0F0FF',
            }}
          >
            {isRTL ? '→' : '←'}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                page === p ? 'ring-2 ring-[#00FFB2]' : ''
              }`}
              style={{
                background: page === p ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                color: page === p ? '#00FFB2' : '#F0F0FF',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#F0F0FF',
            }}
          >
            {isRTL ? '←' : '→'}
          </button>
        </div>
      )}
    </div>
  )
}
