'use client'

import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input, { Textarea } from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { AlertCircle, CheckCircle2, RefreshCw, Send } from 'lucide-react'
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

interface CloudTemplate {
  id: number
  name: string
  language: string
  category: string
  status: string
  rejection_reason?: string | null
}

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function WhatsAppPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [templates, setTemplates] = useState<CloudTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [connection, setConnection] = useState({ phone_number_id: '', business_account_id: '', access_token: '', name: '' })
  const [template, setTemplate] = useState({ name: '', language: 'en_US', category: 'UTILITY', body: '' })

  const selectedChannel = channels.find(channel => String(channel.id) === selectedChannelId)
  const cloudChannels = channels.filter(channel => channel.type === 'whatsapp' && channel.metadata?.whatsapp_provider === 'cloud')

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
        : String(whatsapp.find(channel => channel.metadata?.whatsapp_provider === 'cloud')?.id || ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load WhatsApp channels.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadChannels() }, [loadChannels])

  const loadTemplates = useCallback(async (channelId: string) => {
    setTemplates([])
    if (!channelId) return
    setWorking(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/channels/whatsapp/${channelId}/templates`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not sync WhatsApp templates.')
      setTemplates(data.templates || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sync WhatsApp templates.')
    } finally {
      setWorking(false)
    }
  }, [])

  useEffect(() => {
    if (selectedChannel?.metadata?.whatsapp_provider === 'cloud') void loadTemplates(selectedChannelId)
    else setTemplates([])
  }, [loadTemplates, selectedChannel, selectedChannelId])

  const connectCloud = async (event: React.FormEvent) => {
    event.preventDefault()
    setWorking(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API}/api/channels/whatsapp/cloud`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify(connection),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not connect this WhatsApp Cloud number.')
      setConnection({ phone_number_id: '', business_account_id: '', access_token: '', name: '' })
      setNotice(data.webhook_subscribed
        ? 'WhatsApp Cloud API connected and its WABA webhook subscription was registered. Confirm the Meta app webhook subscribes to whatsapp_business_account messages.'
        : 'WhatsApp Cloud API connected, but the WABA webhook subscription failed. Check token permissions and subscribe the Meta app to whatsapp_business_account messages.')
      await loadChannels()
      if (data.channel?.id) setSelectedChannelId(String(data.channel.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect this WhatsApp Cloud number.')
    } finally {
      setWorking(false)
    }
  }

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedChannelId) return
    setWorking(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API}/api/channels/whatsapp/${selectedChannelId}/templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify({
          name: template.name,
          language: template.language,
          category: template.category,
          components: [{ type: 'BODY', text: template.body }],
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Template submission failed.')
      setTemplate({ name: '', language: 'en_US', category: 'UTILITY', body: '' })
      setNotice('Template submitted to Meta. It can be used for campaigns after Meta approves it.')
      await loadTemplates(selectedChannelId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Template submission failed.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Business"
        description="Manage official Cloud API connections and sync approved message templates."
        breadcrumbs={[{ label: 'NazBiz', href: '/dashboard' }, { label: 'WhatsApp' }]}
      />

      {error && <div role="alert" className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Connect WhatsApp Cloud API</CardTitle>
          <CardDescription>Enter the Meta phone number ID, WhatsApp Business Account ID, and a system-user access token with messaging and management permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={connectCloud} className="grid gap-4 md:grid-cols-2">
            <Input label="Phone number ID *" value={connection.phone_number_id} onChange={e => setConnection({ ...connection, phone_number_id: e.target.value })} required />
            <Input label="WhatsApp Business Account ID *" value={connection.business_account_id} onChange={e => setConnection({ ...connection, business_account_id: e.target.value })} required />
            <Input label="Display name" value={connection.name} onChange={e => setConnection({ ...connection, name: e.target.value })} />
            <Input label="System-user access token *" type="password" value={connection.access_token} onChange={e => setConnection({ ...connection, access_token: e.target.value })} required autoComplete="new-password" />
            <div className="md:col-span-2"><Button type="submit" variant="primary" loading={working} icon={<Send size={14} />}>Verify and connect</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>Connected WhatsApp numbers</CardTitle><CardDescription>Each account is listed independently. Evolution sessions are unofficial and cannot send campaigns.</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => void loadChannels()} loading={loading} icon={<RefreshCw size={14} />}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-text-secondary">Loading connections…</p> : channels.length === 0 ? <p className="text-sm text-text-secondary">No WhatsApp numbers are connected to this business.</p> : channels.map(channel => {
            const isCloud = channel.metadata?.whatsapp_provider === 'cloud'
            return (
              <button key={channel.id} type="button" onClick={() => setSelectedChannelId(String(channel.id))} className={`w-full rounded-xl border p-4 text-left ${selectedChannelId === String(channel.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-semibold text-text-primary">{channel.page_name || channel.metadata?.display_phone_number || channel.page_id}</p><p className="text-xs text-text-secondary">{channel.metadata?.display_phone_number || channel.page_id}</p></div>
                  <div className="flex gap-2"><Badge variant={isCloud ? 'success' : 'warning'} size="xs">{isCloud ? 'Official Cloud API' : 'Unofficial Evolution'}</Badge><Badge variant={channel.status === 'connected' ? 'success' : 'default'} size="xs">{channel.status}</Badge></div>
                </div>
                {isCloud && channel.metadata?.webhook_subscribed !== true && <p className="mt-2 text-xs text-warning">WABA webhook subscription is not confirmed; inbound updates may not reach Naz.</p>}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {selectedChannel?.metadata?.whatsapp_provider === 'cloud' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Templates for {selectedChannel.page_name}</CardTitle><CardDescription>Template statuses are refreshed from Meta. Campaigns can use approved templates only.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" onClick={() => void loadTemplates(selectedChannelId)} loading={working} icon={<RefreshCw size={14} />}>Sync from Meta</Button>
              {templates.length === 0 ? <p className="text-sm text-text-secondary">No templates returned for this number.</p> : templates.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-text-secondary">{item.language} · {item.category}{item.rejection_reason ? ` · ${item.rejection_reason}` : ''}</p></div>
                  <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'} size="xs">{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Submit a message template</CardTitle><CardDescription>Meta reviews new templates before they become available for campaigns.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={createTemplate} className="space-y-4">
                <Input label="Template name *" value={template.name} onChange={e => setTemplate({ ...template, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} required pattern="[a-z0-9_]+" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Language code *" value={template.language} onChange={e => setTemplate({ ...template, language: e.target.value })} placeholder="en_US" required />
                  <Select label="Category" value={template.category} onChange={e => setTemplate({ ...template, category: e.target.value })} options={[{ value: 'UTILITY', label: 'Utility' }, { value: 'MARKETING', label: 'Marketing' }, { value: 'AUTHENTICATION', label: 'Authentication' }]} />
                </div>
                <Textarea label="Body text *" value={template.body} onChange={e => setTemplate({ ...template, body: e.target.value })} rows={5} required />
                <Button type="submit" variant="primary" loading={working}>Submit to Meta</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
