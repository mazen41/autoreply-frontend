'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../../lib/LangContext'
import {
  Search, Filter, RefreshCw, ShoppingBag, Package,
  ExternalLink, ChevronDown, ChevronUp, X
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

interface Order {
  id: string
  order_id: string
  product_name: string | null
  total: number | null
  currency: string
  status: string
  store_type: 'salla' | 'shopify' | 'woocommerce'
  customer_name: string | null
  customer_phone: string | null
  conversation_id: number
  created_at: string
}

export default function OrdersPage() {
  const { isRTL } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const L = (en: string, ar: string) => isRTL ? ar : en

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (storeFilter) params.append('store_type', storeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`${API}/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [search, storeFilter, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const statusColors: Record<string, string> = {
    delivered: 'bg-success text-success dark:bg-success/20 dark:text-success',
    processing: 'bg-info text-info dark:bg-info/20 dark:text-info',
    pending: 'bg-warning text-warning dark:bg-warning/20 dark:text-warning',
    cancelled: 'bg-error text-error dark:bg-error/20 dark:text-error',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {L('Orders', 'الطلبات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {L('Multi-store order management', 'إدارة الطلبات متعددة المتاجر')}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {L('Refresh', 'تحديث')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L('Search orders...', 'بحث في الطلبات...')}
            className="w-full h-10 pl-9 pr-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <select
          value={storeFilter}
          onChange={e => setStoreFilter(e.target.value)}
          className="h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <option value="">{L('All Stores', 'جميع المتاجر')}</option>
          <option value="salla">Salla</option>
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <option value="">{L('All Statuses', 'جميع الحالات')}</option>
          <option value="delivered">{L('Delivered', 'تم التسليم')}</option>
          <option value="processing">{L('Processing', 'قيد المعالجة')}</option>
          <option value="pending">{L('Pending', 'معلق')}</option>
          <option value="cancelled">{L('Cancelled', 'ملغي')}</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-[var(--text-secondary)]">{L('Loading orders...', 'جاري تحميل الطلبات...')}</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-subtle)] to-[var(--surface-elevated)] flex items-center justify-center mx-auto mb-5 border border-[var(--border)]">
            <ShoppingBag size={32} className="text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{L('No orders found', 'لم يتم العثور على طلبات')}</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
            {L('Orders will appear here when customers make purchases through your connected stores.', 'ستظهر الطلبات هنا عندما يقوم العملاء بالشراء من متاجرك المتصلة.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div
              key={order.id}
              className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[var(--text-primary)]">#{order.order_id}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColors[order.status] || 'bg-gray-50 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-tertiary)]">
                      {order.store_type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    {order.product_name || L('Unknown product', 'منتج غير معروف')}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                    {order.customer_name && <span>{order.customer_name}</span>}
                    {order.customer_phone && <span dir="ltr">{order.customer_phone}</span>}
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-lg text-[var(--text-primary)]">
                    {order.total ? `${order.total} ${order.currency}` : '—'}
                  </p>
                  <a
                    href={`/inbox?conversation_id=${order.conversation_id}`}
                    className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline mt-1"
                  >
                    {L('View conversation', 'عرض المحادثة')}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
