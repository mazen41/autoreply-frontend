'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '../../../lib/LangContext'
import {
  Search, RefreshCw, ShoppingBag,
  ExternalLink
} from 'lucide-react'
import Select from '../../../components/ui/Select'
import { getBusinessHeaders } from '../../../lib/businessContext'

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
  store_name?: string | null
  customer_name: string | null
  customer_phone: string | null
  conversation_id?: number | null
  created_at: string
}

export default function OrdersPage() {
  const { isRTL } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const requestVersion = useRef(0)
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const fetchOrders = useCallback(async () => {
    const version = ++requestVersion.current
    setLoading(true)
    setLoadError('')
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجدداً.'))
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (storeFilter) params.append('store_type', storeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`${API}/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (res.ok) {
        const data = await res.json()
        if (version === requestVersion.current) setOrders(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
      } else {
        if (version === requestVersion.current) {
          setOrders([])
          setLoadError(L('Orders could not be loaded for the selected business.', 'تعذر تحميل طلبات النشاط التجاري المحدد.'))
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      if (version === requestVersion.current) {
        setOrders([])
        setLoadError(L('Orders could not be loaded. Check your connection and try again.', 'تعذر تحميل الطلبات. تحقق من الاتصال وحاول مرة أخرى.'))
      }
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [debouncedSearch, storeFilter, statusFilter, L])

  useEffect(() => {
    void fetchOrders()
    const refreshForBusiness = () => { setOrders([]); void fetchOrders() }
    window.addEventListener('naz:business-changed', refreshForBusiness)
    window.addEventListener('storage', refreshForBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', refreshForBusiness)
      window.removeEventListener('storage', refreshForBusiness)
    }
  }, [fetchOrders])

  const statusColors: Record<string, string> = {
    delivered: 'bg-success text-success dark:bg-success/20 dark:text-success',
    processing: 'bg-info text-info dark:bg-info/20 dark:text-info',
    pending: 'bg-warning text-warning dark:bg-warning/20 dark:text-warning',
    cancelled: 'bg-error text-error dark:bg-error/20 dark:text-error',
  }

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
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
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-brand hover:bg-brand/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {L('Refresh', 'تحديث')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] ltr:left-3 rtl:right-3" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L('Search orders...', 'بحث في الطلبات...')}
            className="h-10 w-full rounded-xl border border-border bg-surface-elevated/50 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            value={storeFilter}
            onValueChange={setStoreFilter}
            options={[
              { value: '', label: L('All Stores', 'جميع المتاجر') },
              { value: 'salla', label: 'Salla' },
              { value: 'shopify', label: 'Shopify' },
              { value: 'woocommerce', label: 'WooCommerce' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: '', label: L('All Statuses', 'جميع الحالات') },
              { value: 'delivered', label: L('Delivered', 'تم التسليم') },
              { value: 'processing', label: L('Processing', 'قيد المعالجة') },
              { value: 'pending', label: L('Pending', 'معلق') },
              { value: 'cancelled', label: L('Cancelled', 'ملغي') },
            ]}
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-[var(--text-secondary)]">{L('Loading orders...', 'جاري تحميل الطلبات...')}</p>
          </div>
        </div>
      ) : loadError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-error/25 bg-error/5 py-12 text-center text-sm text-text-secondary"><p>{loadError}</p><button type="button" onClick={() => void fetchOrders()} className="rounded-lg border border-border bg-surface px-3 py-2 font-medium text-text-primary hover:border-brand">{L('Retry', 'إعادة المحاولة')}</button></div>
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
                      {order.store_name || order.store_type}
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
                    {order.total != null ? `${order.total} ${order.currency}` : '—'}
                  </p>
                  {order.conversation_id && <Link
                    href={`/inbox?conversation_id=${order.conversation_id}`}
                    className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline mt-1"
                  >
                    {L('View conversation', 'عرض المحادثة')}
                    <ExternalLink size={10} />
                  </Link>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
