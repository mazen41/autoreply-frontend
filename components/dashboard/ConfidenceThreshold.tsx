'use client'

import React, { useState } from 'react'

interface ConfidenceThresholdProps {
  currentThreshold: number
  onSave: (threshold: number) => void
}

export default function ConfidenceThreshold({ currentThreshold, onSave }: ConfidenceThresholdProps) {
  const [threshold, setThreshold] = useState(currentThreshold)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(threshold)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ padding: '20px', background: 'var(--surface-elevated)', borderRadius: '12px' }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>AI Confidence Threshold</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Minimum Confidence Score: {threshold}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: 'var(--border)',
            outline: 'none',
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--text-tertiary)' 
        }}>
          <span>More Human Intervention</span>
          <span>More AI Autonomy</span>
        </div>
      </div>

      <div style={{ 
        padding: '12px', 
        background: 'var(--surface)', 
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <strong>How it works:</strong> AI responses below this confidence score will be automatically escalated to human review instead of being sent to customers.
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
        {isSaving ? 'Saving...' : 'Save Threshold'}
      </button>
    </div>
  )
}