'use client'

import React, { useState } from 'react'
import { RefreshCw, ShieldCheck, ShoppingBag, X } from 'lucide-react'
import Select from '../ui/Select'
import { useLang } from '../../lib/LangContext'

interface ShopifyConnectProps {
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
      sync_warnings?: string[]
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
      sync_warnings?: string[]
      webhook_status?: string | null
      webhooks_registered?: number | null
    }
  }
  onConnect: (data: { shop_domain: string }) => Promise<void>
  onDisconnect: (channelId?: number) => Promise<void>
  onSync?: (channelId?: number) => Promise<void>
  onClose: () => void
}

export default function ShopifyConnect({ isConnected, channels = [], channel, onConnect, onDisconnect, onSync, onClose }: ShopifyConnectProps) {
  const { isRTL } = useLang()
  const t = (en: string, ar: string) => isRTL ? ar : en
  const [shopDomain, setShopDomain] = useState('')
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
  const needsShopifySetup = error.includes('requires Shopify standalone authorization-code flow')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="shopify-connect-title" className="relative w-full max-w-lg p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-2xl">
      <button type="button" aria-label={t('Close Shopify connection dialog', 'إغلاق نافذة ربط Shopify')} onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)]"><X size={18} /></button>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent-subtle)] text-[#96BF48]"><ShoppingBag size={24} /></div>
        <div>
          <h3 id="shopify-connect-title" className="font-bold text-lg text-[var(--text-primary)]">Shopify</h3>
          <p className="text-sm text-[var(--text-secondary)]">{t('Connect your store to sync products, inventory, customers, and orders.', 'اربط متجرك لمزامنة المنتجات والمخزون والعملاء والطلبات.')}</p>
        </div>
      </div>

      {isConnected && activeChannel && !addingStore ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text-primary)]">✓ {t('Shopify connected', 'تم ربط Shopify')}</div>
            {channels.length > 1 && (
              <div className="pt-1">
                <Select
                  size="sm"
                  label={t('Select store', 'اختر المتجر')}
                  value={String(activeChannel.id)}
                  onChange={(event) => setSelectedChannelId(Number(event.target.value))}
                  options={channels.map((item) => ({
                    value: String(item.id),
                    label: item.integration?.store_url || item.page_id || `Store #${item.id}`,
                  }))}
                />
              </div>
            )}
            <div>{t('Store:', 'المتجر:')} {activeChannel.integration?.store_url || activeChannel.page_id}</div>
            <div>{counts.products ?? 0} {t('products', 'منتج')} · {counts.orders ?? 0} {t('orders', 'طلب')} · {counts.customers ?? 0} {t('customers', 'عميل')}</div>
            <div>{t('Status:', 'الحالة:')} {activeChannel.integration?.sync_status || (isRTL ? 'متصل' : 'connected')}</div>
            {activeChannel.integration?.last_synced_at && <div>{t('Last synced:', 'آخر مزامنة:')} {new Date(activeChannel.integration.last_synced_at).toLocaleString(isRTL ? 'ar' : 'en')}</div>}
            {activeChannel.integration?.sync_error && <div className="text-[var(--error)]">{t('Sync error:', 'خطأ المزامنة:')} {activeChannel.integration.sync_error}</div>}
            {activeChannel.integration?.sync_warnings?.map((warning) => <div key={warning} className="text-amber-600">{warning}</div>)}
            {activeChannel.integration?.webhook_status && activeChannel.integration.webhook_status !== 'registered' && <div className="text-[var(--error)]">{isRTL ? `قد لا تتم مزامنة تحديثات المتجر تلقائياً (تم تسجيل ${activeChannel.integration.webhooks_registered ?? 0} من إشعارات الويب).` : `Store updates may not sync automatically (${activeChannel.integration.webhooks_registered ?? 0} webhooks registered).`}</div>}
          </div>
          <div className="flex gap-2">
            {onSync && <button disabled={loading} onClick={() => run(() => onSync(activeChannel.id))} className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50"><span className="inline-flex items-center gap-2"><RefreshCw size={14} />{t('Sync now', 'مزامنة الآن')}</span></button>}
            <button disabled={loading} onClick={() => setAddingStore(true)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">{t('Add store', 'إضافة متجر')}</button>
            <button disabled={loading} onClick={() => run(() => onDisconnect(activeChannel.id))} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm disabled:opacity-50">{t('Disconnect', 'فصل الاتصال')}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); void run(() => onConnect({ shop_domain: shopDomain.trim() })) }} className="space-y-4">
          {isConnected && <div className="text-sm text-[var(--text-secondary)]">{t('Connect another Shopify store to this workspace.', 'اربط متجراً آخر من Shopify بمساحة العمل هذه.')}</div>}
          <label className="block text-sm font-semibold text-[var(--text-primary)]">
            {t('Shopify store domain', 'نطاق متجر Shopify')}
            <input type="text" required value={shopDomain} onChange={(event) => setShopDomain(event.target.value)} placeholder="mystore.myshopify.com" autoCapitalize="none" autoCorrect="off" className="mt-2 w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] outline-none" />
          </label>
          <div className="text-xs text-[var(--text-secondary)] flex items-start gap-2"><ShieldCheck size={16} className="shrink-0 text-[var(--success)]" />{t('You’ll approve the requested permissions on Shopify. Client credentials and access tokens stay on the server.', 'ستوافق على الصلاحيات المطلوبة في Shopify. تبقى بيانات اعتماد التطبيق ورموز الوصول على الخادم.')}</div>
          {error && (needsShopifySetup ? (
            <div className="p-4 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--text-primary)] space-y-2">
              <div className="font-semibold text-[var(--error)]">{t('Shopify app setup needs to be updated', 'يلزم تحديث إعداد تطبيق Shopify')}</div>
              <p>{t('This connection starts from NazBiz, so Shopify must use its standalone authorization flow.', 'يبدأ الاتصال من NazBiz، لذا يجب استخدام تدفق التفويض المستقل في Shopify.')}</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>{t('In Shopify app settings, turn off', 'في إعدادات تطبيق Shopify، أوقف خيار')} <strong>Embedded app</strong>.</li>
                <li>{t('Turn on', 'فعّل')} <strong>Legacy install flow</strong>{t(', then deploy the app configuration.', ' ثم انشر إعدادات التطبيق.')}</li>
                <li>{t('On the API server, set', 'على خادم API، اضبط')} <code>SHOPIFY_USE_LEGACY_INSTALL_FLOW=true</code> {t('and clear Laravel’s config cache.', 'وامسح ذاكرة إعدادات Laravel.')}</li>
              </ol>
              <p>{t('Then return here and connect the store again.', 'بعدها ارجع إلى هنا وأعد ربط المتجر.')}</p>
            </div>
          ) : <div className="p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>)}
          <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50">{loading ? t('Connecting…', 'جارٍ الاتصال…') : t('Connect Shopify', 'ربط Shopify')}</button>
          {addingStore && <button type="button" disabled={loading} onClick={() => setAddingStore(false)} className="w-full px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm disabled:opacity-50">{t('Back to connected store', 'العودة إلى المتجر المتصل')}</button>}
        </form>
      )}
      {error && isConnected && !needsShopifySetup && <div className="mt-3 p-3 rounded-lg text-sm bg-[var(--error-subtle)] text-[var(--error)]">{error}</div>}
    </div>
    </div>
  )
}
