'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import { PlusIcon, XIcon, LightningIcon } from '../../../components/ui/DashboardIcons'
import TelegramConnect from '../../../components/channels/TelegramConnect'
import WooCommerceConnect from '../../../components/channels/WooCommerceConnect'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CHANNELS_DEFS = [
  { id: 'instagram', name: 'Instagram',      brandColor: '#D62976', plan: 'free' },
  { id: 'facebook',  name: 'Facebook',       brandColor: '#0E7AFE', plan: 'free' },
  { id: 'gmail',     name: 'Gmail',          brandColor: '#EA4335', plan: 'free' },
  { id: 'whatsapp',  name: 'WhatsApp',       brandColor: '#25D366', plan: 'free' },
  { id: 'reviews',   name: 'Google Reviews', brandColor: '#4285F4', plan: 'free' },
  { id: 'salla',     name: 'Salla',          brandColor: '#00B4D8', plan: 'free' },
  { id: 'telegram',  name: 'Telegram',       brandColor: '#0088cc', plan: 'free' },
  { id: 'tiktok',    name: 'TikTok',         brandColor: '#ff0050', plan: 'free' },
  { id: 'shopify',   name: 'Shopify',        brandColor: '#96bf48', plan: 'free' },
  { id: 'woocommerce', name: 'WooCommerce',  brandColor: '#96588a', plan: 'free' },
  { id: 'webchat',   name: 'Web Chat',       brandColor: '#8B3FFB', plan: 'starter' },
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
  const [connecting_loading, setConnectingLoading] = React.useState(false)

  const handleConnect = async () => {
    if (ch.id === 'facebook' || ch.id === 'instagram') {
      const token = getToken()
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
        if (!res.ok) throw new Error(`Backend error ${res.status}`)
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          alert('Could not get Gmail authorization URL. Please try again.')
        }
      } catch (e) {
        console.error('Gmail connect error:', e)
        alert('Gmail connection failed.')
      } finally {
        setConnectingLoading(false)
      }
      return
    }

    if (ch.id === 'salla') {
      const token = getToken()
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
        
        const data = await res.json()
        if (data.success) {
          onConnected()
        } else {
          alert(data.error || 'Failed to connect WooCommerce store')
        }
      } catch (e) {
        console.error(e)
        alert('WooCommerce connection failed.')
      } finally {
        setConnectingLoading(false)
      }
      return
    }
  }

  if (ch.id === 'telegram') {
    return (
      <TelegramConnect
        isConnected={false}
        onConnect={async (data) => {
          const res = await fetch(`${API}/api/channels/telegram/connect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          const result = await res.json()
          if (!result.success) throw new Error(result.error || 'Failed to connect')
          onConnected()
        }}
        onDisconnect={async () => {}}
      />
    )
  }

  if (ch.id === 'woocommerce') {
    return (
      <WooCommerceConnect
        isConnected={false}
        onConnect={async (data) => {
          const res = await fetch(`${API}/api/channels/woocommerce/connect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          const result = await res.json()
          if (!result.success) throw new Error(result.error || 'Failed to connect')
          onConnected()
        }}
        onDisconnect={async () => {}}
      />
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)'}}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
        style={{background:'var(--surface-elevated)',border:'1px solid var(--border)'}}
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
            <ChannelIcon type={ch.id as any} size={40} />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight" style={{color:'var(--text-primary)'}}>
              {t.channels.connect} {ch.name}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {t.channels.willNeedSignIn}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl mb-6" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
          <p className="text-xs text-text-secondary leading-relaxed">
            {t.channels.permissionText.replace('{channel}', ch.name)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
            style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting_loading}
            className="flex-1 py-3 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 transition-all disabled:opacity-30 flex items-center justify-center"
          >
            {connecting_loading ? '...' : t.common.continue}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ChannelsPage() {
  const { isRTL, t } = useLang()
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    if (success) {
      setToast({ message: t.channels.connectedSuccess, type: 'success' })
      fetchChannels()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      setToast({ message: 'Connection failed', type: 'error' })
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
      console.error(e)
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
          message: !currentStatus ? t.channels.aiEnabled : t.channels.aiDisabled,
          type: 'success'
        })
        fetchChannels()
      }
    } catch (e) {
      console.error(e)
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
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page header */}
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight" style={{color:'var(--text-primary)'}}>
          {t.channels.title}
        </h2>
        <p className="text-sm text-text-secondary">
          {t.channels.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CHANNELS.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden group transition-all"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${ch.connected ? `color-mix(in srgb, ${ch.brandColor} 20%, var(--border))` : 'var(--border)'}`,
                boxShadow: ch.connected ? `0 10px 30px -15px ${ch.brandColor}30` : 'none',
              }}
            >
              {/* Subtle brand color glow inside connected cards */}
              {ch.connected && (
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none" 
                  style={{ background: ch.brandColor }}
                />
              )}

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl" style={{background:'var(--surface-elevated)',border:'1px solid var(--border)'}}>
                    <ChannelIcon type={ch.id as any} size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-xs" style={{color:'var(--text-primary)'}}>{ch.name}</div>
                    {ch.pageName && (
                      <div className="text-[10px] truncate max-w-[140px] mt-0.5" style={{color:'var(--text-secondary)'}}>
                        {ch.pageName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Status Badge */}
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
                  style={ch.connected
                    ? {background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:'#10b981'}
                    : {background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'var(--text-tertiary)'}
                  }
                >
                  {ch.connected ? t.channels.connected : t.channels.notConnected}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 relative z-10 mt-auto">
                {ch.connected ? (
                  <>
                    <button
                      onClick={() => ch.dbId && handleToggleAI(ch.dbId, ch.aiEnabled)}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      style={ch.aiEnabled
                        ? {background:'var(--accent-subtle)',border:'1px solid color-mix(in srgb, var(--accent) 25%, transparent)',color:'var(--accent)'}
                        : {background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)'}
                      }
                    >
                      <LightningIcon size={10} />
                      {ch.aiEnabled ? t.channels.aiOn : t.channels.aiOff}
                    </button>
                    <button 
                      onClick={() => ch.dbId && handleDisconnect(ch.dbId)}
                      className="py-2.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      style={{background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'#f87171'}}
                    >
                      {t.channels.disconnect}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setConnecting(ch)}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    style={{background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
                  >
                    <PlusIcon size={10} />
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
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-accent/15 border border-accent/25 text-accent shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
