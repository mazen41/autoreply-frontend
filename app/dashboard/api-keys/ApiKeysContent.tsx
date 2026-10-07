'use client'

import React, { useState, useEffect } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Shield,
  Clock,
  Calendar,
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import EmptyState from '../../../components/ui/EmptyState'
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

const SCOPE_GROUPS = [
  {
    category: 'Conversations & Messaging',
    scopes: [
      { id: 'conversations:read', label: 'Read Conversations', desc: 'Query conversation threads and metadata' },
      { id: 'conversations:write', label: 'Manage Conversations', desc: 'Create, update, assign, and resolve threads' },
      { id: 'messages:read', label: 'Read Messages', desc: 'Access message history and attachments' },
      { id: 'messages:write', label: 'Send Messages', desc: 'Dispatch replies and initiate outbound chats' },
    ],
  },
  {
    category: 'Customer Data & CRM',
    scopes: [
      { id: 'customers:read', label: 'Read Contacts', desc: 'Retrieve customer profiles, tags, and custom fields' },
      { id: 'customers:write', label: 'Manage Contacts', desc: 'Upsert customers and sync demographic tags' },
    ],
  },
  {
    category: 'Analytics & Webhooks',
    scopes: [
      { id: 'analytics:read', label: 'Read Analytics', desc: 'Fetch KPIs, bot performance, and volume reports' },
      { id: 'webhooks:write', label: 'Manage Webhooks', desc: 'Configure inbound and outbound event triggers' },
    ],
  },
]

export default function ApiKeysContent() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    scopes: ['conversations:read', 'messages:read'] as string[],
    expires_at: '',
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error('Your session expired. Sign in again to load API keys.')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || `Could not load API keys (HTTP ${res.status}).`)
      const fetched = Array.isArray(data) ? data : (data.data || [])
      setApiKeys(fetched)
      setLoadError(null)
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Could not load API keys.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Please assign an identifier name for the API key')
      return
    }
    if (form.scopes.length === 0) {
      toast.error('Please enable at least one permission scope')
      return
    }

    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error('Your session expired. Sign in again to create API keys.')

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

      if (res.ok && data.key) {
        setNewKey(data.key)
        setForm({ name: '', scopes: ['conversations:read'], expires_at: '' })
        fetchApiKeys()
        toast.success('API Key generated successfully')
      } else {
        toast.error(data.error || data.message || 'Failed to create API key')
      }
    } catch {
      toast.error('Failed to create API key')
    }
  }

  const handleRevoke = async (keyId: number) => {
    if (!confirm('Are you sure you want to permanently revoke this API key? External systems using it will immediately cease working.')) return

    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error('Your session expired. Sign in again.')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      if (!res.ok) throw new Error('Revoke request failed.')
      setApiKeys(prev => prev.filter(k => k.id !== keyId))
      toast.success('API Key revoked')
    } catch {
      toast.error('Failed to revoke API key')
    }
  }

  const handleToggle = async (keyId: number, currentStatus: boolean) => {
    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error('Your session expired. Sign in again.')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
      if (!res.ok) throw new Error('Status update failed.')
      setApiKeys(prev =>
        prev.map(k => (k.id === keyId ? { ...k, is_active: !currentStatus } : k))
      )
      toast.success(`API Key ${!currentStatus ? 'activated' : 'disabled'}`)
    } catch {
      toast.error('Failed to update API key status')
    }
  }

  const copyToClipboard = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Secret key copied to clipboard')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const toggleScope = (scopeId: string) => {
    setForm(prev => {
      const exists = prev.scopes.includes(scopeId)
      return {
        ...prev,
        scopes: exists ? prev.scopes.filter(s => s !== scopeId) : [...prev.scopes, scopeId],
      }
    })
  }

  const activeKeysCount = apiKeys.filter(k => k.is_active).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">Loading API credentials...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Provision programmatic authentication tokens to interface with NazBiz APIs, automated webhooks, and third-party CRM connectors."
        badge={
          <Badge variant="outline" size="sm" className="font-mono">
            REST API v2
          </Badge>
        }
        primaryAction={
          <Button
            variant="primary"
            onClick={() => {
              setNewKey(null)
              setShowModal(true)
            }}
            icon={<Plus size={14} />}
          >
            Create API Key
          </Button>
        }
      />

      {loadError && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void fetchApiKeys()}>Retry</Button></div>}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Provisioned Keys"
          value={apiKeys.length}
          subValue={`${activeKeysCount} active in production`}
          icon={<Key size={18} />}
        />
        <MetricCard
          label="Authentication Scheme"
          value="Bearer Token"
          subValue="HTTP Authorization Header"
          icon={<Lock size={18} />}
        />
        <MetricCard label="Access model" value="Scoped" subValue="Permissions assigned per key" icon={<Shield size={18} />} />
      </div>

      {/* Keys Directory Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Credentials</CardTitle>
              <CardDescription>
                Tokens should never be exposed in client-side code repositories or public web browsers.
              </CardDescription>
            </div>
            <a
              href="https://docs.nazbiz.com/api"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline flex items-center gap-1 font-medium"
            >
              Developer API Docs <ExternalLink size={12} />
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadError ? <p className="px-5 py-8 text-center text-sm text-text-muted">API key data is unavailable until the request succeeds.</p> : apiKeys.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Key}
                title="No API keys provisioned"
                description="Generate your first secret key to integrate NazBiz omnichannel messages into external apps."
                primaryAction={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setNewKey(null)
                      setShowModal(true)
                    }}
                  >
                    Generate First Key
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {apiKeys.map((apiKey) => {
                const isCopied = copiedId === apiKey.id
                return (
                  <div
                    key={apiKey.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-text-primary text-sm tracking-tight">
                          {apiKey.name}
                        </span>
                        <Badge variant={apiKey.is_active ? 'success' : 'outline'} dot size="sm">
                          {apiKey.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>

                      {/* Secret preview & copy */}
                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 rounded-md bg-surface border border-border/80 text-xs font-mono text-text-secondary select-all">
                          {apiKey.key.length > 18
                            ? `${apiKey.key.substring(0, 10)}••••••••••••${apiKey.key.substring(apiKey.key.length - 4)}`
                            : apiKey.key}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="p-1.5 rounded-md hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                          title="Copy Token"
                        >
                          {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Metadata Details */}
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Created {new Date(apiKey.created_at).toLocaleDateString()}
                        </span>
                        {apiKey.last_used_at ? (
                          <span className="flex items-center gap-1 text-success/90">
                            <Clock size={12} />
                            Last used {new Date(apiKey.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">Never used</span>
                        )}
                        {apiKey.expires_at && (
                          <span className="text-warning/90 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Expires {new Date(apiKey.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Scopes Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {apiKey.scopes.map(s => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-elevated text-text-secondary border border-border/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <Button
                        variant={apiKey.is_active ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggle(apiKey.id, apiKey.is_active)}
                        icon={<Power size={13} />}
                      >
                        {apiKey.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(apiKey.id)}
                        className="text-text-tertiary hover:text-error hover:bg-error/10"
                        icon={<Trash2 size={14} />}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setNewKey(null)
        }}
        title={newKey ? 'API Key Generated' : 'Create New API Key'}
        size="lg"
      >
        {newKey ? (
          <div className="space-y-5 p-6">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-warning">
                <AlertTriangle size={14} /> Please save this secret key immediately
              </div>
              <p>For your security, we will never show you this token again. Store it securely in your environment variables.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Secret Token</label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                <code className="flex-1 font-mono text-xs text-success px-2 break-all select-all">
                  {newKey}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(newKey, 'modal-key')}
                  icon={copiedId === 'modal-key' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                >
                  {copiedId === 'modal-key' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setShowModal(false)
                  setNewKey(null)
                }}
              >
                I have saved my key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Key Identifier *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Shopify Outbound Webhook or Mobile Backend"
              />
              <span className="text-[11px] text-text-tertiary">A human-readable label to identify where this credential is used.</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                <span>Permission Scopes *</span>
                <span className="text-[11px] text-brand font-normal">{form.scopes.length} selected</span>
              </label>

              <div className="space-y-4">
                {SCOPE_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                      {group.category}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.scopes.map((s) => {
                        const isChecked = form.scopes.includes(s.id)
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleScope(s.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-brand/10 border-brand/40 text-text-primary'
                                : 'bg-surface-elevated/40 border-border text-text-secondary hover:border-border-hover'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span>{s.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent div
                                className="rounded border-border accent-brand cursor-pointer"
                              />
                            </div>
                            <span className="text-[11px] text-text-tertiary block leading-snug">
                              {s.desc}
                            </span>
                            <span className="font-mono text-[10px] text-text-tertiary/70 mt-1 block">
                              {s.id}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-text-primary">Expiry Date (Optional)</label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
              <span className="text-[11px] text-text-tertiary">Leave empty for a permanent production key with no expiration.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                icon={<Code2 size={14} />}
              >
                Generate Key
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
