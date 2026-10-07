'use client'

import React, { useState } from 'react'
import Select from '../ui/Select'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action'
  config: any
}

interface AutomationBuilderProps {
  onSave: (workflow: any) => void
}

export default function AutomationBuilder({ onSave }: AutomationBuilderProps) {
  const [workflowName, setWorkflowName] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [isActive, setIsActive] = useState(true)

  const addStep = (type: 'trigger' | 'condition' | 'action') => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type,
      config: {}
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id))
  }

  const updateStepConfig = (id: string, config: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, config } : step
    ))
  }

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    if (steps.length === 0) {
      alert('Please add at least one step')
      return
    }

    onSave({
      name: workflowName,
      active: isActive,
      trigger_config: steps.find(s => s.type === 'trigger')?.config || {},
      actions_config: steps.filter(s => s.type === 'action').map(s => s.config)
    })
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Automation Workflow Builder</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Workflow Name
        </label>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="e.g., Welcome new customers"
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

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Workflow Steps
        </label>
        
        {steps.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: 'var(--text-tertiary)',
            background: 'var(--surface-elevated)',
            borderRadius: '8px' 
          }}>
            No steps added yet. Start building your workflow.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((step, index) => (
              <div
                key={step.id}
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
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600,
                    color: 'var(--accent)',
                    textTransform: 'uppercase'
                  }}>
                    {step.type}
                  </span>
                  <button
                    onClick={() => removeStep(step.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {step.type === 'trigger' && (
                  <div>
                    <Select
                      label="Trigger Type"
                      value={step.config.type || ''}
                      onChange={(e) => updateStepConfig(step.id, { ...step.config, type: e.target.value })}
                      placeholder="Select trigger type"
                      options={[
                        { value: 'keyword', label: 'Keyword Match' },
                        { value: 'time', label: 'Time-based' },
                        { value: 'first_contact', label: 'First Contact' },
                        { value: 'tag_added', label: 'Tag Added' },
                        { value: 'message_received', label: 'Message Received' },
                      ]}
                    />
                  </div>
                )}

                {step.type === 'action' && (
                  <div>
                    <Select
                      label="Action Type"
                      value={step.config.type || ''}
                      onChange={(e) => updateStepConfig(step.id, { ...step.config, type: e.target.value })}
                      placeholder="Select action type"
                      options={[
                        { value: 'send_message', label: 'Send Message' },
                        { value: 'add_tag', label: 'Add Tag' },
                        { value: 'remove_tag', label: 'Remove Tag' },
                        { value: 'escalate', label: 'Escalate to Human' },
                        { value: 'webhook', label: 'Webhook Call' },
                        { value: 'pause_ai', label: 'Pause AI' },
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Add Step
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => addStep('trigger')}
            disabled={steps.some(s => s.type === 'trigger')}
            style={{
              flex: 1,
              padding: '10px',
              background: steps.some(s => s.type === 'trigger') ? 'var(--surface)' : 'var(--accent)',
              color: steps.some(s => s.type === 'trigger') ? 'var(--text-tertiary)' : 'var(--on-accent-text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: steps.some(s => s.type === 'trigger') ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            + Trigger
          </button>
          <button
            onClick={() => addStep('action')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + Action
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '12px',
          background: 'var(--accent)',
          color: 'var(--on-accent-text)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Save Workflow
      </button>
    </div>
  )
}