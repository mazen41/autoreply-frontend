'use client'

import React, { useState } from 'react'
import ChannelIcon from '../ui/ChannelIcon'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import {
  Sparkles,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Sliders,
  ShieldCheck,
} from 'lucide-react'

export interface ChannelInstance {
  id: number
  page_name?: string
  page_id?: string
  ai_enabled: boolean
  status?: 'active' | 'warning' | 'error' | 'syncing'
  status_message?: string
  last_activity?: string
}

export interface ChannelDef {
  id: string
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'email'
  brandColor: string
  badgeText?: string
}

export interface ChannelCardProps {
  channel: ChannelDef
  instances: ChannelInstance[]
  onConnect: () => void
  onToggleAI: (instanceId: number, currentStatus: boolean) => void
  onDisconnect: (instanceId: number) => void
  onManageSettings?: (instance: ChannelInstance) => void
}

export default function ChannelCard({
  channel,
  instances,
  onConnect,
  onToggleAI,
  onDisconnect,
  onManageSettings,
}: ChannelCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isConnected = instances.length > 0

  // Check if any instance requires attention
  const hasWarning = instances.some(
    (i) => i.status === 'warning' || i.status === 'error'
  )

  const displayedInstances = expanded ? instances : instances.slice(0, 2)
  const remainingCount = instances.length - 2

  return (
    <div
      className={`rounded-2xl border bg-surface-card transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md relative group ${
        hasWarning
          ? 'border-warning/40 hover:border-warning/70'
          : isConnected
          ? 'border-border hover:border-brand/40'
          : 'border-border/80 hover:border-border-hover'
      }`}
    >
      {/* Subtle top indicator bar */}
      {isConnected && (
        <div
          className="h-1 w-full shrink-0"
          style={{
            backgroundColor: hasWarning ? '#F59E0B' : channel.brandColor || '#3B82F6',
          }}
        />
      )}

      {/* ─── Card Header ─────────────────────────────────────────────────── */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center p-2.5 border shrink-0 bg-surface-elevated/70"
              style={{
                borderColor: isConnected
                  ? `color-mix(in srgb, ${channel.brandColor} 30%, var(--border))`
                  : 'var(--border)',
              }}
            >
              <ChannelIcon type={channel.id as any} size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  {channel.name}
                </h3>
                {channel.badgeText && (
                  <Badge variant="brand" size="xs">
                    {channel.badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                {channel.description}
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          {hasWarning ? (
            <Badge variant="warning" dot dotPulse size="sm">
              Needs Attention
            </Badge>
          ) : isConnected ? (
            <Badge variant="success" dot size="sm">
              Connected
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Available
            </Badge>
          )}
        </div>

        {/* ─── Status & Overview Strip ────────────────────────────────────── */}
        {isConnected && (
          <div className="flex items-center justify-between text-[11px] text-text-secondary px-3 py-1.5 rounded-lg bg-surface-elevated/50 border border-border/50 mb-3">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>
                {instances.length} {instances.length === 1 ? 'account' : 'accounts'}
              </span>
            </div>
            <span className="text-text-tertiary">
              {hasWarning ? '1 alert active' : 'All systems healthy'}
            </span>
          </div>
        )}

        {/* ─── Connected Accounts List ───────────────────────────────────── */}
        {isConnected && (
          <div className="space-y-2 mt-2">
            {displayedInstances.map((inst) => {
              const accountWarning =
                inst.status === 'warning' || inst.status === 'error'

              return (
                <div
                  key={inst.id}
                  className={`p-3 rounded-xl border transition-all ${
                    accountWarning
                      ? 'bg-warning/5 border-warning/30'
                      : 'bg-surface-elevated/70 border-border/70 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-text-primary truncate flex items-center gap-1.5">
                        <span>{inst.page_name || `Account #${inst.id}`}</span>
                        {accountWarning && (
                          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-text-tertiary truncate">
                        ID: {inst.page_id || inst.id}
                        {inst.status_message && ` • ${inst.status_message}`}
                      </div>
                    </div>

                    {/* AI Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleAI(inst.id, inst.ai_enabled)}
                      title={
                        inst.ai_enabled
                          ? 'AI Auto-Reply is active. Click to pause.'
                          : 'AI Auto-Reply is off. Click to activate.'
                      }
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wider uppercase inline-flex items-center gap-1.5 border transition-all ${
                        inst.ai_enabled
                          ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/15'
                          : 'bg-surface border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{inst.ai_enabled ? 'AI On' : 'AI Off'}</span>
                    </button>
                  </div>

                  {/* Actions Bar inside instance */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span className="text-[10px] text-text-tertiary">
                      {accountWarning ? (
                        <span className="text-warning font-medium">
                          Token re-auth required
                        </span>
                      ) : (
                        'Syncing in real-time'
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      {onManageSettings && (
                        <button
                          type="button"
                          onClick={() => onManageSettings(inst)}
                          className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors"
                          title="Account Settings"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDisconnect(inst.id)}
                        className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                        title="Disconnect account"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Expand / Collapse for multiple accounts */}
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full py-1.5 text-center text-xs font-semibold text-brand hover:underline flex items-center justify-center gap-1"
              >
                <span>
                  {expanded
                    ? 'Show fewer accounts'
                    : `+ ${remainingCount} more ${
                        remainingCount === 1 ? 'account' : 'accounts'
                      }`}
                </span>
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {/* ─── Disconnected State Preview ─────────────────────────────────── */}
        {!isConnected && (
          <div className="py-3 space-y-2">
            <div className="text-xs text-text-secondary leading-relaxed">
              Integrate {channel.name} to receive customer messages, automate replies, and track conversation metrics directly in your central inbox.
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success/80" />
              <span>Official API Partner • 2-minute setup</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Card Footer ─────────────────────────────────────────────────── */}
      <div className="p-4 bg-surface-elevated/40 border-t border-border/60 flex items-center gap-2">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onConnect}
            >
              + Add Account
            </Button>
            {hasWarning && (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={onConnect}
              >
                Fix Connection
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full text-xs"
            onClick={onConnect}
          >
            Connect {channel.name}
          </Button>
        )}
      </div>
    </div>
  )
}
