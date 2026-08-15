'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface Booking {
  id: number
  business_id: number
  customer_id: number
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_name: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  confirmation_number: string
  created_at: string
}

export default function BookingsContent() {
  const { isRTL, t } = useLang()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Form state
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_name: '',
    start_time: '',
    end_time: '',
    notes: '',
  })

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [])

  const fetchBookings = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/stats`, {
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

  const handleCreate = async () => {
    if (!form.customer_name || !form.service_name || !form.start_time || !form.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Booking created successfully')
        setShowModal(false)
        setForm({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          service_name: '',
          start_time: '',
          end_time: '',
          notes: '',
        })
        fetchBookings()
        fetchStats()
      } else {
        toast.error(data.error || 'Failed to create booking')
      }
    } catch (error) {
      toast.error('Failed to create booking')
    }
  }

  const handleConfirm = async (bookingId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Booking confirmed')
        fetchBookings()
        fetchStats()
      } else {
        toast.error('Failed to confirm booking')
      }
    } catch (error) {
      toast.error('Failed to confirm booking')
    }
  }

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Booking cancelled')
        fetchBookings()
        fetchStats()
      } else {
        toast.error('Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  const handleComplete = async (bookingId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Booking completed')
        fetchBookings()
        fetchStats()
      } else {
        toast.error('Failed to complete booking')
      }
    } catch (error) {
      toast.error('Failed to complete booking')
    }
  }

  const checkAvailability = async () => {
    if (!form.start_time || !form.end_time) {
      toast.error('Please select start and end times')
      return
    }

    setCheckingAvailability(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/check-availability`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          start_time: form.start_time,
          end_time: form.end_time,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.available) {
          toast.success('Time slot is available')
        } else {
          toast.error('Time slot is not available')
        }
      } else {
        toast.error(data.error || 'Failed to check availability')
      }
    } catch (error) {
      toast.error('Failed to check availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const getAvailableSlots = async () => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bookings/available-slots?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()

      if (res.ok) {
        setAvailableSlots(data.available_slots || [])
      } else {
        toast.error(data.error || 'Failed to fetch available slots')
      }
    } catch (error) {
      toast.error('Failed to fetch available slots')
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
          Bookings
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage your appointments and scheduling
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
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Confirmed</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.confirmed}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Pending</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.pending}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Completed</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.completed}</p>
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
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => fetchBookings()}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Apply Filter
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
        >
          + New Booking
        </button>
      </motion.div>

      {/* Bookings List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No bookings found</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              Create Booking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{booking.customer_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        booking.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {booking.service_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>#{booking.confirmation_number}</span>
                      <span>{new Date(booking.start_time).toLocaleString()}</span>
                      {booking.customer_phone && <span>{booking.customer_phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        Complete
                      </button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Create Booking
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Customer Name *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Customer Email</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  placeholder="Enter customer email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Customer Phone</label>
                <input
                  type="text"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="Enter customer phone"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Service Name *</label>
                <input
                  type="text"
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  placeholder="Enter service name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>End Time *</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <button
                onClick={checkAvailability}
                disabled={checkingAvailability}
                className="w-full px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {checkingAvailability ? 'Checking...' : 'Check Availability'}
              </button>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}