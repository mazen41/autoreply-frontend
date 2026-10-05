'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../lib/LangContext'
import {
  Plus, Trash2, Edit2, Users, Tag, ShoppingCart,
  Clock, Search, ChevronDown, ChevronUp, X, Save, FileText
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

interface Segment {
  id: number
  name: string
  rules: {
    tags?: string[]
    min_spent?: number
    last_order_days_ago?: number
    min_orders?: number
    location?: string
  } | null
  created_at: string
}

interface CampaignTemplate {
  id: number
  title: string
  channel_type: string
  body: string
  variables: string[] | null
  category: string
  created_at: string
}

export default function SegmentsAndTemplates() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [activeTab, setActiveTab] = useState<'segments' | 'templates'>('segments')
  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showSegmentForm, setShowSegmentForm] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null)

  // Segment form state
  const [segmentName, setSegmentName] = useState('')
  const [segmentTags, setSegmentTags] = useState('')
  const [segmentMinSpent, setSegmentMinSpent] = useState('')
  const [segmentLastOrderDays, setSegmentLastOrderDays] = useState('')
  const [segmentMinOrders, setSegmentMinOrders] = useState('')

  // Template form state
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateChannel, setTemplateChannel] = useState('whatsapp')
  const [templateBody, setTemplateBody] = useState('')
  const [templateCategory, setTemplateCategory] = useState('general')

  const fetchSegments = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/segments`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setSegments(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/campaign-templates`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSegments()
    fetchTemplates()
  }, [fetchSegments, fetchTemplates])

  const saveSegment = async () => {
    const token = getToken()
    const payload = {
      name: segmentName,
      rules: {
        tags: segmentTags.split(',').map(t => t.trim()).filter(Boolean),
        min_spent: segmentMinSpent ? parseFloat(segmentMinSpent) : undefined,
        last_order_days_ago: segmentLastOrderDays ? parseInt(segmentLastOrderDays) : undefined,
        min_orders: segmentMinOrders ? parseInt(segmentMinOrders) : undefined,
      },
    }

    const url = editingSegment
      ? `${API}/api/segments/${editingSegment.id}`
      : `${API}/api/segments`
    const method = editingSegment ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowSegmentForm(false)
      setEditingSegment(null)
      setSegmentName('')
      setSegmentTags('')
      setSegmentMinSpent('')
      setSegmentLastOrderDays('')
      setSegmentMinOrders('')
      fetchSegments()
    }
  }

  const saveTemplate = async () => {
    const token = getToken()
    const payload = {
      title: templateTitle,
      channel_type: templateChannel,
      body: templateBody,
      category: templateCategory,
    }

    const url = editingTemplate
      ? `${API}/api/campaign-templates/${editingTemplate.id}`
      : `${API}/api/campaign-templates`
    const method = editingTemplate ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowTemplateForm(false)
      setEditingTemplate(null)
      setTemplateTitle('')
      setTemplateBody('')
      setTemplateCategory('general')
      fetchTemplates()
    }
  }

  const deleteSegment = async (id: number) => {
    const token = getToken()
    await fetch(`${API}/api/segments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    fetchSegments()
  }

  const deleteTemplate = async (id: number) => {
    const token = getToken()
    await fetch(`${API}/api/campaign-templates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    fetchTemplates()
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('segments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'segments'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={14} /> {L('Segments', 'الشرائح')}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileText size={14} /> {L('Templates', 'القوالب')}
        </button>
      </div>

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">{L('Audience Segments', 'شرائح الجمهور')}</h3>
            <button
              onClick={() => setShowSegmentForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
            >
              <Plus size={12} /> {L('New Segment', 'شريحة جديدة')}
            </button>
          </div>

          {showSegmentForm && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
              <input
                type="text"
                value={segmentName}
                onChange={e => setSegmentName(e.target.value)}
                placeholder={L('Segment name', 'اسم الشريحة')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={segmentTags}
                  onChange={e => setSegmentTags(e.target.value)}
                  placeholder={L('Tags (comma separated)', 'العلامات (مفصولة بفواصل)')}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                />
                <input
                  type="number"
                  value={segmentMinSpent}
                  onChange={e => setSegmentMinSpent(e.target.value)}
                  placeholder={L('Min spent', 'الحد الأدنى للإنفاق')}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                />
                <input
                  type="number"
                  value={segmentLastOrderDays}
                  onChange={e => setSegmentLastOrderDays(e.target.value)}
                  placeholder={L('Last order within days', 'آخر طلب خلال أيام')}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                />
                <input
                  type="number"
                  value={segmentMinOrders}
                  onChange={e => setSegmentMinOrders(e.target.value)}
                  placeholder={L('Min orders', 'الحد الأدنى للطلبات')}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveSegment}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
                >
                  <Save size={12} /> {L('Save', 'حفظ')}
                </button>
                <button
                  onClick={() => { setShowSegmentForm(false); setEditingSegment(null) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-text-secondary hover:bg-surface transition-all"
                >
                  <X size={12} /> {L('Cancel', 'إلغاء')}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {segments.map(segment => (
              <div key={segment.id} className="p-4 rounded-xl bg-surface-elevated border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{segment.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {segment.rules?.tags?.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent font-bold">
                          {tag}
                        </span>
                      ))}
                      {segment.rules?.min_spent && (
                        <span className="text-[10px] text-text-tertiary">
                          {L('Min spent:', 'الحد الأدنى:')} ${segment.rules.min_spent}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSegment(segment)
                        setSegmentName(segment.name)
                        setSegmentTags(segment.rules?.tags?.join(', ') || '')
                        setSegmentMinSpent(segment.rules?.min_spent?.toString() || '')
                        setSegmentLastOrderDays(segment.rules?.last_order_days_ago?.toString() || '')
                        setSegmentMinOrders(segment.rules?.min_orders?.toString() || '')
                        setShowSegmentForm(true)
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-accent transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteSegment(segment.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {segments.length === 0 && !showSegmentForm && (
              <p className="text-center py-8 text-text-tertiary text-sm">
                {L('No segments created yet', 'لم يتم إنشاء شرائح بعد')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">{L('Campaign Templates', 'قوالب الحملات')}</h3>
            <button
              onClick={() => setShowTemplateForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
            >
              <Plus size={12} /> {L('New Template', 'قالب جديد')}
            </button>
          </div>

          {showTemplateForm && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
              <input
                type="text"
                value={templateTitle}
                onChange={e => setTemplateTitle(e.target.value)}
                placeholder={L('Template title', 'عنوان القالب')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={templateChannel}
                  onChange={e => setTemplateChannel(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
                <select
                  value={templateCategory}
                  onChange={e => setTemplateCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="general">{L('General', 'عام')}</option>
                  <option value="abandoned_cart">{L('Abandoned Cart', 'سلة متروكة')}</option>
                  <option value="win_back">{L('Win Back', 'استعادة')}</option>
                  <option value="vip_reward">{L('VIP Reward', 'مكافأة VIP')}</option>
                </select>
              </div>
              <textarea
                value={templateBody}
                onChange={e => setTemplateBody(e.target.value)}
                placeholder={L('Template body...', 'نص القالب...')}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
                >
                  <Save size={12} /> {L('Save', 'حفظ')}
                </button>
                <button
                  onClick={() => { setShowTemplateForm(false); setEditingTemplate(null) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-text-secondary hover:bg-surface transition-all"
                >
                  <X size={12} /> {L('Cancel', 'إلغاء')}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(template => (
              <div key={template.id} className="p-4 rounded-xl bg-surface-elevated border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-text-primary">{template.title}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTemplate(template)
                        setTemplateTitle(template.title)
                        setTemplateChannel(template.channel_type)
                        setTemplateBody(template.body)
                        setTemplateCategory(template.category)
                        setShowTemplateForm(true)
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-accent transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{template.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-tertiary font-bold uppercase">
                    {template.channel_type}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent font-bold">
                    {template.category}
                  </span>
                </div>
              </div>
            ))}
            {templates.length === 0 && !showTemplateForm && (
              <p className="text-center py-8 text-text-tertiary text-sm col-span-2">
                {L('No templates created yet', 'لم يتم إنشاء قوالب بعد')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
