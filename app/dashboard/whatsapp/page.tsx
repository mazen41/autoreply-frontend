'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface WhatsAppInstance {
  id: number
  user_id: number
  instance_name: string
  phone_number: string | null
  profile_name: string | null
  profile_picture_url: string | null
  status: 'pending' | 'connecting' | 'connected' | 'disconnected' | 'error'
  evolution_api_token: string | null
  evolution_instance_id: string | null
  webhook_url: any
  connected_at: string | null
  disconnected_at: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export default function WhatsAppPage() {
  const { t, isRTL } = useLang()
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    fetchStatus()
    startPolling()
    return () => stopPolling()
  }, [])

  const startPolling = () => {
    setPolling(true)
    const interval = setInterval(() => {
      fetchStatus()
    }, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }

  const stopPolling = () => {
    setPolling(false)
  }

  const fetchStatus = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data = await response.json()
      setInstance(data.instance)
      
      // If connected, clear QR code
      if (data.connected) {
        setQrCode(null)
        setPairingCode(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch status:', error)
      if (!instance) {
        setError(error.message || 'Failed to load status')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    setQrCode(null)
    setPairingCode(null)

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to connect')
      }

      const data = await response.json()
      setInstance(data.instance)
      setQrCode(data.qrcode)
      setPairingCode(data.pairing_code)
      
      // Start polling for connection status
      startPolling()
    } catch (error: any) {
      console.error('Failed to connect:', error)
      setError(error.message || 'Failed to connect WhatsApp')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(isRTL ? 'هل أنت متأكد من فصل واتساب؟' : 'Are you sure you want to disconnect WhatsApp?')) {
      return
    }

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      setInstance(null)
      setQrCode(null)
      setPairingCode(null)
    } catch (error: any) {
      console.error('Failed to disconnect:', error)
      setError(error.message || 'Failed to disconnect WhatsApp')
    }
  }

  const handleReconnect = async () => {
    setConnecting(true)
    setError('')

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/reconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to reconnect')
      }

      const data = await response.json()
      setInstance(data.instance)
      setQrCode(data.qrcode)
      setPairingCode(data.pairing_code)
      
      startPolling()
    } catch (error: any) {
      console.error('Failed to reconnect:', error)
      setError(error.message || 'Failed to reconnect WhatsApp')
    } finally {
      setConnecting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return '#00FFB2'
      case 'connecting':
        return '#00BFFF'
      case 'disconnected':
        return '#FF6B6B'
      case 'error':
        return '#FFA500'
      default:
        return 'rgba(240,240,255,0.6)'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return isRTL ? 'متصل' : 'Connected'
      case 'connecting':
        return isRTL ? 'جاري الاتصال...' : 'Connecting...'
      case 'disconnected':
        return isRTL ? 'منفصل' : 'Disconnected'
      case 'error':
        return isRTL ? 'خطأ' : 'Error'
      default:
        return isRTL ? 'غير متصل' : 'Not Connected'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'واتساب' : 'WhatsApp'}
        </h1>
        <p style={{ color: 'rgba(240,240,255,0.6)' }}>
          {isRTL ? 'إدارة اتصال واتساب الخاص بك' : 'Manage your WhatsApp connection'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {/* Connection Status Card */}
      <div className="rounded-2xl p-8" style={{ background: '#0F0F1A' }}>
        {!instance ? (
          // Not connected - Show connect button
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,178,0.1)' }}>
              <svg className="w-12 h-12" style={{ color: '#00FFB2' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#F0F0FF' }}>
                {isRTL ? 'اتصل بـ واتساب' : 'Connect WhatsApp'}
              </h2>
              <p className="mb-6" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL 
                  ? 'قم بمسح رمز QR لربط حساب واتساب الخاص بك' 
                  : 'Scan the QR code to link your WhatsApp account'}
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-8 py-4 rounded-xl font-bold transition-all"
                style={{
                  background: connecting ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                  color: '#050508',
                  opacity: connecting ? 0.7 : 1,
                }}
              >
                {connecting 
                  ? (isRTL ? 'جاري الاتصال...' : 'Connecting...') 
                  : (isRTL ? 'اتصال' : 'Connect')}
              </button>
            </div>
          </div>
        ) : (
          // Instance exists - Show status and actions
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: instance.profile_picture_url ? 'transparent' : 'rgba(0,255,178,0.1)' }}>
                  {instance.profile_picture_url ? (
                    <img src={instance.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8" style={{ color: '#00FFB2' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#F0F0FF' }}>
                    {instance.profile_name || isRTL ? 'واتساب' : 'WhatsApp'}
                  </h2>
                  {instance.phone_number && (
                    <p style={{ color: 'rgba(240,240,255,0.6)' }}>{instance.phone_number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: getStatusColor(instance.status) }}></div>
                <span className="font-bold" style={{ color: getStatusColor(instance.status) }}>
                  {getStatusText(instance.status)}
                </span>
              </div>
            </div>

            {/* QR Code Display */}
            {(qrCode || instance.status === 'connecting') && (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(0,255,178,0.05)' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
                  {isRTL ? 'امسح رمز QR' : 'Scan QR Code'}
                </h3>
                {qrCode ? (
                  <div className="inline-block p-4 rounded-xl bg-white">
                    <img 
                      src={`data:image/png;base64,${qrCode}`} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 mx-auto flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFB2]"></div>
                  </div>
                )}
                {pairingCode && (
                  <div className="mt-4">
                    <p className="text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                      {isRTL ? 'رمز الاقتران:' : 'Pairing Code:'}
                    </p>
                    <code className="px-4 py-2 rounded-lg text-xl font-bold" style={{ background: 'rgba(0,0,0,0.3)', color: '#00FFB2' }}>
                      {pairingCode}
                    </code>
                  </div>
                )}
                <p className="mt-4 text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL 
                    ? 'افتح واتساب على هاتفك > الإعدادات > الأجهزة المتصلة > ربط جهاز' 
                    : 'Open WhatsApp on your phone > Settings > Linked Devices > Link a Device'}
                </p>
              </div>
            )}

            {/* Connected State */}
            {instance.status === 'connected' && (
              <div className="rounded-2xl p-6" style={{ background: 'rgba(0,255,178,0.1)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6" style={{ color: '#00FFB2' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-bold" style={{ color: '#00FFB2' }}>
                    {isRTL ? 'تم الاتصال بنجاح!' : 'Successfully Connected!'}
                  </h3>
                </div>
                <p style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL 
                    ? 'حساب واتساب الخاص بك متصل الآن ويمكنه استقبال الرسائل.' 
                    : 'Your WhatsApp account is now connected and ready to receive messages.'}
                </p>
                {instance.connected_at && (
                  <p className="mt-2 text-sm" style={{ color: 'rgba(240,240,255,0.4)' }}>
                    {isRTL ? 'تم الاتصال في:' : 'Connected at:'} {new Date(instance.connected_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {instance.status === 'connected' ? (
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-4 rounded-xl font-bold transition-all"
                  style={{
                    background: 'rgba(255,107,107,0.1)',
                    color: '#FF6B6B',
                  }}
                >
                  {isRTL ? 'فصل الاتصال' : 'Disconnect'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReconnect}
                    disabled={connecting}
                    className="flex-1 py-4 rounded-xl font-bold transition-all"
                    style={{
                      background: connecting ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                      color: '#050508',
                      opacity: connecting ? 0.7 : 1,
                    }}
                  >
                    {connecting 
                      ? (isRTL ? 'جاري إعادة الاتصال...' : 'Reconnecting...') 
                      : (isRTL ? 'إعادة الاتصال' : 'Reconnect')}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-4 rounded-xl font-bold transition-all"
                    style={{
                      background: 'rgba(255,107,107,0.1)',
                      color: '#FF6B6B',
                    }}
                  >
                    {isRTL ? 'حذف' : 'Delete'}
                  </button>
                </>
              )}
            </div>

            {/* Instance Details */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'تفاصيل المثيل:' : 'Instance Details:'}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'rgba(240,240,255,0.4)' }}>{isRTL ? 'اسم المثيل:' : 'Instance Name:'}</span>
                  <div style={{ color: '#F0F0FF' }}>{instance.instance_name}</div>
                </div>
                <div>
                  <span style={{ color: 'rgba(240,240,255,0.4)' }}>{isRTL ? 'الحالة:' : 'Status:'}</span>
                  <div style={{ color: getStatusColor(instance.status) }}>{instance.status}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
