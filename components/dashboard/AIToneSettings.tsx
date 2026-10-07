'use client'

import React, { useState } from 'react'
import Select from '../ui/Select'
import Button from '../ui/Button'

interface AIToneSettingsProps {
  currentSettings: {
    tone: string
    formality: string
    focus: string
  }
  onSave: (settings: any) => void
}

export default function AIToneSettings({ currentSettings, onSave }: AIToneSettingsProps) {
  const [settings, setSettings] = useState(currentSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(settings)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 bg-surface-elevated rounded-2xl border border-border space-y-5">
      <div>
        <h3 className="text-base font-bold text-text-primary">AI Tone & Persona</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure how the AI communicates and balances warmth, formality, and sales goals.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label="Tone Style"
          value={settings.tone}
          onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
          options={[
            { value: 'friendly', label: 'Friendly & Conversational (Warm & Accessible)' },
            { value: 'professional', label: 'Professional & Formal (Corporate & Structured)' },
            { value: 'enthusiastic', label: 'Enthusiastic & Energetic (Engaging & High-Vibe)' },
            { value: 'empathetic', label: 'Empathetic & Caring (Customer-Support Centric)' },
          ]}
        />

        <Select
          label="Formality Level"
          value={settings.formality}
          onChange={(e) => setSettings({ ...settings, formality: e.target.value })}
          options={[
            { value: 'casual', label: 'Casual — Natural, approachable conversation' },
            { value: 'semi-formal', label: 'Semi-Formal — Balanced SaaS standard' },
            { value: 'formal', label: 'Formal — Professional and strictly polite' },
          ]}
        />

        <Select
          label="Communication Focus"
          value={settings.focus}
          onChange={(e) => setSettings({ ...settings, focus: e.target.value })}
          options={[
            { value: 'support', label: 'Support — Problem solving & clear instructions' },
            { value: 'sales', label: 'Sales — Features, benefits & order conversion' },
            { value: 'information', label: 'Information — Comprehensive answers & FAQs' },
          ]}
        />
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
        >
          Save Settings
        </Button>
      </div>
    </div>
  )
}