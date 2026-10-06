'use client'

import React, { useState } from 'react'
import { RefreshCw, ShieldCheck, ShoppingBag, X } from 'lucide-react'

interface ShopifyConnectProps {
  isConnected: boolean
  channel?: {
    page_id?: string
    integration?: {
      store_url?: string
      sync_counts?: { products?: number; orders?: number; customers?: number }
      sync_status?: string
      last_synced_at?: string | null
      sync_error?: string | null
      sync_warnings?: string[]
      webhook_status?: string | null
      webhooks_registered?: number | null
    }
  }
  onConnect: (data: { shop_domain: string }) => Promise<void>
  onDisconnect: () => Promise<void>
  onSync?: () => Promise<void>
  onClose: () => void
}

export default function ShopifyConnect({ isConnected, channel, onConnect, onDisconnect, onSync, onClose }: ShopifyConnectProps) {
  const [shopDomain, setShopDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addingStore, setAddingStore] = useState(false)

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

  const counts = channel?.integration?.sync_counts || {}
  const needsShopifySetup = error.includes('requires Shopify standalone authorization-code flow')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="shopify-connect-title" className="relative w-full max-w-lg p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-2xl">
      <button type="button" aria-label="Close Shopify connection dialog" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)]"><X size={18} /></button>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent-subtle)] text-[#96BF48]"><ShoppingBag size={24} /></div>
        <div>
          <h3 id="shopify-connect-title" className="font-bold text-lg text-[var(--text-primary)]">Shopify</h3>
          <p className="text-sm text-[var(--text-secondary)]">Connect your store to sync products, inventory, customers, and orders.</p>
        </div>
      </div>

      {isConnected && channel && !addingStore ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text-primary)]">✓ Shopify connected</div>
            <div>Store: {channel.integration?.store_url || channel.page_id}</div>
            <div>{counts.products ?? 0} products · {counts.orders ?? 0} orders · {counts.customers ?? 0} customers</div>
            <div>Status: {channel.integration?.sync_status || 'connected'}</div>
            {channel.integration?.last_synced_at && <div>Last synced: {new Date(channel.integration.last_synced_at).toLocaleString()}</div>}
            {channel.integration?.sync_error && <div className="text-[var(--error)]">Sync error: {channel.integration.sync_error}</div>}
            {channel.integration?.sync_warnings?.map((warning) => <div key={warning} className="text-amber-600">{warning}</div>)}
            {channel.integration?.webhook_status && channel.integration.webhook_status !== 'registered' && <div className="text-[var(--error)]">Store updates may not sync automatically ({channel.integration.webhooks_registered ?? 0} webhooks registered).</div>}
          </div>
          <div className="flex gap-2">
            {onSync && <button disabled={loading} onClick={() => run(onSync)} className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50"><span className="inline-flex items-center gap-2"><RefreshCw size={14} />Sync now</span></button>}
            <button disabled={loading} onClick={() => setAddingStore(true)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">Add store</button>
            <button disabled={loading} onClick={() => run(onDisconnect)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">Disconnect</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); void run(() => onConnect({ shop_domain: shopDomain.trim() })) }} className="space-y-4">
          {isConnected && <div className="text-sm text-[var(--text-secondary)]">Connect another Shopify store to this workspace.</div>}
          <label className="block text-sm font-semibold text-[var(--text-primary)]">
            Shopify store domain
            <input type="text" required value={shopDomain} onChange={(event) => setShopDomain(event.target.value)} placeholder="mystore.myshopify.com" autoCapitalize="none" autoCorrect="off" className="mt-2 w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] outline-none" />
          </label>
          <div className="text-xs text-[var(--text-secondary)] flex items-start gap-2"><ShieldCheck size={16} className="shrink-0 text-[var(--success)]" />You’ll approve the requested permissions on Shopify. Client credentials and access tokens stay on the server.</div>
          {error && (needsShopifySetup ? (
            <div className="p-4 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--text-primary)] space-y-2">
              <div className="font-semibold text-[var(--error)]">Shopify app setup needs to be updated</div>
              <p>This connection starts from NazBiz, so Shopify must use its standalone authorization flow.</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>In Shopify app settings, turn off <strong>Embedded app</strong>.</li>
                <li>Turn on <strong>Legacy install flow</strong>, then deploy the app configuration.</li>
                <li>On the API server, set <code>SHOPIFY_USE_LEGACY_INSTALL_FLOW=true</code> and clear Laravel’s config cache.</li>
              </ol>
              <p>Then return here and connect the store again.</p>
            </div>
          ) : <div className="p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>)}
          <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50">{loading ? 'Connecting…' : 'Connect Shopify'}</button>
          {addingStore && <button type="button" disabled={loading} onClick={() => setAddingStore(false)} className="w-full px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm disabled:opacity-50">Back to connected store</button>}
        </form>
      )}
      {error && isConnected && !needsShopifySetup && <div className="mt-3 p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>}
    </div>
    </div>
  )
}
