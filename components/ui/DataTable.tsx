'use client'

import React from 'react'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (row: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div
      className={`w-full overflow-hidden border border-border rounded-xl bg-surface-card shadow-xs ${className}`}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-surface-elevated/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3 font-semibold text-text-secondary select-none tracking-wider uppercase text-[10px] ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  {emptyState || (
                    <span className="text-text-tertiary">No data available</span>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'hover:bg-surface-elevated/70 cursor-pointer active:bg-surface-overlay'
                      : 'hover:bg-surface-elevated/40'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-text-primary ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(row, index)
                        : (row as any)[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
