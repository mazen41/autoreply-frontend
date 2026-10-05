'use client'

import React from 'react'
import Input from './Input'
import Select, { SelectOption } from './Select'

export interface FilterTab {
  id: string
  label: string
  count?: number
}

export interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  tabs?: FilterTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  sortOptions?: SelectOption[]
  sortValue?: string
  onSortChange?: (value: string) => void
  viewMode?: 'grid' | 'table'
  onViewModeChange?: (mode: 'grid' | 'table') => void
  actions?: React.ReactNode
  className?: string
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  tabs,
  activeTab,
  onTabChange,
  sortOptions,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  actions,
  className = '',
}: FilterBarProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="w-full md:max-w-xs shrink-0">
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            onClear={() => onSearchChange('')}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Right side controls: sort, view mode, actions */}
        <div className="flex items-center gap-2.5 overflow-x-auto self-end md:self-center w-full md:w-auto justify-between md:justify-end">
          {sortOptions && onSortChange && (
            <div className="w-36 shrink-0">
              <Select
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value)}
                options={sortOptions}
              />
            </div>
          )}

          {viewMode && onViewModeChange && (
            <div className="inline-flex p-0.5 bg-surface-elevated border border-border rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-surface-overlay text-text-primary shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
                aria-label="Grid view"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-surface-overlay text-text-primary shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
                aria-label="Table view"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          )}

          {actions}
        </div>
      </div>

      {/* Filter Tabs / Categories */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 select-none ${
                  isActive
                    ? 'bg-brand/10 border-brand/25 text-brand font-semibold'
                    : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-brand/20 text-brand'
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
      )}
    </div>
  )
}
