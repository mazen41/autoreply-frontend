'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'

interface WooCommerceConnectProps {
  isConnected: boolean
  channel?: any
  onConnect: (data: { store_url: string; consumer_key: string; consumer_secret: string }) => Promise<void>
  onDisconnect: () => Promise<void>
}

export default function WooCommerceConnect({ isConnected, channel, onConnect, onDisconnect }: WooCommerceConnectProps) {
  const { t, isRTL } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  
  const [formData, setFormData] = useState({
    store_url: '',
    consumer_key: '',
    consumer_secret: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onConnect(formData)
    } catch (err: any) {
      setError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  if (isConnected && channel) {
    return (
      <div
        className="p-6 rounded-xl"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/icons/woocommerce-icon.png"
              alt="WooCommerce"
              className="w-12 h-12 rounded-lg"
              style={{ background: '#96588a', padding: '8px' }}
            />
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                WooCommerce
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {channel.page_name}
              </p>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
          >
            Connected
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">Store URL:</span> {channel.metadata?.store_url || channel.page_id}
          </div>
        </div>

        <button
          onClick={onDisconnect}
          disabled={loading}
          className="w-full px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {loading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <img
          src="/icons/woocommerce-icon.png"
          alt="WooCommerce"
          className="w-12 h-12 rounded-lg"
          style={{ background: '#96588a', padding: '8px' }}
        />
        <div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            WooCommerce
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect your WooCommerce store
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Store URL
          </label>
          <input
            type="url"
            placeholder="https://mystore.com"
            value={formData.store_url}
            onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-focus)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Consumer Key
          </label>
          <input
            type="text"
            placeholder="ck_xxxxxxxxxxxx"
            value={formData.consumer_key}
            onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-focus)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Consumer Secret
          </label>
          <input
            type="password"
            placeholder="cs_xxxxxxxxxxxx"
            value={formData.consumer_secret}
            onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-focus)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowInstructions(true)}
          className="text-sm font-semibold transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          How to get these keys? →
        </button>

        {error && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: loading ? 'var(--accent-focus)' : 'var(--accent)',
            border: '1px solid var(--accent-focus)',
            color: 'white',
          }}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      {showInstructions && (
        <WooCommerceInstructions onClose={() => setShowInstructions(false)} />
      )}
    </div>
  )
}

function WooCommerceInstructions({ onClose }: { onClose: () => void }) {
  const { t, isRTL } = useLang()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          How to connect your WooCommerce store
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              1
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Go to your WordPress admin panel
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                URL: yourstore.com/wp-admin
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Log in with your admin account.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              2
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Navigate to WooCommerce API settings
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Go to: WooCommerce → Settings → Advanced → REST API
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Click the "REST API" tab at the top of the page.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              3
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Create a new API key
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Click the "Add key" button.
              </p>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Fill in:
              </p>
              <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                <li>• Description: NazBiz (or any name you prefer)</li>
                <li>• User: Select your admin user</li>
                <li>• Permissions: Select "Read"</li>
              </ul>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Then click "Generate API key".
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              4
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Copy your credentials
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                You will see 3 important values on the screen:
              </p>
              <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                <li>• Consumer Key (starts with ck_)</li>
                <li>• Consumer Secret (starts with cs_)</li>
              </ul>
              <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--accent)' }}>
                IMPORTANT: Copy them immediately — the Consumer Secret is only shown once.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              5
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Paste into NazBiz
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Come back to NazBiz and paste:
              </p>
              <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                <li>• Your store URL (e.g. https://mystore.com)</li>
                <li>• Consumer Key</li>
                <li>• Consumer Secret</li>
              </ul>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Then click Connect.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}