'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Check, RefreshCw, X, AlertCircle, Unlink } from 'lucide-react'
import { useLang } from '../../lib/LangContext'

interface WhatsAppConnectProps {
  isConnected: boolean
  channel?: any
  onConnect?: () => Promise<void> | void
  onConnected?: () => void
  onDisconnect?: () => Promise<void> | void
  onClose?: () => void
}

export default function WhatsAppConnect({
  isConnected: initialIsConnected,
  channel,
  onConnected,
  onDisconnect,
  onClose,
}: WhatsAppConnectProps) {
  const { isRTL } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(initialIsConnected)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const getToken = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const checkStatus = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/whatsapp/status`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.connected) {
          setConnected(true)
          setQrcode(null)
          stopPolling()
          onConnected?.()
        }
      }
    } catch (e) {
      console.error('Failed to poll WhatsApp status:', e)
    }
  }, [API, onConnected, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollTimerRef.current = setInterval(() => {
      checkStatus()
    }, 3000)
  }, [checkStatus, stopPolling])

  const initConnect = useCallback(async () => {
    setLoading(true)
    setError('')
    setQrcode(null)

    try {
      const token = getToken()
      if (!token) {
        setError('Authentication token missing')
        setLoading(false)
        return
      }

      const res = await fetch(`${API}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      const data = await res.json()

      if (res.ok) {
        if (data.qrcode) {
          const qrSrc = data.qrcode.startsWith('data:')
            ? data.qrcode
            : `data:image/png;base64,${data.qrcode}`
          setQrcode(qrSrc)
          setPairingCode(data.pairing_code || null)
          startPolling()
        } else {
          // Check if status reports already connected
          await checkStatus()
        }
      } else if (res.status === 400 && (data.message?.includes('already connected') || data.message?.includes('connected'))) {
        setConnected(true)
        onConnected?.()
      } else {
        setError(data.error || data.message || 'Failed to initialize WhatsApp connection')
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [API, checkStatus, onConnected, startPolling])

  useEffect(() => {
    if (!initialIsConnected) {
      initConnect()
    } else {
      setConnected(true)
    }

    return () => {
      stopPolling()
    }
  }, [initialIsConnected, initConnect, stopPolling])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    setError('')
    try {
      if (onDisconnect) {
        await onDisconnect()
      } else {
        const token = getToken()
        const res = await fetch(`${API}/api/whatsapp/disconnect`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to disconnect')
        }
      }
      setConnected(false)
      setQrcode(null)
      stopPolling()
    } catch (err: any) {
      setError(err.message || 'Disconnect failed')
    } finally {
      setDisconnecting(false)
    }
  }

  // Visual layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: '#25D366' }}
            >
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                WhatsApp
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {connected
                  ? isRTL ? 'واتساب متصل بنجاح' : 'WhatsApp is connected'
                  : isRTL ? 'مسح رمز QR للربط' : 'Scan QR Code to connect'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        {connected ? (
          <div className="space-y-5">
            <div
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
              <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-bold">
                <Check size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-success">
                  {isRTL ? 'الحساب مربوط وجاهز' : 'Account Connected'}
                </p>
                <p className="text-[11px] text-text-secondary">
                  {channel?.page_name || channel?.phone || (isRTL ? 'جاهز لاستقبال والرد على الرسائل' : 'Ready to handle auto-replies')}
                </p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#f87171',
              }}
            >
              {disconnecting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Unlink size={14} />
              )}
              {disconnecting
                ? (isRTL ? 'جاري الفصل...' : 'Disconnecting...')
                : (isRTL ? 'فصل الحساب' : 'Disconnect WhatsApp')}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {loading && !qrcode && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-success border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-text-secondary">
                  {isRTL ? 'جاري إنشاء جلسة واتساب...' : 'Generating WhatsApp QR code...'}
                </p>
              </div>
            )}

            {error && (
              <div
                className="p-4 rounded-2xl text-xs space-y-3 text-left"
                style={{ background: 'var(--error-subtle)', border: '1px solid var(--error)', color: 'var(--error)' }}
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle size={16} />
                  <span>{isRTL ? 'فشل الاتصال' : 'Connection Error'}</span>
                </div>
                <p className="text-[11px] opacity-90">{error}</p>
                <button
                  onClick={initConnect}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  {isRTL ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            )}

            {qrcode && !loading && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white flex items-center justify-center mx-auto w-56 h-56 shadow-inner">
                  <img
                    src={qrcode}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                {pairingCode && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-text-tertiary">{isRTL ? 'رمز الاقتران: ' : 'Pairing Code: '}</span>
                    <span className="font-mono font-bold text-accent tracking-widest">{pairingCode}</span>
                  </div>
                )}

                <div
                  className="p-3.5 rounded-2xl text-left space-y-1.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-[11px] font-bold text-text-primary">
                    {isRTL ? 'خطوات الربط:' : 'How to connect:'}
                  </p>
                  <ol className="text-[10px] text-text-secondary space-y-1 list-decimal list-inside">
                    <li>{isRTL ? 'افتح تطبيق واتساب على هاتفك' : 'Open WhatsApp on your mobile phone'}</li>
                    <li>{isRTL ? 'الانتقال إلى الإعدادات > الأجهزة المرتبطة' : 'Go to Settings > Linked Devices'}</li>
                    <li>{isRTL ? 'اضغط على "ربط جهاز" ووجّه الكاميرا إلى هذا الرمز' : 'Tap "Link a Device" and scan this QR code'}</li>
                  </ol>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-success font-medium py-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span>{isRTL ? 'في انتظار المسح...' : 'Waiting for QR scan...'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
