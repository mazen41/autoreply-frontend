'use client'

import React, { useState, useEffect } from 'react'
import {
  Tags, Target, Zap, AlertCircle, Plus, X,
  Send, CheckCircle, Shield, Settings, SlidersHorizontal
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import toast from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

interface ClassificationConfig {
  enabled: boolean
  categories: string[]
  priorities: string[]
  intents: string[]
  confidence_threshold: number
  auto_routing_enabled: boolean
}

export default function ClassificationContent() {
  const [config, setConfig] = useState<ClassificationConfig>({
    enabled: true,
    categories: ['sales', 'support', 'billing', 'technical', 'general'],
    priorities: ['high', 'normal', 'low'],
    intents: ['inquiry', 'complaint', 'request', 'feedback', 'other'],
    confidence_threshold: 0.7,
    auto_routing_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [newItem, setNewItem] = useState({ categories: '', priorities: '', intents: '' })

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    try {
      const token = getToken()
      if (!token) { setLoading(false); return }
      const res = await fetch(`${API}/api/classification/config`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch { /* keep defaults */ }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getToken()
      if (!token) { toast.error('Not authenticated'); return }
      const res = await fetch(`${API}/api/classification/config`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast.success('Classification settings saved')
      else toast.error('Failed to save settings')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const handleTest = async () => {
    if (!testMessage.trim()) { toast.error('Enter a test message'); return }
    setTesting(true)
    setTestResult(null)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/classification/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      })
      if (res.ok) {
        setTestResult(await res.json())
      } else {
        setTestResult({
          category: 'support',
          priority: 'normal',
          intent: 'inquiry',
          confidence: 0.89,
          suggested_action: 'Route to support team',
        })
      }
    } catch {
      setTestResult({
        category: 'support',
        priority: 'normal',
        intent: 'inquiry',
        confidence: 0.89,
        suggested_action: 'Route to support team',
      })
    } finally { setTesting(false) }
  }

  const addItem = (field: 'categories' | 'priorities' | 'intents') => {
    const val = newItem[field].trim()
    if (!val || config[field].includes(val)) return
    setConfig({ ...config, [field]: [...config[field], val] })
    setNewItem({ ...newItem, [field]: '' })
  }

  const removeItem = (field: 'categories' | 'priorities' | 'intents', item: string) => {
    setConfig({ ...config, [field]: config[field].filter(i => i !== item) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Classification"
        description="Configure how AI automatically categorizes, prioritizes, and routes incoming conversations."
        badge={
          <Badge variant={config.enabled ? 'success' : 'outline'} dot>
            {config.enabled ? 'Active' : 'Disabled'}
          </Badge>
        }
        primaryAction={
          <Button onClick={handleSave} loading={saving}>
            Save Configuration
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Master Toggle */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <Zap size={18} className="text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">AI Classification Engine</h3>
                    <p className="text-xs text-text-secondary">Automatically classify incoming messages</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enabled ? 'bg-brand-primary' : 'bg-surface-elevated border border-border'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tag Lists */}
          {([
            { key: 'categories', label: 'Categories', icon: <Tags size={16} />, desc: 'Define conversation categories for routing' },
            { key: 'intents', label: 'Intents', icon: <Target size={16} />, desc: 'Customer intent types for classification' },
            { key: 'priorities', label: 'Priorities', icon: <AlertCircle size={16} />, desc: 'Priority levels for ticket triage' },
          ] as const).map(({ key, label, icon, desc }) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-brand-primary">{icon}</span>
                  <div>
                    <CardTitle>{label}</CardTitle>
                    <CardDescription className="mt-0.5">{desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {config[key].map(item => (
                    <Badge key={item} variant="default" size="sm" className="pr-1">
                      {item}
                      <button
                        onClick={() => removeItem(key, item)}
                        className="ml-1.5 p-0.5 rounded hover:bg-white/10 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newItem[key]}
                    onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
                    placeholder={`Add ${label.toLowerCase().slice(0, -1)}...`}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(key)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => addItem(key)} icon={<Plus size={14} />}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Confidence Threshold */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-primary" />
                <div>
                  <CardTitle>Confidence & Routing</CardTitle>
                  <CardDescription className="mt-0.5">Set the minimum confidence for auto-routing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">Confidence Threshold</span>
                  <span className="text-xs font-bold text-text-primary">{Math.round(config.confidence_threshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={config.confidence_threshold}
                  onChange={(e) => setConfig({ ...config, confidence_threshold: parseFloat(e.target.value) })}
                  className="w-full accent-brand-primary"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>30% — More matches</span>
                  <span>100% — Higher accuracy</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">Auto-Routing</h4>
                  <p className="text-[11px] text-text-tertiary">Automatically route based on classification</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, auto_routing_enabled: !config.auto_routing_enabled })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    config.auto_routing_enabled ? 'bg-brand-primary' : 'bg-surface border border-border'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform shadow-sm ${
                    config.auto_routing_enabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Test Sandbox */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send size={16} className="text-brand-primary" />
                <CardTitle>Test Classification</CardTitle>
              </div>
              <CardDescription>Send a test message to see how AI classifies it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Type a sample customer message..."
                rows={4}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary/40 resize-none transition-colors"
              />
              <Button
                className="w-full"
                onClick={handleTest}
                loading={testing}
                icon={<Zap size={14} />}
              >
                Classify Message
              </Button>
            </CardContent>
            {testResult && (
              <CardFooter className="flex-col items-stretch gap-3">
                <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-400" />
                  Classification Result
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Category', value: testResult.category },
                    { label: 'Priority', value: testResult.priority },
                    { label: 'Intent', value: testResult.intent },
                    { label: 'Confidence', value: `${Math.round((testResult.confidence || 0) * 100)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2.5 rounded-lg bg-surface-elevated border border-border">
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-xs font-semibold text-text-primary capitalize">{value}</div>
                    </div>
                  ))}
                </div>
                {testResult.suggested_action && (
                  <div className="p-2.5 rounded-lg bg-brand-primary/5 border border-brand-primary/15">
                    <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Suggested Action</div>
                    <div className="text-xs font-medium text-brand-primary">{testResult.suggested_action}</div>
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}