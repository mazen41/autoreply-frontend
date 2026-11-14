'use client'

import React, { useMemo, useState } from 'react'
import { Sparkles, Search, FileText, Check, ExternalLink, Layers, ShieldCheck, Globe } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { KnowledgeFile, KnowledgeAssignment, ChannelRecord } from './types'

interface Step03KnowledgeProps {
  knowledgeFiles: KnowledgeFile[]
  loadingKnowledge: boolean
  assignments: KnowledgeAssignment[]
  setAssignments: React.Dispatch<React.SetStateAction<KnowledgeAssignment[]>>
  selectedChannels: ChannelRecord[]
}

export default function Step03Knowledge({
  knowledgeFiles,
  loadingKnowledge,
  assignments,
  setAssignments,
  selectedChannels,
}: Step03KnowledgeProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}
  const [query, setQuery] = useState('')

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return knowledgeFiles
    return knowledgeFiles.filter((f) => (f.filename || '').toLowerCase().includes(q))
  }, [knowledgeFiles, query])

  const activeCount = new Set(assignments.map((a) => a.file_id)).size

  const toggleFile = (fileId: number) => {
    const isAssigned = assignments.some((a) => a.file_id === fileId)
    if (isAssigned) {
      setAssignments((current) => current.filter((a) => a.file_id !== fileId))
    } else {
      setAssignments((current) => [...current, { file_id: fileId, channel_id: null }])
    }
  }

  const toggleChannelScope = (fileId: number, channelId: number) => {
    const exists = assignments.some((a) => a.file_id === fileId && a.channel_id === channelId)
    if (exists) {
      setAssignments((current) =>
        current.filter((a) => !(a.file_id === fileId && a.channel_id === channelId))
      )
    } else {
      setAssignments((current) => [...current, { file_id: fileId, channel_id: channelId }])
    }
  }

  const toggleSharedScope = (fileId: number) => {
    const hasShared = assignments.some((a) => a.file_id === fileId && a.channel_id === null)
    if (hasShared) {
      setAssignments((current) =>
        current.filter((a) => !(a.file_id === fileId && a.channel_id === null))
      )
    } else {
      setAssignments((current) => [...current, { file_id: fileId, channel_id: null }])
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 03 · قاعدة المعرفة' : 'Step 03 · Knowledge Base'}</span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {copy.step3Title || (isRTL ? 'زوّد مساعدك بالمعرفة التي يحتاجها' : 'Give your assistant the knowledge it needs')}
          </h1>
          <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-300">
            {copy.activeKnowledge
              ? copy.activeKnowledge.replace('{count}', String(activeCount))
              : `${activeCount} ${isRTL ? 'ملف نشط' : 'files active'}`}
          </span>
        </div>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step3Subtitle ||
            (isRTL
              ? 'حدد ملفات المعرفة والمستندات والسياسات التي يستند إليها الوكيل في ردوده لضمان إجابات دقيقة دون هلوسة.'
              : 'Select knowledge files and catalog resources the bot will reference for zero hallucinations.')}
        </p>
      </div>

      {/* Search Bar & Upload CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchKnowledge || (isRTL ? 'ابحث في ملفات المعرفة...' : 'Search knowledge files...')}
            className="w-full rounded-2xl border border-white/10 bg-surface-elevated/70 py-3 pe-4 ps-10 text-sm text-white placeholder:text-text-tertiary focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>
        <a
          href="/dashboard/ai-knowledge"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-xs font-bold text-text-secondary hover:border-white/30 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          <span>{isRTL ? 'إدارة المستندات والرفع' : 'Manage & Upload'}</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {loadingKnowledge ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl border border-white/5 bg-surface-elevated/40 animate-pulse" />
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface-elevated/20 p-8 text-center">
            <Layers size={32} className="mx-auto text-text-tertiary mb-3 opacity-60" />
            <p className="text-sm font-semibold text-text-secondary">
              {copy.noKnowledgeFound ||
                (isRTL
                  ? 'لا توجد ملفات معرفة مرفوعة حالياً. يمكنك رفع ملفات PDF أو Word أو نصوص من صفحة المعرفة.'
                  : 'No knowledge files uploaded yet. You can upload documents in AI Knowledge.')}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              {isRTL ? 'يمكنك المتابعة وسيقوم الوكيل بالاعتماد على التعليمات العامة والمحادثة.' : 'You can proceed; your bot will reply using general instructions.'}
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const fileAssignments = assignments.filter((a) => a.file_id === file.id)
            const isAssigned = fileAssignments.length > 0
            const isShared = fileAssignments.some((a) => a.channel_id === null)
            const assignedChannelIds = fileAssignments
              .map((a) => a.channel_id)
              .filter((id): id is number => id !== null)

            return (
              <div
                key={file.id}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  isAssigned
                    ? 'border-teal-500/50 bg-teal-500/10 shadow-lg shadow-teal-500/10'
                    : 'border-white/[0.08] bg-surface-elevated/40 hover:border-white/20 hover:bg-surface-elevated/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleFile(file.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5 ${
                        isAssigned
                          ? 'border-teal-400 bg-teal-500 text-black shadow-sm'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      {isAssigned && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-white">{file.filename}</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-text-tertiary">
                          {file.file_type || 'DOC'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-tertiary flex items-center gap-2">
                        <span>
                          {copy.chunksCount
                            ? copy.chunksCount.replace('{count}', String(file.chunks_count || 0))
                            : `${file.chunks_count || 0} ${isRTL ? 'مقطع' : 'chunks'}`}
                        </span>
                        <span>·</span>
                        <span className="text-teal-400 flex items-center gap-1">
                          <ShieldCheck size={12} />
                          {isRTL ? 'تمت الفهرسة بنجاح' : 'Indexed'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scoping options if file is assigned */}
                {isAssigned && selectedChannels.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-secondary">
                        {copy.sharedAllChannels || (isRTL ? 'متاح لجميع القنوات' : 'Available on all channels')}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSharedScope(file.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                          isShared
                            ? 'border-teal-400/40 bg-teal-400/20 text-teal-300'
                            : 'border-white/10 bg-white/5 text-text-tertiary hover:text-white'
                        }`}
                      >
                        {isShared ? (isRTL ? 'مشترك (افتراضي)' : 'Shared (Default)') : (isRTL ? 'تخصيص لقناة' : 'Scope to channel')}
                      </button>
                    </div>

                    {!isShared && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        {selectedChannels.map((channel) => {
                          const scoped = assignedChannelIds.includes(channel.id)
                          return (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => toggleChannelScope(file.id, channel.id)}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                                scoped
                                  ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                                  : 'border-white/10 bg-white/5 text-text-tertiary hover:text-white'
                              }`}
                            >
                              <span>{channel.page_name || channel.type}</span>
                              {scoped && <Check size={12} />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
