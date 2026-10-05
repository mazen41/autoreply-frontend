'use client'

import React from 'react'
import { TableRowSkeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (row: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  selected?: boolean
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  selectedKeys?: Set<string | number>
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  selectedKeys,
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
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary select-none ${
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
                <TableRowSkeleton key={i} cols={columns.length} />
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
              data.map((row, index) => {
                const rowKey = keyExtractor(row, index)
                const isSelected = selectedKeys?.has(rowKey)
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`stagger-item hover:bg-surface-hover transition-colors duration-100 ${
                      isSelected
                        ? 'bg-brand/5 border-l-2 border-l-brand'
                        : ''
                    } ${
                      onRowClick
                        ? 'cursor-pointer active:bg-surface-overlay'
                        : ''
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
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
