'use client'

import React from 'react'
import {
  MessageSquare,
  CheckCheck,
  AlertCircle,
  Clock,
  Search,
  Camera,
  Globe2,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Hash,
  Activity,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import { Select } from '../../../components/ui/Select'
import { CommentEvent } from './types'

interface CommentsInboxProps {
  comments: CommentEvent[]
  selectedId: number | null
  setSelectedId: (id: number | null) => void
  stats: {
    total: number
    replied: number
    skipped: number
    cancelled: number
    failed: number
    retryable: number
    pending: number
    needs_attention: number
  }
  platform: string
  setPlatform: (p: string) => void
  status: string
  setStatus: (s: string) => void
  search: string
  setSearch: (s: string) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  lastPage: number
  loading: boolean
  isRTL: boolean
}

function formatDate(value: string | null | undefined, isRTL: boolean) {
  if (!value) return isRTL ? 'غير متوفر' : 'Unavailable'
  try {
    return new Intl.DateTimeFormat(isRTL ? 'ar' : undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

function statusInfo(status: string, isRTL: boolean) {
  const map: Record<string, { labelEn: string; labelAr: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    processed: { labelEn: 'Replied', labelAr: 'تم الرد', variant: 'success' },
    received: { labelEn: 'Received', labelAr: 'مستلم', variant: 'warning' },
    processing: { labelEn: 'Processing', labelAr: 'قيد المعالجة', variant: 'warning' },
    scheduled: { labelEn: 'Scheduled', labelAr: 'مجدول', variant: 'warning' },
    cancelled: { labelEn: 'Cancelled', labelAr: 'أُلغي', variant: 'neutral' },
    skipped: { labelEn: 'Skipped', labelAr: 'تم التخطي', variant: 'neutral' },
    failed: { labelEn: 'Failed', labelAr: 'فشل', variant: 'error' },
    retryable: { labelEn: 'Retry pending', labelAr: 'قيد الإعادة', variant: 'warning' },
  }
  const current = map[status] || { labelEn: status, labelAr: status, variant: 'neutral' }
  return {
    label: isRTL ? current.labelAr : current.labelEn,
    variant: current.variant,
  }
}

function failureReasonFriendly(code: string | null | undefined, isRTL: boolean) {
  if (!code) return isRTL ? 'لم يتم الرد بعد' : 'No reply recorded yet'
  const reasons: Record<string, [string, string]> = {
    self_comment: ['Comment is from page itself', 'التعليق من الصفحة نفسها'],
    self_or_generic_comment: ['Self or generic comment', 'تعليق من الصفحة أو عام'],
    generic_comment: ['Generic comment or noise filtered', 'تعليق عام أو غير هادف تم تخطيه'],
    no_unambiguous_active_bot: ['No agent assigned to channel', 'لا يوجد وكيل ذكي مفعّل لهذا الحساب'],
    automation_disabled: ['Comment automation disabled', 'أتمتة التعليقات معطّلة لهذا الحساب'],
    no_matching_rule: ['No matching rule triggered', 'لم تتطابق أي قاعدة تفعيل مخصصة'],
    public_reply_disabled: ['Public replies disabled', 'الردود العامة معطّلة في الإعدادات'],
    account_mismatch: ['Social channel mismatch', 'الحساب الاجتماعي غير متطابق'],
    unsupported_or_empty_event: ['Empty or unsupported event', 'حدث تعليق فارغ أو غير مدعوم'],
    account_disconnected_or_mismatched: ['Account disconnected or token expired', 'الحساب مفصول أو انتهت صلاحية الربط'],
    comment_deleted: ['Original comment was deleted on Facebook/Instagram', 'تم حذف التعليق الأصلي من المنصة'],
    rule_disabled: ['Rule or automation is disabled', 'القاعدة أو الأتمتة معطّلة'],
    excluded_keyword: ['Blocked by excluded keyword', 'تم المنع بسبب كلمة مستثناة'],
  }
  const match = reasons[code]
  if (match) return isRTL ? match[1] : match[0]
  return code
}

export default function CommentsInbox({
  comments,
  selectedId,
  setSelectedId,
  stats,
  platform,
  setPlatform,
  status,
  setStatus,
  search,
  setSearch,
  page,
  setPage,
  lastPage,
  loading,
  isRTL,
}: CommentsInboxProps) {
  const selected = comments.find((c) => c.id === selectedId) || null

  const statusFilters = [
    { id: 'all', label: isRTL ? 'الكل' : 'All', count: stats.total },
    { id: 'needs_attention', label: isRTL ? 'تحتاج متابعة' : 'Needs attention', count: stats.needs_attention },
    { id: 'replied', label: isRTL ? 'تم الرد' : 'Replied', count: stats.replied },
    { id: 'skipped', label: isRTL ? 'تم التخطي' : 'Skipped', count: stats.skipped },
    { id: 'failed', label: isRTL ? 'فشلت' : 'Failed', count: stats.failed },
  ]

  return (
    <div className="space-y-5">
      {/* 1. Compact Summary Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">
              {isRTL ? 'إجمالي التعليقات' : 'Total Comments'}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {stats.total.toLocaleString()}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MessageSquare size={18} />
          </div>
        </div>

        {/* Replied */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">
              {isRTL ? 'تم الرد علناً' : 'Replied'}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {stats.replied.toLocaleString()}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCheck size={18} />
          </div>
        </div>

        {/* Needs attention */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">
              {isRTL ? 'تحتاج متابعة' : 'Needs Attention'}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {stats.needs_attention.toLocaleString()}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">
              {isRTL ? 'قيد المعالجة' : 'Pending'}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {stats.pending.toLocaleString()}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-text-tertiary">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* 2. Main Inbox Master-Detail Container */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-border p-3.5 md:p-4 lg:flex-row lg:items-center justify-between bg-surface">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute top-1/2 -translate-y-1/2 text-text-tertiary ltr:left-3 rtl:right-3 pointer-events-none"
            />
            <input
              type="text"
              aria-label={isRTL ? 'بحث في التعليقات' : 'Search comments'}
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder={isRTL ? 'ابحث في نصوص التعليقات...' : 'Search comment text or author ID...'}
              className="h-9 w-full rounded-xl border border-border bg-surface-elevated/40 text-xs text-text-primary outline-none transition focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-1">
              {statusFilters.map((f) => {
                const active = status === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setPage(1)
                      setStatus(f.id)
                    }}
                    className={`h-8 px-2.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      active
                        ? 'bg-brand/10 text-brand border border-brand/25 font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && f.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          active ? 'bg-brand/20 text-brand' : 'bg-surface-elevated text-text-tertiary'
                        }`}
                      >
                        {f.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Platform dropdown */}
            <div className="w-36 shrink-0">
              <Select
                dir={isRTL ? 'rtl' : 'ltr'}
                ariaLabel={isRTL ? 'تصفية حسب المنصة' : 'Filter by platform'}
                size="sm"
                value={platform}
                onChange={(e) => {
                  setPage(1)
                  setPlatform(e.target.value)
                }}
                options={[
                  { value: 'all', label: isRTL ? 'جميع المنصات' : 'All Platforms' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'instagram', label: 'Instagram' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Two-Pane Inbox View */}
        <div className="grid min-h-[580px] lg:grid-cols-[minmax(330px,0.9fr)_minmax(0,1.1fr)]">
          {/* Left Pane: Comment List */}
          <div className="max-h-[68vh] overflow-y-auto border-b border-border lg:border-b-0 lg:border-e divide-y divide-border/60">
            {loading && comments.length === 0 ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-surface-elevated/60 animate-pulse" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="py-20 text-center px-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-text-tertiary">
                  <MessageSquare size={20} />
                </div>
                <p className="font-semibold text-sm text-text-primary">
                  {isRTL ? 'لا توجد تعليقات مطابقة' : 'No comments found'}
                </p>
                <p className="mt-1 text-xs text-text-secondary max-w-xs mx-auto">
                  {isRTL
                    ? 'ستظهر التعليقات الواردة من حسابات فيسبوك وإنستغرام المتصلة هنا فور وصولها.'
                    : 'Incoming comments from connected Facebook and Instagram pages will appear here.'}
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isSelected = selectedId === comment.id
                const st = statusInfo(comment.status, isRTL)
                return (
                  <button
                    key={comment.id}
                    type="button"
                    onClick={() => setSelectedId(comment.id)}
                    className={`block w-full text-start p-4 transition relative ${
                      isSelected
                        ? 'bg-brand/5 ltr:border-l-2 rtl:border-r-2 border-brand'
                        : 'hover:bg-surface-elevated/40'
                    }`}
                  >
                    {/* Header: Platform + Page + Status */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {comment.platform === 'instagram' ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-pink-500/10 text-pink-500">
                          <Camera size={12} />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-500">
                          <Globe2 size={12} />
                        </span>
                      )}

                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-text-primary">
                        {comment.channel?.page_name || comment.channel?.page_id || (isRTL ? 'صفحة متصلة' : 'Connected page')}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          st.variant === 'success'
                            ? 'bg-success/15 text-success'
                            : st.variant === 'error'
                              ? 'bg-error/15 text-error'
                              : 'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {st.variant === 'success' && <Check size={10} />}
                        {st.label}
                      </span>
                    </div>

                    {/* Comment text snippet */}
                    <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary mb-2">
                      {comment.comment_text || (isRTL ? 'تعليق بدون نص' : 'Empty comment text')}
                    </p>

                    {/* Metadata footer */}
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                      <span className="truncate max-w-[160px]">
                        {comment.bot?.name ? (
                          <span className="text-text-secondary font-medium">
                            {comment.bot.name}
                          </span>
                        ) : (
                          <span className="opacity-75">{isRTL ? 'لم يُعيّن وكيل' : 'No agent'}</span>
                        )}
                      </span>
                      <span className="shrink-0">
                        {formatDate(comment.platform_created_at || comment.created_at, isRTL)}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Pane: Selected Comment Detail */}
          <div className="p-5 md:p-6 overflow-y-auto">
            {selected ? (
              <div className="space-y-6">
                {/* Header: Platform, Page, Status, Timestamp */}
                <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {selected.platform === 'instagram' ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
                        <Camera size={15} />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Globe2 size={15} />
                      </span>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary leading-tight">
                        {selected.channel?.page_name || selected.channel?.page_id || 'Connected Page'}
                      </h3>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {selected.platform === 'instagram' ? 'Instagram' : 'Facebook'} ·{' '}
                        {formatDate(selected.platform_created_at || selected.created_at, isRTL)}
                      </p>
                    </div>
                  </div>

                  <div>
                    {(() => {
                      const st = statusInfo(selected.status, isRTL)
                      return (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                            st.variant === 'success'
                              ? 'bg-success/15 text-success'
                              : st.variant === 'error'
                                ? 'bg-error/15 text-error'
                                : 'bg-surface-elevated text-text-secondary'
                          }`}
                        >
                          {st.variant === 'success' && <Check size={12} />}
                          {st.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {/* Section 1: Customer's incoming comment */}
                <div className="rounded-xl border border-border bg-surface-elevated/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      {isRTL ? 'التعليق الوارد' : 'Incoming Comment'}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      {selected.commenter_id && (
                        <span className="flex items-center gap-1" title={isRTL ? 'معرّف المعلق' : 'Author ID'}>
                          <User size={12} /> {selected.commenter_id}
                        </span>
                      )}
                      {selected.post_id && (
                        <span className="flex items-center gap-1" title={isRTL ? 'معرّف المنشور' : 'Post ID'}>
                          <Hash size={12} /> {selected.post_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
                    {selected.comment_text || (isRTL ? 'تعليق بدون نص' : 'Empty comment text')}
                  </p>
                </div>

                {/* Section 2: Public Reply */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    {isRTL ? 'الرد العام المرسل' : 'Public Reply'}
                  </h4>

                  {selected.reply?.content ? (
                    <div className="rounded-xl border border-success/25 bg-success/5 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-success">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCheck size={14} />
                          {isRTL ? 'تم الإرسال على المنشور بنجاح' : 'Published to post'}
                        </span>
                        <span className="text-[11px] opacity-75">
                          {formatDate(selected.reply.created_at, isRTL)}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                        {selected.reply.content}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-surface-elevated/20 p-4 text-xs text-text-secondary flex items-start gap-3">
                      <HelpCircle size={16} className="text-text-tertiary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-text-primary">
                          {failureReasonFriendly(selected.failure_reason || selected.failure_code, isRTL)}
                        </p>
                        <p className="mt-1 text-[11px] text-text-tertiary">
                          {isRTL
                            ? 'لم يتم إرسال رد عام لهذا التعليق وفقاً لإعدادات الأتمتة وشروط القواعد.'
                            : 'No public reply was dispatched for this comment based on rule evaluation and automation settings.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Automation Decision Timeline */}
                {selected.decision_trace && (
                  <div className="rounded-xl border border-border bg-surface-elevated/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                      <Activity size={14} className="text-brand" />
                      {isRTL ? 'سجل قرار الأتمتة' : 'Automation Decision Trace'}
                    </div>

                    <div className="grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
                      <div>
                        <span className="text-text-tertiary block text-[11px]">
                          {isRTL ? 'القاعدة المتطابقة' : 'Matched Rule'}
                        </span>
                        <span className="font-medium text-text-primary">
                          {selected.decision_trace.rule?.name || (isRTL ? 'لا توجد' : 'None')}
                        </span>
                      </div>

                      <div>
                        <span className="text-text-tertiary block text-[11px]">
                          {isRTL ? 'الإجراء المقرر' : 'Decided Action'}
                        </span>
                        <span className="font-mono text-xs">
                          {selected.decision_trace.permitted_actions?.join(', ') || 'none'}
                        </span>
                      </div>

                      {selected.decision_trace.matched_keywords && selected.decision_trace.matched_keywords.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="text-text-tertiary block text-[11px] mb-1">
                            {isRTL ? 'الكلمات التي طابقت القاعدة' : 'Matched Keywords'}
                          </span>
                          <div className="flex gap-1.5 flex-wrap">
                            {selected.decision_trace.matched_keywords.map((kw, i) => (
                              <span key={i} className="rounded bg-brand/10 border border-brand/20 text-brand px-1.5 py-0.2 text-[11px] font-mono">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selected.decision_trace.public_reply && (
                        <div className="sm:col-span-2 text-[11px] text-text-muted border-t border-border/60 pt-2 mt-1">
                          {isRTL ? 'حالة إرسال الرد:' : 'Public Dispatch:'}{' '}
                          <span className="font-mono text-text-secondary">{selected.decision_trace.public_reply.status}</span>
                          {selected.decision_trace.public_reply.reply_id && (
                            <span className="ms-2 opacity-75">(ID: {selected.decision_trace.public_reply.reply_id})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-text-tertiary">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">
                  {isRTL ? 'اختر تعليقاً من القائمة لمراجعة تفاصيله' : 'Select a comment from the list to review details'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-tertiary bg-surface">
          <span>
            {isRTL ? `الصفحة ${page} من ${lastPage}` : `Page ${page} of ${lastPage}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-elevated disabled:opacity-40 transition flex items-center gap-1"
            >
              {isRTL ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
              {isRTL ? 'السابق' : 'Previous'}
            </button>
            <button
              type="button"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-elevated disabled:opacity-40 transition flex items-center gap-1"
            >
              {isRTL ? 'التالي' : 'Next'}
              {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
