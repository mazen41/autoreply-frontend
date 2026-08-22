'use client'

import React, { memo } from 'react'
import { Inbox, Users, AlertCircle, Clock, Tag, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react'

interface InboxNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
  unreadCounts?: Record<string, number>
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
}

const InboxNavigation = memo(function InboxNavigation({ 
  currentView, 
  onViewChange, 
  unreadCounts = {} 
}: InboxNavigationProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    main: true,
    channels: false,
    views: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const mainNavItems: NavItem[] = [
    { id: 'all', label: 'All Conversations', icon: <Inbox size={16} />, count: unreadCounts.all },
    { id: 'unassigned', label: 'Unassigned', icon: <Users size={16} />, count: unreadCounts.unassigned },
    { id: 'open', label: 'Open', icon: <AlertCircle size={16} />, count: unreadCounts.open },
    { id: 'priority', label: 'Priority', icon: <TrendingUp size={16} />, count: unreadCounts.priority },
    { id: 'escalations', label: 'AI Escalations', icon: <Zap size={16} />, count: unreadCounts.escalations },
  ]

  const viewNavItems: NavItem[] = [
    { id: 'mentions', label: 'Mentions', icon: <Tag size={16} />, count: unreadCounts.mentions },
    { id: 'snoozed', label: 'Snoozed', icon: <Clock size={16} />, count: unreadCounts.snoozed },
  ]

  const NavSection = ({ 
    title, 
    items, 
    sectionKey 
  }: { 
    title: string; 
    items: NavItem[]; 
    sectionKey: string 
  }) => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left px-3 py-2 hover:bg-white/[0.02] rounded-lg transition-all duration-150"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">{title}</span>
        {expandedSections[sectionKey] ? <ChevronUp size={12} className="text-text-secondary" /> : <ChevronDown size={12} className="text-text-secondary" />}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="mt-1 space-y-0.5">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${
                currentView === item.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-white/[0.02] hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="w-64 border-r border-white/[0.05] bg-[#14151D]/60 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04]">
        <h2 className="text-sm font-bold text-white tracking-tight">Inbox</h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <NavSection title="Main" items={mainNavItems} sectionKey="main" />
        <NavSection title="Views" items={viewNavItems} sectionKey="views" />
      </div>
    </div>
  )
})

export default InboxNavigation