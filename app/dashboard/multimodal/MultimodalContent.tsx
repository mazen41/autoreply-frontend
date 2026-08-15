'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface MultimodalConfig {
  speech_to_text_enabled: boolean
  speech_to_text_provider: string
  vision_enabled: boolean
  vision_provider: string
  document_processing_enabled: boolean
}

export default function MultimodalContent() {
  const { isRTL, t } = useLang()
  const [config, setConfig] = useState<MultimodalConfig>({
    speech_to_text_enabled: false,
    speech_to_text_provider: '',
    vision_enabled: false,
    vision_provider: '',
    document_processing_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testImage, setTestImage] = useState<File | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/multimodal/config`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/multimodal/config`, {
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
        toast.success('Configuration saved')
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleTestImage = async () => {
    if (!testImage) {
      toast.error('Please select an image to test')
      return
    }

    setTesting(true)
    setTestResult(null)

    const formData = new FormData()
    formData.append('image', testImage)

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/multimodal/test-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        setTestResult(data)
      } else {
        toast.error(data.error || 'Image processing failed')
      }
    } catch (error) {
      toast.error('Image processing failed')
    } finally {
      setTesting(false)
    }
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
          Multimodal AI
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Configure AI for voice, image, and document processing
        </p>
      </motion.div>

      {/* Voice/Speech */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Voice Processing
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Speech to Text</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Convert voice messages to text for AI processing</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, speech_to_text_enabled: !config.speech_to_text_enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.speech_to_text_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.speech_to_text_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {config.speech_to_text_enabled && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Provider: {config.speech_to_text_provider || 'Not configured'}
              </p>
              {!config.speech_to_text_provider && (
                <p className="text-xs" style={{ color: 'var(--error)' }}>
                  ⚠️ Speech-to-text API key not configured. Add SPEECH_TO_TEXT_API_KEY to your environment.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Vision/Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Image Processing
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Vision AI</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analyze images with AI for better responses</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, vision_enabled: !config.vision_enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.vision_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.vision_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {config.vision_enabled && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Provider: {config.vision_provider || 'Not configured'}
              </p>
              {!config.vision_provider && (
                <p className="text-xs" style={{ color: 'var(--error)' }}>
                  ⚠️ Vision API key not configured. Add VISION_API_KEY to your environment.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Test Image */}
      {config.vision_enabled && config.vision_provider && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="premium-card p-6"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
            Test Image Processing
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Select Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTestImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={handleTestImage}
              disabled={testing}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
              style={{ background: testing ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
            >
              {testing && (
                <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
              )}
              Test Image
            </button>
            {testResult && (
              <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>Analysis Result</h3>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {testResult.description || 'Image processed successfully'}
                </p>
                {testResult.tags && (
                  <div className="mt-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Detected tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {testResult.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Document Processing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Document Processing
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Document to RAG</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Process documents for knowledge base (already enabled in AI Knowledge)</p>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              Active
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Document processing is managed through the AI Knowledge page. Documents are automatically chunked and embedded for semantic search.
          </p>
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
          Save Configuration
        </button>
      </motion.div>
    </div>
  )
}