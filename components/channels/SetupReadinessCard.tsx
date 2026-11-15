'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  ExternalLink,
  Mail,
  Loader2,
} from 'lucide-react'
import Button from '../ui/Button'
import Checkbox from '../ui/Checkbox'

export interface AiSetupChecklist {
  ready: boolean
  checks: Record<string, { passed: boolean; label: string }>
  missing: string[]
}

export interface SetupReadinessCardProps {
  aiSetup: AiSetupChecklist | null
  isRTL?: boolean
  goLiveSettings: { consent_policy_acknowledged: boolean; handoff_notification_email: string | null }
  setGoLiveSettings: React.Dispatch<React.SetStateAction<{ consent_policy_acknowledged: boolean; handoff_notification_email: string | null }>>
  onSaveGoLiveSettings: () => Promise<void>
  savingGoLiveSettings: boolean
  onRunTestReply: () => Promise<void>
  testReplyLoading: boolean
  testReply: string | null
}

export default function SetupReadinessCard({
  aiSetup,
  isRTL = false,
  goLiveSettings,
  setGoLiveSettings,
  onSaveGoLiveSettings,
  savingGoLiveSettings,
  onRunTestReply,
  testReplyLoading,
  testReply,
}: SetupReadinessCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (!aiSetup) return null

  const checks = Object.entries(aiSetup.checks)
  const passedCount = checks.filter(([, c]) => c.passed).length
  const totalCount = checks.length
  const isComplete = aiSetup.ready

  const goLiveCheckLabels: Record<string, { en: string; ar: string }> = {
    connected_channel: {
      en: 'Connect at least one communication channel',
      ar: 'اربط قناة تواصل واحدة على الأقل',
    },
    active_agent: {
      en: 'Create an active bot and assign it to a connected channel',
      ar: 'أنشئ وكيلاً نشطاً وعيّنه لقناة متصلة',
    },
    provider_configured: {
      en: 'Supported AI model provider configured by admin',
      ar: 'مزود الذكاء الاصطناعي مهيأ من الإدارة',
    },
    knowledge_or_instructions: {
      en: 'Add business knowledge base or AI instructions',
      ar: 'أضف قاعدة معرفة للنشاط أو تعليمات الذكاء الاصطناعي',
    },
    test_reply_generated: {
      en: 'Generate a successful test reply simulation',
      ar: 'إنشاء رد تجريبي ناجح من الوكيل',
    },
    consent_policy_acknowledged: {
      en: 'Acknowledge marketing consent & opt-out policy',
      ar: 'الإقرار بسياسة موافقة الرسائل وإلغاء الاشتراك',
    },
    handoff_recipient_configured: {
      en: 'Set an email for human team handoff notifications',
      ar: 'تحديد بريد إلكتروني لإشعارات التحويل إلى موظف',
    },
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="rounded-2xl border border-border/80 bg-surface-card p-5 transition-all shadow-xs"
    >
      {/* ── Compact Header Bar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isComplete
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-brand/30 bg-brand/10 text-brand'
            }`}
          >
            {isComplete ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">
                {isRTL ? 'جاهزية الذكاء الاصطناعي للإطلاق' : 'AI Omnichannel Go-Live Readiness'}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isComplete
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-brand/10 border border-brand/20 text-brand'
                }`}
              >
                {passedCount} / {totalCount} {isRTL ? 'مكتمل' : 'Complete'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {isComplete
                ? isRTL
                  ? 'جميع متطلبات التفعيل مكتملة. الوكلاء المعينون يمكنهم الرد على رسائل العملاء تلقائياً.'
                  : 'All setup requirements passed. Active bots on connected channels are ready to auto-reply.'
                : isRTL
                ? 'استكمل المتطلبات الأساسية أدناه لتشغيل الردود التلقائية لعملائك بأمان ودقة.'
                : 'Complete the essential requirements below to reliably activate automated responses.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunTestReply}
            disabled={testReplyLoading}
            icon={testReplyLoading ? <Loader2 size={13} className="animate-spin text-brand" /> : <Sparkles size={13} />}
          >
            {testReplyLoading
              ? isRTL ? 'جارٍ الاختبار...' : 'Testing…'
              : isRTL ? 'تجربة رد فوري' : 'Test AI Reply'}
          </Button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand/40 transition-colors"
          >
            <span>{expanded ? (isRTL ? 'طي التفاصيل' : 'Hide details') : isRTL ? 'عرض المتطلبات' : 'Show details'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Test Reply Preview Result if generated ────────────────── */}
      {testReply && (
        <div className="mt-3.5 rounded-xl border border-brand/20 bg-brand/[0.04] p-3 text-xs text-text-secondary flex items-start gap-2.5">
          <Sparkles size={14} className="text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-brand block mb-0.5">{isRTL ? 'استجابة تجريبية ناجحة:' : 'Live Test Response:'}</span>
            <p className="text-text-primary leading-relaxed">{testReply}</p>
          </div>
        </div>
      )}

      {/* ── Expanded Requirements Checklist & Form ────────────────── */}
      {expanded && (
        <div className="mt-5 space-y-4 pt-4 border-t border-border/60">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {checks.map(([key, check]) => {
              const meta = goLiveCheckLabels[key] || { en: check.label, ar: check.label }
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
                    check.passed
                      ? 'border-emerald-500/20 bg-emerald-500/[0.03] text-text-primary'
                      : 'border-amber-500/25 bg-amber-500/[0.03] text-text-secondary'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">{isRTL ? meta.ar : meta.en}</span>
                </div>
              )
            })}
          </div>

          {/* Policy Acknowledgement & Human Handoff Email */}
          <div className="rounded-xl border border-border/80 bg-surface p-4 grid gap-4 md:grid-cols-2">
            <Checkbox
              checked={goLiveSettings.consent_policy_acknowledged}
              onChange={(checked) =>
                setGoLiveSettings({ ...goLiveSettings, consent_policy_acknowledged: checked })
              }
              label={
                <span className="text-xs text-text-secondary">
                  {isRTL
                    ? 'أقرّ بأن الرسائل التسويقية تتطلب موافقة مسبقة من العملاء، وأن طلبات الإلغاء ستُحترم فوراً وفق '
                    : 'I acknowledge that marketing messages require prior consent and opt-out requests are honored under '}
                  <Link href="/privacy" className="text-brand font-semibold hover:underline">
                    {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </Link>
                </span>
              }
            />

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-text-secondary block">
                {isRTL ? 'بريد إشعارات التحويل إلى موظف بشري' : 'Human Handoff Notification Email'}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={goLiveSettings.handoff_notification_email || ''}
                  onChange={(e) =>
                    setGoLiveSettings({ ...goLiveSettings, handoff_notification_email: e.target.value })
                  }
                  placeholder="support@yourcompany.com"
                  className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveGoLiveSettings}
                  disabled={savingGoLiveSettings}
                >
                  {savingGoLiveSettings
                    ? isRTL ? 'جارٍ...' : 'Saving…'
                    : isRTL ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
