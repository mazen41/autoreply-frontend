'use client'

import React, { useState, useCallback } from 'react'
import { X, User, Mail, Phone, Tag, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react'

interface CustomerPanelProps {
  conversation: {
    id: number
    sender_id: string
    sender_name: string | null
    sender_email: string | null
    subject: string | null
    status: string
    channel: { type: string; page_name: string | null }
    assigned_agent_id?: number | null
    assigned_at?: string | null
    created_at?: string | null
  } | null
  tags?: Array<{ id: number; tag: string }>
  onRemoveTag?: (tagId: number) => void
  onAddTag?: (tag: string) => void
  onClose?: () => void
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const CustomerPanel = ({ 
  conversation, 
  tags, 
  onRemoveTag, 
  onAddTag,
  onClose 
}: CustomerPanelProps) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    profile: false,
    contact: false,
    conversation: false,
    tags: false
  })
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && onAddTag) {
      onAddTag(newTag.trim())
      setNewTag('')
      setShowTagInput(false)
    }
  }, [newTag, onAddTag])

  if (!conversation) return null

  return (
    <div className="w-80 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--divider)] flex items-center justify-between bg-[var(--surface-elevated)]">
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Customer Details</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Profile Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('profile')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Profile</span>
            {collapsedSections.profile ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {!collapsedSections.profile && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-[#8B3FFB] flex items-center justify-center text-white font-bold text-sm">
                  {conversation.sender_name?.[0]?.toUpperCase() || conversation.sender_id[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {conversation.sender_name || 'Unknown'}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] truncate">
                    {conversation.sender_id}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-[var(--divider)]">
                {conversation.created_at && (
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <Clock size={12} />
                    <span>Joined {formatTimestamp(conversation.created_at)}</span>
                  </div>
                )}
                {conversation.assigned_agent_id && (
                  <div className="flex items-center gap-2 text-[10px] text-accent">
                    <User size={12} />
                    <span>Assigned to agent</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('contact')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Contact</span>
            {collapsedSections.contact ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {!collapsedSections.contact && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
              {conversation.sender_email && (
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  <Mail size={12} />
                  <span className="truncate">{conversation.sender_email}</span>
                </div>
              )}
              {conversation.sender_name && (
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  <User size={12} />
                  <span>{conversation.sender_name}</span>
                </div>
              )}
              {!conversation.sender_email && !conversation.sender_name && (
                <div className="text-[10px] text-[var(--text-tertiary)] italic">No contact information</div>
              )}
            </div>
          )}
        </div>

        {/* Conversation Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('conversation')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Conversation</span>
            {collapsedSections.conversation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {!collapsedSections.conversation && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Status</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  conversation.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' :
                  conversation.status === 'closed' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {conversation.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Channel</span>
                <span className="text-[10px] text-[var(--text-primary)] capitalize">{conversation.channel.type}</span>
              </div>

              {conversation.subject && (
                <div className="pt-2 border-t border-[var(--divider)]">
                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">Subject</div>
                  <div className="text-xs text-[var(--text-primary)] truncate">{conversation.subject}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Tags</span>
            {collapsedSections.tags ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {!collapsedSections.tags && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
              {showTagInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-accent/40"
                    onKeyPress={e => { if (e.key === 'Enter') handleAddTag() }}
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-[10px] font-bold hover:brightness-110"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowTagInput(false); setNewTag('') }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] font-bold hover:bg-[var(--surface-elevated)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="w-full py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--text-secondary)] hover:border-accent/30 hover:text-accent transition-all duration-150"
                >
                  + Add Tag
                </button>
              )}
              
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 text-[10px]">
                      <Tag size={10} />
                      <span>{tag.tag}</span>
                      {onRemoveTag && (
                        <button
                          onClick={() => onRemoveTag(tag.id)}
                          className="hover:text-red-400"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {(!tags || tags.length === 0) && !showTagInput && (
                <div className="text-[10px] text-[var(--text-tertiary)] italic">No tags assigned</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerPanel