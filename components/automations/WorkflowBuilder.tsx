'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useLang } from '../../lib/LangContext'
import {
  Zap, Clock, GitBranch, Send, Tag, User, Webhook,
  Plus, Trash2, Save, X, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'delay' | 'action'
  label: string
  icon: React.ElementType
  config: Record<string, any>
  position: { x: number; y: number }
}

interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

interface WorkflowBuilderProps {
  initialNodes?: WorkflowNode[]
  initialConnections?: WorkflowConnection[]
  onSave?: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => Promise<boolean>
  availableAgents?: Array<{ id: number; name: string }>
  availableBots?: Array<{ id: number; name: string }>
  availableSequences?: Array<{ id: number; name: string }>
}

// ─── Default Nodes ─────────────────────────────────────────────────────────────

const createDefaultNodes = (): WorkflowNode[] => [
  {
    id: 'trigger-1',
    type: 'trigger',
    label: 'Trigger',
    icon: Zap,
    config: { type: 'keyword', keywords: [] },
    position: { x: 50, y: 50 },
  },
]

// ─── Node Config Panel ─────────────────────────────────────────────────────────

function NodeConfigPanel({
  node,
  onClose,
  onUpdate,
  availableAgents,
  availableBots,
  availableSequences,
}: {
  node: WorkflowNode
  onClose: () => void
  onUpdate: (config: Record<string, any>) => void
  availableAgents?: Array<{ id: number; name: string }>
  availableBots?: Array<{ id: number; name: string }>
  availableSequences?: Array<{ id: number; name: string }>
}) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [config, setConfig] = useState(node.config)

  const updateField = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-[var(--surface-elevated)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-bold text-[var(--text-primary)]">{node.label}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-tertiary)]">
            <X size={16} />
          </button>
        </div>

        {/* Config Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Trigger Config */}
          {node.type === 'trigger' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Trigger Type', 'نوع المحفز')}</label>
                <select
                  value={config.type || 'keyword'}
                  onChange={e => updateField('type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="keyword">{L('Keyword Match', 'تطابق الكلمات')}</option>
                  <option value="first_contact">{L('First Contact', 'أول اتصال')}</option>
                  <option value="tag_added">{L('Tag Added', 'إضافة علامة')}</option>
                  <option value="order_status_changed">{L('Order Status', 'حالة الطلب')}</option>
                  <option value="escalation_triggered">{L('Escalation', 'تصعيد')}</option>
                </select>
              </div>
              {(config.type === 'keyword') && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Keywords', 'الكلمات المفتاحية')}</label>
                  <textarea
                    value={(config.keywords || []).join('\n')}
                    onChange={e => updateField('keywords', e.target.value.split('\n').filter(Boolean))}
                    placeholder={L('One keyword per line', 'كلمة واحدة في كل سطر')}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>
              )}
            </>
          )}

          {/* Condition Config */}
          {node.type === 'condition' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Field', 'الحقل')}</label>
                <select
                  value={config.field || 'customer_tag'}
                  onChange={e => updateField('field', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="customer_tag">{L('Customer Tag', 'علامة العميل')}</option>
                  <option value="conversation_status">{L('Conversation Status', 'حالة المحادثة')}</option>
                  <option value="message_contains">{L('Message Contains', 'تحتوي الرسالة')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Value', 'القيمة')}</label>
                <input
                  type="text"
                  value={config.value || ''}
                  onChange={e => updateField('value', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </>
          )}

          {/* Delay Config */}
          {node.type === 'delay' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Duration', 'المدة')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={config.value || 1}
                    onChange={e => updateField('value', parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                  <select
                    value={config.unit || 'hours'}
                    onChange={e => updateField('unit', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="minutes">{L('Minutes', 'دقائق')}</option>
                    <option value="hours">{L('Hours', 'ساعات')}</option>
                    <option value="days">{L('Days', 'أيام')}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Action Config */}
          {node.type === 'action' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Action Type', 'نوع الإجراء')}</label>
                <select
                  value={config.type || 'send_message'}
                  onChange={e => updateField('type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="send_message">{L('Send Message', 'إرسال رسالة')}</option>
                  <option value="add_tag">{L('Add Tag', 'إضافة علامة')}</option>
                  <option value="remove_tag">{L('Remove Tag', 'إزالة علامة')}</option>
                  <option value="assign_agent">{L('Assign Agent', 'تعيين وكيل')}</option>
                  <option value="send_webhook">{L('Send Webhook', 'إرسال Webhook')}</option>
                  <option value="update_custom_field">{L('Update Custom Field', 'تحديث حقل مخصص')}</option>
                  <option value="toggle_ai">{L('Toggle AI', 'تبديل AI')}</option>
                  <option value="start_sequence">{L('Start Sequence', 'بدء تسلسل')}</option>
                  <option value="stop_sequence">{L('Stop Sequence', 'إيقاف تسلسل')}</option>
                </select>
              </div>

              {config.type === 'send_message' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Message', 'الرسالة')}</label>
                  <textarea
                    value={config.message || ''}
                    onChange={e => updateField('message', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>
              )}

              {(config.type === 'add_tag' || config.type === 'remove_tag') && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Tag', 'العلامة')}</label>
                  <input
                    type="text"
                    value={config.tag || ''}
                    onChange={e => updateField('tag', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {config.type === 'assign_agent' && availableAgents && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Agent', 'الوكيل')}</label>
                  <select
                    value={config.agent_id || ''}
                    onChange={e => updateField('agent_id', parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">{L('Select Agent', 'اختر وكيل')}</option>
                    {availableAgents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {config.type === 'send_webhook' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Webhook URL', 'رابط Webhook')}</label>
                  <input
                    type="url"
                    value={config.url || ''}
                    onChange={e => updateField('url', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {config.type === 'update_custom_field' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Field Name', 'اسم الحقل')}</label>
                    <input
                      type="text"
                      value={config.field || ''}
                      onChange={e => updateField('field', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Value', 'القيمة')}</label>
                    <input
                      type="text"
                      value={config.value || ''}
                      onChange={e => updateField('value', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </>
              )}

              {config.type === 'toggle_ai' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('AI Enabled', 'تفعيل AI')}</label>
                  <select
                    value={config.ai_enabled !== undefined ? String(config.ai_enabled) : 'true'}
                    onChange={e => updateField('ai_enabled', e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="true">{L('Enable', 'تفعيل')}</option>
                    <option value="false">{L('Disable', 'تعطيل')}</option>
                  </select>
                </div>
              )}

              {(config.type === 'start_sequence' || config.type === 'stop_sequence') && availableSequences && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">{L('Sequence', 'التسلسل')}</label>
                  <select
                    value={config.sequence_id || ''}
                    onChange={e => updateField('sequence_id', parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">{L('Select Sequence', 'اختر تسلسل')}</option>
                    {availableSequences.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-bold hover:brightness-110 transition-all"
          >
            {L('Done', 'تم')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Builder ──────────────────────────────────────────────────────────────

export default function WorkflowBuilder({
  initialNodes,
  initialConnections = [],
  onSave,
  availableAgents = [],
  availableBots = [],
  availableSequences = [],
}: WorkflowBuilderProps) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes || createDefaultNodes())
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addNode = useCallback((type: WorkflowNode['type']) => {
    const icons: Record<string, React.ElementType> = {
      trigger: Zap,
      condition: GitBranch,
      delay: Clock,
      action: Send,
    }
    const labels: Record<string, string> = {
      trigger: L('Trigger', 'محفز'),
      condition: L('Condition', 'شرط'),
      delay: L('Delay', 'تأخير'),
      action: L('Action', 'إجراء'),
    }
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: labels[type],
      icon: icons[type],
      config: type === 'trigger' ? { type: 'keyword', keywords: [] } : {},
      position: { x: 100 + Math.random() * 200, y: 100 + nodes.length * 120 },
    }
    setNodes(prev => [...prev, newNode])
  }, [nodes.length, L])

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId))
    if (selectedNode?.id === nodeId) setSelectedNode(null)
  }, [selectedNode])

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config } : n))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, config } : null)
    }
  }, [selectedNode])

  const handleSave = useCallback(async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(nodes, connections)
    } finally {
      setSaving(false)
    }
  }, [nodes, connections, onSave])

  const nodeColors: Record<string, string> = {
    trigger: 'border-amber-500/50 bg-amber-500/10',
    condition: 'border-blue-500/50 bg-blue-500/10',
    delay: 'border-purple-500/50 bg-purple-500/10',
    action: 'border-emerald-500/50 bg-emerald-500/10',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--text-primary)]">{L('Workflow Builder', 'منشئ سير العمل')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode('condition')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors text-[var(--text-secondary)]"
          >
            <GitBranch size={12} /> {L('Condition', 'شرط')}
          </button>
          <button
            onClick={() => addNode('delay')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors text-[var(--text-secondary)]"
          >
            <Clock size={12} /> {L('Delay', 'تأخير')}
          </button>
          <button
            onClick={() => addNode('action')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors text-[var(--text-secondary)]"
          >
            <Plus size={12} /> {L('Action', 'إجراء')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-white hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {L('Save', 'حفظ')}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 overflow-auto bg-[var(--background)] relative" style={{ minHeight: '500px' }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Nodes */}
        {nodes.map(node => {
          const Icon = node.icon
          const isSelected = selectedNode?.id === node.id
          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}`}
              style={{ left: node.position.x, top: node.position.y }}
              onClick={() => setSelectedNode(node)}
            >
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 shadow-lg ${nodeColors[node.type]}`}>
                <Icon size={14} className="text-[var(--text-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)] whitespace-nowrap">{node.label}</span>
                {node.type !== 'trigger' && (
                  <button
                    onClick={e => { e.stopPropagation(); removeNode(node.id) }}
                    className="p-0.5 rounded hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Zap size={48} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">{L('Add nodes to build your workflow', 'أضف عقد لبناء سير العمل')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
          availableAgents={availableAgents}
          availableBots={availableBots}
          availableSequences={availableSequences}
        />
      )}
    </div>
  )
}
