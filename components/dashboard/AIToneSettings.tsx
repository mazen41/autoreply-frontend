'use client'

import React, { useState } from 'react'

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
    <div style={{ padding: '20px', background: 'var(--surface-elevated)', borderRadius: '12px' }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>AI Tone & Persona</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Tone Style
        </label>
        <select
          value={settings.tone}
          onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="friendly">Friendly & Conversational</option>
          <option value="professional">Professional & Formal</option>
          <option value="enthusiastic">Enthusiastic & Energetic</option>
          <option value="empathetic">Empathetic & Caring</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Formality Level
        </label>
        <select
          value={settings.formality}
          onChange={(e) => setSettings({ ...settings, formality: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="casual">Casual - Natural conversation</option>
          <option value="semi-formal">Semi-Formal - Balanced approach</option>
          <option value="formal">Formal - Professional language</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Communication Focus
        </label>
        <select
          value={settings.focus}
          onChange={(e) => setSettings({ ...settings, focus: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="support">Support - Problem solving</option>
          <option value="sales">Sales - Features & benefits</option>
          <option value="information">Information - Comprehensive answers</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          padding: '12px 24px',
          background: 'var(--accent)',
          color: 'var(--on-accent-text)',
          border: 'none',
          borderRadius: '8px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
          fontWeight: 600,
        }}
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}