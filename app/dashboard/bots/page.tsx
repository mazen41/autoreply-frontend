'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import { PlusIcon, LightningIcon, TrashIcon, EditIcon } from '../../../components/ui/DashboardIcons'
import BotWizardModal from '../../../components/bots/BotWizardModal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function BotsPage() {
  const { t } = useLang()
  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardBot, setWizardBot] = useState<any | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchBots = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const res = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setBots(data.bots || [])
      }
    } catch (err) {
      console.error('Failed to fetch bots', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  const handleToggleStatus = async (bot: any) => {
    const newStatus = bot.status === 'active' ? 'inactive' : 'active'
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/bots/${bot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setToast({
          message: `Bot "${bot.name}" is now ${newStatus}`,
          type: 'success',
        })
        fetchBots()
      }
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to update Bot status', type: 'error' })
    }
  }

  const handleDelete = async (bot: any) => {
    if (!confirm(`Are you sure you want to delete Bot "${bot.name}"?`)) return
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/bots/${bot.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        setToast({ message: 'Bot deleted successfully', type: 'success' })
        fetchBots()
      }
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to delete Bot', type: 'error' })
    }
  }

  // Metrics
  const totalBots = bots.length
  const activeBots = bots.filter((b) => b.status === 'active').length
  const totalChannelsAssigned = new Set(
    bots.flatMap((b) => b.channels?.map((c: any) => c.id) || [])
  ).size
  const avgConfidence = bots.length
    ? Math.round(
        (bots.reduce((acc, b) => acc + (b.ai_confidence_threshold || 0.8), 0) /
          bots.length) *
          100
      )
    : 80

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AI Bots Management
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure multi-account AI Bots, assign specific channels, and scope knowledge sources.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardBot(null)
            setShowWizard(true)
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-accent text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
        >
          <PlusIcon size={14} />
          Create New Bot
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-2xl border flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Total Bots</div>
          <div className="text-2xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
            {totalBots}
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Active Bots</div>
          <div className="text-2xl font-black mt-2 text-emerald-500">{activeBots}</div>
        </div>

        <div
          className="p-4 rounded-2xl border flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Channels Covered</div>
          <div className="text-2xl font-black mt-2 text-accent">{totalChannelsAssigned}</div>
        </div>

        <div
          className="p-4 rounded-2xl border flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Avg. Confidence Threshold</div>
          <div className="text-2xl font-black mt-2 text-amber-500">{avgConfidence}%</div>
        </div>
      </div>

      {/* Bots Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bots.length === 0 ? (
        <div
          className="p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center space-y-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 rounded-2xl bg-accent/10 text-accent">
            <LightningIcon size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              No AI Bots Created Yet
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">
              Create your first multi-channel AI Bot to automate customer support across WhatsApp, Instagram, Facebook, and more.
            </p>
          </div>
          <button
            onClick={() => {
              setWizardBot(null)
              setShowWizard(true)
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 transition-all"
          >
            + Create First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bots.map((bot) => {
            const isActive = bot.status === 'active'
            const assignedChannels = bot.channels || []
            const knowledgeCount = bot.knowledgeAssignments?.length || 0

            return (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 flex flex-col justify-between border relative overflow-hidden group transition-all"
                style={{
                  background: 'var(--surface)',
                  borderColor: isActive ? 'color-mix(in srgb, var(--accent) 30%, var(--border))' : 'var(--border)',
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {bot.name}
                      </h3>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">
                        {bot.ai_provider} · {bot.ai_model}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(bot)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : 'bg-surface-elevated border-border text-text-tertiary'
                      }`}
                    >
                      {isActive ? '● Active' : '○ Paused'}
                    </button>
                  </div>

                  {/* System Prompt snippet */}
                  {bot.ai_instructions && (
                    <p className="text-xs text-text-secondary line-clamp-2 italic mb-4">
                      &quot;{bot.ai_instructions}&quot;
                    </p>
                  )}

                  {/* Connected Channels Badges */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Assigned Channels ({assignedChannels.length})
                    </div>
                    {assignedChannels.length === 0 ? (
                      <div className="text-[10px] text-text-tertiary italic">No channels bound yet</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedChannels.map((ch: any) => (
                          <span
                            key={ch.id}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border"
                            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                          >
                            <ChannelIcon type={ch.type as any} size={14} />
                            <span style={{ color: 'var(--text-primary)' }}>{ch.page_name || ch.type}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Knowledge Scope Stats */}
                  <div className="text-[10px] font-medium text-text-tertiary mb-4">
                    📚 Knowledge Sources: <strong className="text-accent">{knowledgeCount} files assigned</strong>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => {
                      setWizardBot(bot)
                      setShowWizard(true)
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <EditIcon size={12} />
                    Edit Configuration
                  </button>

                  <button
                    onClick={() => handleDelete(bot)}
                    className="p-2 rounded-xl text-xs font-bold border transition-all text-red-400 hover:bg-red-500/10"
                    style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Bot Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <BotWizardModal
            bot={wizardBot}
            onClose={() => setShowWizard(false)}
            onSaved={() => {
              setShowWizard(false)
              fetchBots()
              setToast({
                message: wizardBot ? 'Bot updated successfully' : 'New Bot created successfully',
                type: 'success',
              })
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-accent/15 border border-accent/25 text-accent shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
