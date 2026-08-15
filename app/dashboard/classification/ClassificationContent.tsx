'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface ClassificationConfig {
  enabled: boolean
  categories: string[]
  priorities: string[]
  intents: string[]
  confidence_threshold: number
  auto_routing_enabled: boolean
}

export default function ClassificationContent() {
  const { isRTL, t } = useLang()
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

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/classification/config`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch classification config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/classification/config`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(config),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Classification settings saved')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a test message')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/classification/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ message: testMessage }),
      })
      const data = await res.json()

      if (res.ok) {
        setTestResult(data)
      } else {
        toast.error(data.error || 'Classification test failed')
      }
    } catch (error) {
      toast.error('Classification test failed')
    } finally {
      setTesting(false)
    }
  }

  const addCategory = () => {
    const newCategory = prompt('Enter new category:')
    if (newCategory && !config.categories.includes(newCategory)) {
      setConfig({ ...config, categories: [...config.categories, newCategory] })
    }
  }

  const removeCategory = (category: string) => {
    setConfig({ ...config, categories: config.categories.filter(c => c !== category) })
  }

  const addIntent = () => {
    const newIntent = prompt('Enter new intent:')
    if (newIntent && !config.intents.includes(newIntent)) {
      setConfig({ ...config, intents: [...config.intents, newIntent] })
    }
  }

  const removeIntent = (intent: string) => {
    setConfig({ ...config, intents: config.intents.filter(i => i !== intent) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          AI Classification
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Configure AI-powered conversation classification and routing
        </p>
      </motion.div>

      {/* Main Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
          Classification Settings
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Enable AI Classification</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Automatically classify incoming conversations</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Auto Routing</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Automatically route conversations based on classification</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, auto_routing_enabled: !config.auto_routing_enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.auto_routing_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.auto_routing_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Confidence Threshold: {Math.round(config.confidence_threshold * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.confidence_threshold}
              onChange={(e) => setConfig({ ...config, confidence_threshold: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Categories
          </h2>
          <button
            onClick={addCategory}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            + Add Category
          </button>
        </div>
        <div className="space-y-2">
          {config.categories.map((category) => (
            <div key={category} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{category}</span>
              <button
                onClick={() => removeCategory(category)}
                className="text-xs"
                style={{ color: 'var(--error)' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Intents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Intents
          </h2>
          <button
            onClick={addIntent}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            + Add Intent
          </button>
        </div>
        <div className="space-y-2">
          {config.intents.map((intent) => (
            <div key={intent} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{intent}</span>
              <button
                onClick={() => removeIntent(intent)}
                className="text-xs"
                style={{ color: 'var(--error)' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Test Classification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Test Classification
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a customer message to test classification..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
            style={{ background: testing ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
          >
            {testing && (
              <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
            )}
            Test Classification
          </button>

          {testResult && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>Classification Result</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{testResult.category}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Intent:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{testResult.intent}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{testResult.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{Math.round(testResult.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
          style={{ background: saving ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
        >
          {saving && (
            <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
          )}
          Save Settings
        </button>
      </motion.div>
    </div>
  )
}