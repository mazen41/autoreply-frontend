'use client'

import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Channel {
  id: number
  type: string
  page_id: string
  page_name: string
  status: string
  metadata?: Record<string, any>
}

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function WhatsAppPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadChannels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const authToken = getToken()
      if (!authToken) throw new Error('Your session expired. Sign in again.')
      if (!getSelectedBusinessId()) throw new Error('Select a business before managing WhatsApp.')
      const response = await fetch(`${API}/api/channels`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not load WhatsApp channels.')
      const rows: Channel[] = Array.isArray(data) ? data : (data.data || [])
      const whatsapp = rows.filter(channel => channel.type === 'whatsapp')
      setChannels(whatsapp)
      setSelectedChannelId(current => whatsapp.some(channel => String(channel.id) === current)
        ? current
        : String(whatsapp[0]?.id || ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load WhatsApp channels.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadChannels() }, [loadChannels])

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Business"
        description="Manage your WhatsApp connections and monitor session status."
        breadcrumbs={[{ label: 'NazBiz', href: '/dashboard' }, { label: 'WhatsApp' }]}
      />

      {error && <div role="alert" className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>Connected WhatsApp numbers</CardTitle><CardDescription>Each account is listed independently. Connect new numbers from the Channels page.</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => void loadChannels()} loading={loading} icon={<RefreshCw size={14} />}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-text-secondary">Loading connections…</p> : channels.length === 0 ? <p className="text-sm text-text-secondary">No WhatsApp numbers are connected to this business.</p> : channels.map(channel => (
            <button key={channel.id} type="button" onClick={() => setSelectedChannelId(String(channel.id))} className={`w-full rounded-xl border p-4 text-left ${selectedChannelId === String(channel.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold text-text-primary">{channel.page_name || channel.metadata?.display_phone_number || channel.page_id}</p><p className="text-xs text-text-secondary">{channel.metadata?.display_phone_number || channel.page_id}</p></div>
                <Badge variant={channel.status === 'connected' ? 'success' : 'default'} size="xs">{channel.status}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
