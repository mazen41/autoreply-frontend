'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Image as ImageIcon, UploadCloud } from 'lucide-react'
import { getBusinessHeaders } from '../../../lib/businessContext'
import toast from 'react-hot-toast'
import Checkbox from '../../../components/ui/Checkbox'

interface ImageAnalysis {
  description?: string
  extracted_text?: string
  product_matches?: unknown[]
  confidence?: number
  detected_intent?: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function authHeaders(): Record<string, string> {
  const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('naz_token='))?.split('=')[1]
  return {
    Authorization: `Bearer ${decodeURIComponent(token || '')}`,
    Accept: 'application/json',
    ...getBusinessHeaders(),
  }
}

export default function MultimodalContent() {
  const [disclosureAcknowledged, setDisclosureAcknowledged] = useState(false)
  const [disclosureLoading, setDisclosureLoading] = useState(true)
  const [disclosureSaving, setDisclosureSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ImageAnalysis | null>(null)

  useEffect(() => {
    const loadDisclosure = async () => {
      try {
        const response = await fetch(`${apiBase}/api/media-processing/disclosure`, { headers: authHeaders() })
        if (response.ok) {
          const data = await response.json()
          setDisclosureAcknowledged(Boolean(data.acknowledged))
        }
      } catch {
        // Keep the disclosure unchecked if the setting cannot be loaded.
      } finally {
        setDisclosureLoading(false)
      }
    }
    loadDisclosure()
  }, [])

  const saveDisclosure = async (acknowledged: boolean) => {
    setDisclosureSaving(true)
    try {
      const response = await fetch(`${apiBase}/api/media-processing/disclosure`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged }),
      })
      if (!response.ok) throw new Error('Could not save disclosure acknowledgment')
      const data = await response.json()
      setDisclosureAcknowledged(Boolean(data.acknowledged))
      toast.success(acknowledged ? 'Disclosure acknowledgment saved' : 'Acknowledgment removed')
    } catch {
      toast.error('Could not save the media disclosure setting')
    } finally {
      setDisclosureSaving(false)
    }
  }

  const analyzeImage = async () => {
    if (!disclosureAcknowledged) {
      toast.error('Acknowledge the media processing disclosure first')
      return
    }
    if (!image) {
      toast.error('Choose an image to analyze')
      return
    }

    setTesting(true)
    setResult(null)
    const body = new FormData()
    body.append('image', image)
    try {
      const response = await fetch(`${apiBase}/api/multimodal/test-image`, {
        method: 'POST',
        headers: authHeaders(),
        body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Image analysis failed')
      setResult(data)
      toast.success('Image analyzed by the configured provider')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image analysis failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Media processing</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Incoming voice and image messages use the server-configured AI providers. Provider credentials and processing behavior are managed by the server.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface-elevated p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-warning" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">Third-party media processing disclosure</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Images and voice messages may be sent to the AI provider configured for this service so it can analyze or transcribe them.
            </p>
            {disclosureLoading ? (
              <p className="mt-3 text-sm text-text-tertiary">Loading disclosure status…</p>
            ) : (
              <Checkbox checked={disclosureAcknowledged} disabled={disclosureSaving} onChange={saveDisclosure} label="I acknowledge this media processing disclosure for this business." className="mt-4 text-sm" />
            )}
          </div>
          {disclosureAcknowledged && <CheckCircle2 className="h-5 w-5 text-success" aria-label="Acknowledged" />}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-elevated p-5">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-semibold text-text-primary">Test image analysis</h2>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          This sends the selected image to the configured vision provider. The image is not saved by this test endpoint.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-primary">
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Choose image
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => { setImage(event.target.files?.[0] || null); setResult(null) }}
            />
          </label>
          <span className="max-w-full truncate text-sm text-text-secondary">{image?.name || 'No image selected'}</span>
          <button
            type="button"
            onClick={analyzeImage}
            disabled={testing || disclosureLoading || !disclosureAcknowledged || !image}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? 'Analyzing…' : 'Analyze image'}
          </button>
        </div>

        {result && (
          <div className="mt-5 space-y-2 rounded-lg border border-border bg-surface p-4 text-sm text-text-primary">
            {typeof result.confidence === 'number' && <p><strong>Confidence:</strong> {Math.round(result.confidence * 100)}%</p>}
            {result.detected_intent && <p><strong>Detected intent:</strong> {result.detected_intent}</p>}
            {result.description && <p><strong>Description:</strong> {result.description}</p>}
            {result.extracted_text && <p><strong>Extracted text:</strong> {result.extracted_text}</p>}
            {!!result.product_matches?.length && <p><strong>Product matches:</strong> {JSON.stringify(result.product_matches)}</p>}
          </div>
        )}
      </section>
    </div>
  )
}
