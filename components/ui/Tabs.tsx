'use client'

import React from 'react'

export interface TabItem {
  id: string
  label: string
  count?: number | string
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'segmented' | 'underline' | 'pills'
  size?: 'sm' | 'md'
  className?: string
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  className = '',
}: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 bg-surface-elevated border border-border rounded-xl select-none ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-150 relative ${
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
              } ${
                isActive
                  ? 'bg-surface-overlay text-text-primary shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-brand-primary/15 text-brand-primary'
                      : 'bg-white/[0.06] text-text-tertiary'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary font-semibold'
                  : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-brand-primary/20 text-brand-primary'
                      : 'bg-surface text-text-tertiary'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Underline variant
  return (
    <div
      className={`flex items-center gap-6 border-b border-border/80 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 pb-2.5 text-xs font-medium border-b-2 transition-all relative shrink-0 ${
              isActive
                ? 'border-brand-primary text-text-primary font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-surface-elevated text-text-secondary border border-border">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
