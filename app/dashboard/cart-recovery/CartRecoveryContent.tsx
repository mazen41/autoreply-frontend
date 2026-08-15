'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface AbandonedCart {
  id: number
  business_id: number
  customer_id: number | null
  external_cart_id: string
  source_platform: string
  total_value: number
  currency: string
  item_count: number
  items: any[]
  recovery_status: string
  abandoned_at: string
  last_contacted_at: string | null
  contact_history: any[]
  customer?: any
}

export default function CartRecoveryContent() {
  const { isRTL, t } = useLang()
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [recoveryMessage, setRecoveryMessage] = useState('')

  useEffect(() => {
    fetchCarts()
    fetchStats()
  }, [])

  const fetchCarts = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cart-recovery?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setCarts(data)
      }
    } catch (error) {
      console.error('Failed to fetch carts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cart-recovery/stats`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSendRecovery = async () => {
    if (!selectedCart || !recoveryMessage.trim()) {
      toast.error('Please enter a recovery message')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cart-recovery/${selectedCart.id}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ message: recoveryMessage }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Recovery message sent')
        setShowMessageModal(false)
        setRecoveryMessage('')
        setSelectedCart(null)
        fetchCarts()
        fetchStats()
      } else {
        toast.error(data.error || 'Failed to send recovery message')
      }
    } catch (error) {
      toast.error('Failed to send recovery message')
    }
  }

  const handleProcessPending = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cart-recovery/process-pending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Pending carts processed')
        fetchCarts()
        fetchStats()
      } else {
        toast.error('Failed to process pending carts')
      }
    } catch (error) {
      toast.error('Failed to process pending carts')
    }
  }

  const handleMarkRecovered = async (cartId: number) => {
    if (!confirm('Mark this cart as recovered?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cart-recovery/${cartId}/recovered`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Cart marked as recovered')
        fetchCarts()
        fetchStats()
      } else {
        toast.error('Failed to mark cart as recovered')
      }
    } catch (error) {
      toast.error('Failed to mark cart as recovered')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Cart Recovery
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Recover abandoned carts and increase revenue
        </p>
      </motion.div>

      {/* Statistics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Abandoned</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total_abandoned}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Recovered</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.recovered}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Recovery Rate</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.recovery_rate}%</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Recovered Value</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>${stats.recovered_value.toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="recovered">Recovered</option>
          <option value="contacted">Contacted</option>
        </select>
        <button
          onClick={() => fetchCarts()}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Apply Filter
        </button>
        <button
          onClick={handleProcessPending}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)', color: 'var(--accent)' }}
        >
          Process Pending
        </button>
      </motion.div>

      {/* Carts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {carts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No abandoned carts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {carts.map((cart) => (
              <div
                key={cart.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium capitalize" style={{ color: 'var(--accent)' }}>
                        {cart.source_platform}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        cart.recovery_status === 'recovered' ? 'bg-green-500/20 text-green-500' :
                        cart.recovery_status === 'contacted' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {cart.recovery_status}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                      {cart.item_count} items • ${cart.total_value.toFixed(2)} {cart.currency}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Abandoned: {new Date(cart.abandoned_at).toLocaleString()}</span>
                      {cart.last_contacted_at && <span>Last contacted: {new Date(cart.last_contacted_at).toLocaleString()}</span>}
                    </div>
                    {cart.contact_history && cart.contact_history.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Contact History:</p>
                        {cart.contact_history.slice(-2).map((history: any, index: number) => (
                          <p key={index} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {history.action} - {new Date(history.timestamp).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cart.recovery_status === 'pending' && (
                      <button
                        onClick={() => { setSelectedCart(cart); setShowMessageModal(true) }}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        Send Recovery
                      </button>
                    )}
                    {cart.recovery_status !== 'recovered' && (
                      <button
                        onClick={() => handleMarkRecovered(cart.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                      >
                        Mark Recovered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Send Recovery Message Modal */}
      {showMessageModal && selectedCart && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Send Recovery Message
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Cart Value: ${selectedCart.total_value.toFixed(2)} {selectedCart.currency}
                </label>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Items: {selectedCart.item_count}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Recovery Message
                </label>
                <textarea
                  value={recoveryMessage}
                  onChange={(e) => setRecoveryMessage(e.target.value)}
                  placeholder="You left items in your cart! Complete your purchase now."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowMessageModal(false); setSelectedCart(null); setRecoveryMessage('') }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendRecovery}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}