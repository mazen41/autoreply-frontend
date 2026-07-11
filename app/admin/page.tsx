'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../lib/LangContext'

interface DashboardStats {
  total_users: number
  active_subscriptions: number
  total_revenue: number
  total_channels: number
  total_messages: number
  total_conversations: number
  users_this_month: number
  revenue_this_month: number
}

interface User {
  id: number
  name: string
  email: string
  created_at: string
  is_admin: boolean
}

interface Subscription {
  id: number
  user: User
  package: any
  amount_paid: number
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const { t, isRTL } = useLang()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setStats(data.stats)
      setRecentUsers(data.recent_users)
      setRecentSubscriptions(data.recent_subscriptions)
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error)
      setError(error.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p style={{ color: 'rgba(240,240,255,0.6)' }}>
          {isRTL ? 'نظرة عامة على أداء المنصة' : 'Overview of platform performance'}
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label={isRTL ? 'إجمالي المستخدمين' : 'Total Users'}
            value={stats.total_users}
            change={stats.users_this_month}
            changeLabel={isRTL ? 'هذا الشهر' : 'this month'}
            isRTL={isRTL}
          />
          <StatCard
            label={isRTL ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
            value={stats.active_subscriptions}
            isRTL={isRTL}
          />
          <StatCard
            label={isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}
            value={formatCurrency(stats.total_revenue)}
            change={formatCurrency(stats.revenue_this_month)}
            changeLabel={isRTL ? 'هذا الشهر' : 'this month'}
            isRTL={isRTL}
          />
          <StatCard
            label={isRTL ? 'القنوات المتصلة' : 'Connected Channels'}
            value={stats.total_channels}
            isRTL={isRTL}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'المستخدمون الجدد' : 'Recent Users'}
          </h2>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: '#F0F0FF' }}>{user.name}</div>
                    <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>{formatDate(user.created_at)}</div>
                  {user.is_admin && (
                    <div className="text-xs" style={{ color: '#00FFB2' }}>
                      {isRTL ? 'مسؤول' : 'Admin'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'الاشتراكات الأخيرة' : 'Recent Subscriptions'}
          </h2>
          <div className="space-y-3">
            {recentSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div>
                  <div className="font-bold" style={{ color: '#F0F0FF' }}>{sub.user.name}</div>
                  <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {sub.package?.name || 'Unknown'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: '#00FFB2' }}>{formatCurrency(sub.amount_paid)}</div>
                  <div className="text-sm" style={{ color: sub.status === 'active' ? '#00FFB2' : '#FF6B6B' }}>
                    {sub.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'إجمالي الرسائل' : 'Total Messages'}
            </h3>
            <div className="text-3xl font-black" style={{ color: '#00FFB2' }}>
              {stats.total_messages.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'إجمالي المحادثات' : 'Total Conversations'}
            </h3>
            <div className="text-3xl font-black" style={{ color: '#00FFB2' }}>
              {stats.total_conversations.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, change, changeLabel, isRTL }: {
  label: string
  value: string | number
  change?: string | number
  changeLabel?: string
  isRTL: boolean
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
      <div className="text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
        {label}
      </div>
      <div className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
        {value}
      </div>
      {change !== undefined && (
        <div className="text-sm" style={{ color: '#00FFB2' }}>
          +{change} {changeLabel}
        </div>
      )}
    </div>
  )
}
