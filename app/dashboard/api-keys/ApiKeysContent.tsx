'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface ApiKey {
  id: number
  business_id: number
  name: string
  key: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export default function ApiKeysContent() {
  const { isRTL, t } = useLang()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    scopes: [] as string[],
    expires_at: '',
  })

  const availableScopes = [
    'conversations:read',
    'conversations:write',
    'customers:read',
    'customers:write',
    'messages:read',
    'messages:write',
    'analytics:read',
    'webhooks:write',
  ]

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setApiKeys(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name || form.scopes.length === 0) {
      toast.error('Please enter a name and select at least one scope')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys`, {
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
        setNewKey(data.key)
        setForm({ name: '', scopes: [], expires_at: '' })
        fetchApiKeys()
      } else {
        toast.error(data.error || 'Failed to create API key')
      }
    } catch (error) {
      toast.error('Failed to create API key')
    }
  }

  const handleRevoke = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('API key revoked')
        fetchApiKeys()
      } else {
        toast.error('Failed to revoke API key')
      }
    } catch (error) {
      toast.error('Failed to revoke API key')
    }
  }

  const handleToggle = async (keyId: number, isActive: boolean) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('API key status updated')
        fetchApiKeys()
      } else {
        toast.error('Failed to update API key status')
      }
    } catch (error) {
      toast.error('Failed to update API key status')
    }
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('API key copied to clipboard')
  }

  const toggleScope = (scope: string) => {
    if (form.scopes.includes(scope)) {
      setForm({ ...form, scopes: form.scopes.filter(s => s !== scope) })
    } else {
      setForm({ ...form, scopes: [...form.scopes, scope] })
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
          API Keys
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage API keys for external integrations
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
        >
          + Create API Key
        </button>
      </motion.div>

      {/* API Keys List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No API keys created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              Create Your First API Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{apiKey.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${apiKey.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-elevated)', color: 'var(--text-tertiary)' }}>
                        {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                      </code>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Scopes: {apiKey.scopes.join(', ')}</span>
                      {apiKey.last_used_at && <span>Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</span>}
                      <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(apiKey.id, apiKey.is_active)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      {apiKey.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create API Key Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            {newKey ? (
              <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  API Key Created
                </h3>
                <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Copy this key now. You won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs px-2 py-2 rounded break-all" style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                      {newKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKey)}
                      className="text-xs px-3 py-2 rounded-lg transition-colors"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowModal(false); setNewKey(null) }}
                    className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  Create API Key
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Integration App"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Scopes *</label>
                    <div className="space-y-2">
                      {availableScopes.map((scope) => (
                        <label key={scope} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.scopes.includes(scope)}
                            onChange={() => toggleScope(scope)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Expires At (optional)</label>
                    <input
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
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
                    Create Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}