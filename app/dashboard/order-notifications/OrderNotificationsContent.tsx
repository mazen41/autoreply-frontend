'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface OrderNotificationConfig {
  enabled: boolean
  events: {
    order_created: boolean
    payment_confirmed: boolean
    processing: boolean
    shipped: boolean
    delivered: boolean
    cancelled: boolean
    refund: boolean
  }
  channels: {
    whatsapp: boolean
    email: boolean
    sms: boolean
  }
  templates: {
    order_created: string
    payment_confirmed: string
    processing: string
    shipped: string
    delivered: string
    cancelled: string
    refund: string
  }
}

export default function OrderNotificationsContent() {
  const { isRTL, t } = useLang()
  const [config, setConfig] = useState<OrderNotificationConfig>({
    enabled: true,
    events: {
      order_created: true,
      payment_confirmed: true,
      processing: true,
      shipped: true,
      delivered: true,
      cancelled: true,
      refund: true,
    },
    channels: {
      whatsapp: true,
      email: true,
      sms: false,
    },
    templates: {
      order_created: 'Your order #{order_id} has been received!',
      payment_confirmed: 'Payment confirmed for order #{order_id}. Thank you!',
      processing: 'Your order #{order_id} is being processed.',
      shipped: 'Your order #{order_id} has been shipped! Tracking: {tracking_number}',
      delivered: 'Your order #{order_id} has been delivered. Enjoy!',
      cancelled: 'Your order #{order_id} has been cancelled.',
      refund: 'Refund processed for order #{order_id}.',
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetchConfig()
    fetchHistory()
  }, [])

  const fetchConfig = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/order-notifications/config`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/order-notifications/history`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setHistory(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/order-notifications/config`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(config),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Configuration saved')
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = (event: string, value: string) => {
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [event]: value,
      },
    })
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
          Order Notifications
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Configure automatic notifications for order events
        </p>
      </motion.div>

      {/* Enable/Disable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Enable Order Notifications</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Send automatic notifications for order events</p>
        </div>
        <button
          onClick={() => setConfig({ ...config, enabled: !config.enabled })}
          className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </motion.div>

      {/* Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Order Events
        </h2>
        <div className="space-y-3">
          {Object.entries(config.events).map(([event, enabled]) => (
            <div key={event} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{event.replace('_', ' ')}</span>
              <button
                onClick={() => setConfig({
                  ...config,
                  events: { ...config.events, [event]: !enabled }
                })}
                className={`w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Channels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Notification Channels
        </h2>
        <div className="space-y-3">
          {Object.entries(config.channels).map(([channel, enabled]) => (
            <div key={channel} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{channel}</span>
              <button
                onClick={() => setConfig({
                  ...config,
                  channels: { ...config.channels, [channel]: !enabled }
                })}
                className={`w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Message Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Message Templates
        </h2>
        <div className="space-y-4">
          {Object.entries(config.templates).map(([event, template]) => (
            <div key={event}>
              <label className="block text-sm font-medium mb-2 capitalize" style={{ color: 'var(--text-secondary)' }}>
                {event.replace('_', ' ')}
              </label>
              <textarea
                value={template}
                onChange={(e) => updateTemplate(event, e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Available variables: {'{order_id}'}, {'{tracking_number}'}, {'{customer_name}'}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notification History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Notification History
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            No notifications sent yet
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {item.event_type.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'sent' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Order #{item.order_id} • {new Date(item.created_at).toLocaleString()}
                </p>
                {item.error_message && (
                  <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
                    Error: {item.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
          style={{ background: saving ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
        >
          {saving && (
            <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
          )}
          Save Configuration
        </button>
      </motion.div>
    </div>
  )
}