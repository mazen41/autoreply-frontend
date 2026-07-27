'use client'

import React, { useState, useEffect } from 'react'

interface Campaign {
  id: number
  name: string
  message: string
  scheduled_for: string
  status: 'scheduled' | 'sent' | 'cancelled'
  recipients_count: number
  delivered_count: number
}

interface ProactiveCampaignsProps {
  onCreate: (campaign: any) => void
  onSend: (id: number) => void
  onCancel: (id: number) => void
}

export default function ProactiveCampaigns({ onCreate, onSend, onCancel }: ProactiveCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    scheduled_for: '',
    segment_config: {
      channels: [],
      tags: [],
      date_range: {}
    }
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/proactive')
      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await onCreate(newCampaign)
      setShowCreateForm(false)
      setNewCampaign({
        name: '',
        message: '',
        scheduled_for: '',
        segment_config: {
          channels: [],
          tags: [],
          date_range: {}
        }
      })
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  const handleSend = async (id: number) => {
    try {
      await onSend(id)
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to send campaign:', error)
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await onCancel(id)
      fetchCampaigns()
    } catch (error) {
      console.error('Failed to cancel campaign:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading campaigns...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>Proactive Campaigns</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: 'var(--on-accent-text)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + New Campaign
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          background: 'var(--surface-elevated)', 
          borderRadius: '12px' 
        }}>
          <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Create Campaign</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Campaign Name
            </label>
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g., Weekly promotion"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Message
            </label>
            <textarea
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              placeholder="Your promotional message..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Schedule For
            </label>
            <input
              type="datetime-local"
              value={newCampaign.scheduled_for}
              onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_for: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreate}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--accent)',
                color: 'var(--on-accent-text)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Create Campaign
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: 'var(--text-secondary)' 
        }}>
          No campaigns yet. Create your first proactive campaign!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              style={{
                padding: '15px',
                background: 'var(--surface-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {campaign.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {new Date(campaign.scheduled_for).toLocaleString()}
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 
                    campaign.status === 'sent' ? 'var(--success-subtle)' :
                    campaign.status === 'cancelled' ? 'var(--error-subtle)' :
                    'var(--accent-subtle)',
                  color: 
                    campaign.status === 'sent' ? 'var(--success)' :
                    campaign.status === 'cancelled' ? 'var(--error)' :
                    'var(--accent)'
                }}>
                  {campaign.status}
                </div>
              </div>

              <div style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {campaign.message}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center' 
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {campaign.recipients_count} recipients
                </div>
                
                {campaign.status === 'scheduled' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSend(campaign.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent)',
                        color: 'var(--on-accent-text)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Send Now
                    </button>
                    <button
                      onClick={() => handleCancel(campaign.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}