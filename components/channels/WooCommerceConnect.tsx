'use client'

import React, { useState } from 'react'
import { Package, RefreshCw, ShieldCheck } from 'lucide-react'

interface WooCommerceConnectProps {
  isConnected: boolean
  channels?: Array<{
    id: number
    page_id?: string
    integration?: {
      store_url?: string
      sync_counts?: { products?: number; orders?: number; customers?: number }
      sync_status?: string
      last_synced_at?: string | null
      sync_error?: string | null
      webhook_status?: string | null
      webhooks_registered?: number | null
    }
  }>
  channel?: {
    id?: number
    page_id?: string
    integration?: {
      store_url?: string
      sync_counts?: { products?: number; orders?: number; customers?: number }
      sync_status?: string
      last_synced_at?: string | null
      sync_error?: string | null
      webhook_status?: string | null
      webhooks_registered?: number | null
    }
  }
  onConnect: (data: { store_url: string }) => Promise<void>
  onDisconnect: (channelId?: number) => Promise<void>
  onSync?: (channelId?: number) => Promise<void>
}

export default function WooCommerceConnect({ isConnected, channels = [], channel, onConnect, onDisconnect, onSync }: WooCommerceConnectProps) {
  const [storeUrl, setStoreUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addingStore, setAddingStore] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState<number | undefined>(channel?.id ?? channels[0]?.id)

  const run = async (action: () => Promise<void>) => {
    setLoading(true)
    setError('')
    try {
      await action()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeChannel = channels.find((item) => item.id === selectedChannelId) || channel || channels[0]
  const counts = activeChannel?.integration?.sync_counts || {}

  return (
    <div className="p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent-subtle)] text-[#96588a]"><Package size={24} /></div>
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)]">WooCommerce</h3>
          <p className="text-sm text-[var(--text-secondary)]">Connect your store and sync its catalog, customers, and orders.</p>
        </div>
      </div>

      {isConnected && activeChannel && !addingStore ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text-primary)]">✓ WooCommerce connected</div>
            {channels.length > 1 && (
              <label className="block text-xs">Select store
                <select value={activeChannel.id} onChange={(event) => setSelectedChannelId(Number(event.target.value))} className="ml-2 rounded border px-2 py-1">
                  {channels.map((item) => <option key={item.id} value={item.id}>{item.integration?.store_url || item.page_id || `Store #${item.id}`}</option>)}
                </select>
              </label>
            )}
            <div>Store: {activeChannel.integration?.store_url || activeChannel.page_id}</div>
            <div>{counts.products ?? 0} products · {counts.orders ?? 0} orders · {counts.customers ?? 0} customers</div>
            <div>Status: {activeChannel.integration?.sync_status || 'connected'}</div>
            {activeChannel.integration?.last_synced_at && <div>Last synced: {new Date(activeChannel.integration.last_synced_at).toLocaleString()}</div>}
            {activeChannel.integration?.sync_error && <div className="text-[var(--error)]">Sync error: {activeChannel.integration.sync_error}</div>}
            {activeChannel.integration?.webhook_status && activeChannel.integration.webhook_status !== 'registered' && <div className="text-[var(--error)]">Store updates may not sync automatically ({activeChannel.integration.webhooks_registered ?? 0} webhooks registered).</div>}
          </div>
          <div className="flex gap-2">
            {onSync && <button disabled={loading} onClick={() => run(() => onSync(activeChannel.id))} className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50"><span className="inline-flex items-center gap-2"><RefreshCw size={14} />Sync now</span></button>}
            <button disabled={loading} onClick={() => setAddingStore(true)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">Add store</button>
            <button disabled={loading} onClick={() => run(() => onDisconnect(activeChannel.id))} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">Disconnect</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); void run(() => onConnect({ store_url: storeUrl })) }} className="space-y-4">
          {isConnected && <div className="text-sm text-[var(--text-secondary)]">Connect another WooCommerce store to this workspace.</div>}
          <label className="block text-sm font-semibold text-[var(--text-primary)]">
            Store URL
            <input type="url" required value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} placeholder="https://mystore.com" className="mt-2 w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] outline-none" />
          </label>
          <div className="text-xs text-[var(--text-secondary)] flex items-start gap-2"><ShieldCheck size={16} className="shrink-0 text-[var(--success)]" />You’ll approve NazBiz’s read/write access on your WooCommerce store. No API keys need to be copied.</div>
          {error && <div className="p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>}
          <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50">{loading ? 'Connecting…' : 'Connect WooCommerce'}</button>
          {addingStore && <button type="button" disabled={loading} onClick={() => setAddingStore(false)} className="w-full px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm disabled:opacity-50">Back to connected store</button>}
        </form>
      )}
      {error && isConnected && <div className="mt-3 p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>}
    </div>
  )
}
