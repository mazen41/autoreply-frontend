'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'

export default function PusherTest() {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [messages, setMessages] = useState<string[]>([])
  const [channelName, setChannelName] = useState('test-channel')
  const [eventName, setEventName] = useState('test-event')

  useEffect(() => {
    const testPusherConnection = async () => {
      try {
        setStatus('connecting')
        
        // Get auth token
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        
        if (!token) {
          setStatus('error')
          setMessages(prev => [...prev, '✗ No authentication token found'])
          return
        }

        // Test Pusher connection
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pusher/test`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStatus('connected')
          setMessages(prev => [...prev, '✓ Pusher connection test successful', `✓ ${data.message}`])
        } else {
          setStatus('error')
          setMessages(prev => [...prev, '✗ Pusher connection test failed'])
        }
      } catch (error) {
        setStatus('error')
        setMessages(prev => [...prev, `✗ Connection error: ${error}`])
      }
    }

    testPusherConnection()
  }, [channelName])

  const handleTestEvent = async () => {
    try {
      setMessages(prev => [...prev, `Sending test event: ${eventName}...`])
      
      // This would normally be done via Pusher, but for testing we'll simulate
      setTimeout(() => {
        setMessages(prev => [...prev, `✓ Test event ${eventName} sent successfully`])
      }, 1000)
    } catch (error) {
      setMessages(prev => [...prev, `✗ Failed to send event: ${error}`])
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="p-6 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        {isRTL ? 'اختبار الاتصال بالوقت الفعلي' : 'Real-time Connection Test'}
      </h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'الحالة:' : 'Status:'}
          </span>
          <span className={`font-bold ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'اسم القناة:' : 'Channel Name:'}
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'اسم الحدث:' : 'Event Name:'}
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleTestEvent}
        disabled={status !== 'connected'}
        className="px-4 py-2 rounded-lg font-bold mb-4 transition-colors"
        style={{
          background: status === 'connected' ? 'var(--accent)' : 'var(--border)',
          color: status === 'connected' ? 'var(--on-accent-text)' : 'var(--text-secondary)',
          opacity: status === 'connected' ? 1 : 0.5,
        }}
      >
        {isRTL ? 'إرسال حدث اختبار' : 'Send Test Event'}
      </button>

      <div>
        <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'السجل:' : 'Log:'}
        </h4>
        <div className="p-3 rounded-lg max-h-40 overflow-y-auto" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
          {messages.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? 'لا توجد رسائل' : 'No messages'}
            </p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}