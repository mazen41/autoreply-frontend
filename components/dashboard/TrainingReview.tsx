'use client'

import React, { useState, useEffect } from 'react'

interface Correction {
  id: number
  ai_draft: string
  human_correction: string
  approved: boolean
  learning_type: string
  created_at: string
}

interface TrainingReviewProps {
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export default function TrainingReview({ onApprove, onReject }: TrainingReviewProps) {
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null)

  useEffect(() => {
    fetchCorrections()
  }, [])

  const fetchCorrections = async () => {
    try {
      const response = await fetch('/api/training/corrections')
      const data = await response.json()
      setCorrections(data.corrections)
    } catch (error) {
      console.error('Failed to fetch corrections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await onApprove(id)
      setCorrections(corrections.map(c => c.id === id ? { ...c, approved: true } : c))
      setSelectedCorrection(null)
    } catch (error) {
      console.error('Failed to approve correction:', error)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await onReject(id)
      setCorrections(corrections.filter(c => c.id !== id))
      setSelectedCorrection(null)
    } catch (error) {
      console.error('Failed to reject correction:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading corrections...</div>
  }

  const pendingCorrections = corrections.filter(c => !c.approved)

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>AI Training Review</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '15px' 
        }}>
          <div style={{ 
            padding: '15px', 
            background: 'var(--surface-elevated)', 
            borderRadius: '8px',
            flex: 1 
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
              {pendingCorrections.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Pending Review
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            background: 'var(--surface-elevated)', 
            borderRadius: '8px',
            flex: 1 
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
              {corrections.filter(c => c.approved).length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Approved
            </div>
          </div>
        </div>
      </div>

      {selectedCorrection ? (
        <div style={{ 
          background: 'var(--surface-elevated)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setSelectedCorrection(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back to list
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600 
            }}>
              AI DRAFT
            </label>
            <div style={{ 
              padding: '15px', 
              background: 'var(--surface)', 
              borderRadius: '8px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedCorrection.ai_draft}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600 
            }}>
              HUMAN CORRECTION
            </label>
            <div style={{ 
              padding: '15px', 
              background: 'var(--surface)', 
              borderRadius: '8px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              border: '2px solid var(--accent)'
            }}>
              {selectedCorrection.human_correction}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600 
            }}>
              LEARNING TYPE
            </label>
            <div style={{ 
              padding: '8px 12px', 
              background: 'var(--surface)', 
              borderRadius: '6px',
              display: 'inline-block',
              color: 'var(--text-primary)'
            }}>
              {selectedCorrection.learning_type}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleApprove(selectedCorrection.id)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--accent)',
                color: 'var(--on-accent-text)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✓ Approve for Training
            </button>
            <button
              onClick={() => handleReject(selectedCorrection.id)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✕ Reject
            </button>
          </div>
        </div>
      ) : (
        <div>
          {pendingCorrections.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: 'var(--text-secondary)' 
            }}>
              No pending corrections to review
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingCorrections.map(correction => (
                <div
                  key={correction.id}
                  onClick={() => setSelectedCorrection(correction)}
                  style={{
                    padding: '15px',
                    background: 'var(--surface-elevated)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '8px' 
                  }}>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-tertiary)' 
                    }}>
                      {new Date(correction.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '2px 8px', 
                      background: 'var(--surface)', 
                      borderRadius: '4px',
                      color: 'var(--text-secondary)'
                    }}>
                      {correction.learning_type}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {correction.ai_draft}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}