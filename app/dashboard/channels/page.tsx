'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import { PlusIcon, XIcon, LightningIcon } from '../../../components/ui/DashboardIcons'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CHANNELS_DEFS = [
  { id: 'instagram', name: 'Instagram',      color: 'var(--accent)', plan: 'free' },
  { id: 'facebook',  name: 'Facebook',       color: 'var(--accent)', plan: 'free' },
  { id: 'gmail',     name: 'Gmail',          color: 'var(--accent)', plan: 'free' },
  { id: 'whatsapp',  name: 'WhatsApp',       color: 'var(--accent)', plan: 'free' },
  { id: 'reviews',   name: 'Google Reviews', color: 'var(--accent)', plan: 'free' },
  { id: 'salla',     name: 'Salla',          color: 'var(--accent)', plan: 'free' },
  { id: 'telegram',  name: 'Telegram',       color: 'var(--accent)', plan: 'free' },
  { id: 'tiktok',    name: 'TikTok',         color: 'var(--accent)', plan: 'free' },
  { id: 'shopify',   name: 'Shopify',        color: 'var(--accent)', plan: 'free' },
  { id: 'woocommerce', name: 'WooCommerce',  color: 'var(--accent)', plan: 'free' },
  { id: 'webchat',   name: 'Web Chat',       color: 'var(--accent)', plan: 'starter' },
]

function ConnectModal({
  ch,
  onClose,
  onConnected,
}: {
  ch: typeof CHANNELS_DEFS[0]
  onClose: () => void
  onConnected: () => void
}) {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [connecting_loading, setConnectingLoading] = React.useState(false)

  const handleConnect = async () => {
    if (ch.id === 'facebook' || ch.id === 'instagram') {
      const token = getToken()
      // Navigate in the same window — OAuth must NOT open in a popup
      window.location.href = `${API}/api/channels/connect/facebook?token=${encodeURIComponent(token)}&redirect=dashboard`
      return
    }

    if (ch.id === 'gmail') {
      setConnectingLoading(true)
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        if (!token) return

        const res = await fetch(`${API}/api/channels/connect/gmail`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (!res.ok) {
          const errBody = await res.text()
          console.error('Gmail connect HTTP error', res.status, errBody)
          throw new Error(`Backend error ${res.status}: ${errBody}`)
        }
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          alert('Could not get Gmail authorization URL. Please try again.')
        }
      } catch (e) {
        console.error('Gmail connect error:', e)
        alert(`Gmail connection failed: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setConnectingLoading(false)
      }
      return
    }

    if (ch.id === 'salla') {
      const token = getToken()
      // Navigate in the same window — OAuth must NOT open in a popup
      window.location.href = `${API}/api/channels/connect/salla?token=${encodeURIComponent(token)}&redirect=dashboard`
      return
    }

    if (ch.id === 'tiktok') {
      const token = getToken()
      window.location.href = `${API}/api/channels/connect/tiktok?token=${encodeURIComponent(token)}&redirect=dashboard`
      return
    }

    if (ch.id === 'shopify') {
      const shopDomain = prompt('Enter your Shopify store domain (e.g. mystore.myshopify.com):')
      if (!shopDomain) return
      
      const token = getToken()
      window.location.href = `${API}/api/channels/connect/shopify?shop=${encodeURIComponent(shopDomain)}&token=${encodeURIComponent(token)}&redirect=dashboard`
      return
    }

    if (ch.id === 'woocommerce') {
      const storeUrl = prompt('Enter your WooCommerce store URL (e.g. https://mystore.com):')
      if (!storeUrl) return
      
      const consumerKey = prompt('Enter your WooCommerce Consumer Key:')
      if (!consumerKey) return
      
      const consumerSecret = prompt('Enter your WooCommerce Consumer Secret:')
      if (!consumerSecret) return
      
      setConnectingLoading(true)
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        if (!token) return

        const res = await fetch(`${API}/api/channels/woocommerce/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            store_url: storeUrl,
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
          }),
        })
        
        if (!res.ok) {
          const errBody = await res.text()
          console.error('WooCommerce connect HTTP error', res.status, errBody)
          throw new Error(`Backend error ${res.status}: ${errBody}`)
        }
        
        const data = await res.json()
        if (data.success) {
          onConnected()
        } else {
          alert(data.error || 'Failed to connect WooCommerce store')
        }
      } catch (e) {
        console.error('WooCommerce connect error:', e)
        alert(`WooCommerce connection failed: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setConnectingLoading(false)
      }
      return
    }

    if (ch.id === 'telegram') {
      setConnectingLoading(true)
      try {
        const res = await fetch(`${API}/api/channels/telegram/connect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        
        if (!res.ok) {
          const errBody = await res.text()
          console.error('Telegram connect HTTP error', res.status, errBody)
          
          // If server doesn't have token configured, prompt user
          if (res.status === 400 && errBody.includes('Bot token is required')) {
            const botToken = prompt('Enter your Telegram Bot Token (from @BotFather):')
            if (!botToken) {
              setConnectingLoading(false)
              return
            }
            
            const retryRes = await fetch(`${API}/api/channels/telegram/connect`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ bot_token: botToken }),
            })
            
            if (!retryRes.ok) {
              const retryErrBody = await retryRes.text()
              console.error('Telegram connect retry error', retryRes.status, retryErrBody)
              throw new Error(`Backend error ${retryRes.status}: ${retryErrBody}`)
            }
            
            const retryData = await retryRes.json()
            if (retryData.success) {
              onConnected()
            } else {
              alert(retryData.error || 'Failed to connect Telegram bot')
            }
            setConnectingLoading(false)
            return
          }
          
          throw new Error(`Backend error ${res.status}: ${errBody}`)
        }
        
        const data = await res.json()
        if (data.success) {
          onConnected()
        } else {
          alert(data.error || 'Failed to connect Telegram bot')
        }
      } catch (e) {
        console.error('Telegram connect error:', e)
        alert(`Telegram connection failed: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setConnectingLoading(false)
      }
      return
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--text-primary) 75%, transparent)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl p-6 glass"
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        style={{ border: '1px solid var(--border)' }}
      >
        <>
          <div className="flex items-center gap-3 mb-5">
            <ChannelIcon type={ch.id as any} size={48} />
            <div>
              <h3 className="font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {t.channels.connect} {ch.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t.channels.willNeedSignIn}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl mb-5"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--divider)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t.channels.permissionText.replace('{channel}', ch.name)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold btn-ghost"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting_loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold btn-lime"
              style={{ opacity: connecting_loading ? 0.7 : 1 }}
            >
              {connecting_loading ? '...' : t.common.continue}
            </button>
          </div>
        </>
      </motion.div>
    </motion.div>
  )
}

export default function ChannelsPage() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [connecting, setConnecting] = useState<typeof CHANNELS_DEFS[0] | null>(null)
  const [apiChannels, setApiChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${API}/api/channels`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const channels = await res.json()
        setApiChannels(Array.isArray(channels) ? channels : channels.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch channels', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  // Also handle success param when returning from non-popup flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    if (success === 'facebook_connected' || success === 'instagram_connected' || success === 'gmail' || success === 'salla_connected' || success === 'tiktok_connected' || success === 'shopify_connected') {
      setToast({ message: t.channels.connectedSuccess, type: 'success' })
      fetchChannels()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      setToast({ message: 'Connection error', type: 'error' })
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (error === 'gmail_denied' || error === 'facebook_denied' || error === 'salla_denied' || error === 'tiktok_denied' || error === 'shopify_denied') {
      setToast({ message: t.channels.connectionCancelled, type: 'error' })
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (error === 'gmail_token' || error === 'gmail_exception' || error === 'token_failed' || error === 'no_pages' || error === 'salla_oauth_failed' || error === 'tiktok_token_failed' || error === 'shopify_token_failed') {
      setToast({ message: t.channels.connectionFailed, type: 'error' })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [fetchChannels, t.channels.connectedSuccess])

  const handleDisconnect = async (id: number) => {
    if (!confirm(t.channels.confirmDisconnect)) return
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      await fetch(`${API}/api/channels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      setToast({ message: t.channels.disconnected2, type: 'success' })
      fetchChannels()
    } catch (e) {
      console.error('Failed to disconnect channel', e)
      setToast({ message: t.channels.disconnectFailed, type: 'error' })
    }
  }

  const handleToggleAI = async (id: number, currentStatus: boolean) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${API}/api/channels/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ ai_enabled: !currentStatus }),
      })
      if (res.ok) {
        setToast({
          message: !currentStatus
            ? t.channels.aiEnabled
            : t.channels.aiDisabled,
          type: 'success'
        })
        fetchChannels()
      }
    } catch (e) {
      console.error('Failed to toggle AI', e)
      setToast({ message: t.channels.updateFailed, type: 'error' })
    }
  }

  const CHANNELS = CHANNELS_DEFS.map(def => {
    const apiCh = apiChannels.find(c => c.type === def.id)
    return {
      ...def,
      connected: !!apiCh,
      dbId: apiCh?.id ?? null,
      pageName: apiCh?.page_name ?? null,
      aiEnabled: apiCh?.ai_enabled ?? false,
      connectedAt: apiCh?.connected_at ?? null,
    }
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {t.channels.title}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t.channels.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHANNELS.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as any }}
              className="card-os rounded-2xl p-5 relative"
              style={{
                background: 'var(--surface-elevated)',
                border: `1px solid ${ch.connected ? 'var(--accent-focus)' : 'var(--border)'}`,
              }}
            >

              <div className="flex items-center gap-3 mb-4">
                <ChannelIcon type={ch.id as any} size={48} />
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ch.name}</div>
                  {ch.pageName && (
                    <div className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>
                      {ch.pageName}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ch.connected ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                          {t.channels.connected}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {t.channels.notConnected}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {ch.connected ? (
                  <>
                    <button
                      onClick={() => ch.dbId && handleToggleAI(ch.dbId, ch.aiEnabled)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-ghost"
                      style={{
                        background: ch.aiEnabled ? 'var(--accent-subtle)' : 'var(--divider)',
                        border: ch.aiEnabled ? '1px solid var(--accent-focus)' : '1px solid var(--border)',
                        color: ch.aiEnabled ? 'var(--accent)' : 'var(--text-secondary)'
                      }}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <LightningIcon size={12} />
                        {ch.aiEnabled ? t.channels.aiOn : t.channels.aiOff}
                      </div>
                    </button>
                    <button onClick={() => ch.dbId && handleDisconnect(ch.dbId)}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold"
                      style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)', color: 'var(--accent)' }}>
                      {t.channels.disconnect}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConnecting(ch)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-ghost flex items-center justify-center gap-1.5"
                    style={{ color: 'var(--text-secondary)' }}>
                    <PlusIcon size={14} />
                    {t.channels.connect}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {connecting && (
          <ConnectModal
            ch={connecting}
            onClose={() => setConnecting(null)}
            onConnected={() => { fetchChannels(); setConnecting(null) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-bold"
            style={{
              background: toast.type === 'success' ? 'var(--accent-subtle)' : 'var(--accent-subtle)',
              border: toast.type === 'success' ? '1px solid var(--accent-focus)' : '1px solid var(--accent-focus)',
              color: toast.type === 'success' ? 'var(--accent)' : 'var(--accent)',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}






