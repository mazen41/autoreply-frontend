'use client'

import React from 'react'
import {
  FlaskConical,
  Play,
  Save,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/Radio'
import { BotOption, RuleChannel, Scenario, SimulationResult, SuiteResult } from './types'

interface CommentTestCenterProps {
  bots: BotOption[]
  selectedBotId: string
  setSelectedBotId: (id: string) => void
  ruleChannels: RuleChannel[]
  selectedChannelId: string
  setSelectedChannelId: (id: string) => void
  scenarios: Scenario[]
  scenarioName: string
  setScenarioName: (name: string) => void
  scenarioText: string
  setScenarioText: (text: string) => void
  scenarioPostId: string
  setScenarioPostId: (id: string) => void
  expectedMatch: string
  setExpectedMatch: (val: string) => void
  expectedAction: string
  setExpectedAction: (val: string) => void
  simulation: SimulationResult | null
  suite: SuiteResult | null
  testBusy: boolean
  testError: string
  testNotice: string
  runSimulation: () => Promise<void>
  saveScenario: () => Promise<void>
  runSuite: () => Promise<void>
  deleteScenario: (id: number) => Promise<void>
  isRTL: boolean
}

export default function CommentTestCenter({
  bots,
  selectedBotId,
  setSelectedBotId,
  ruleChannels,
  selectedChannelId,
  setSelectedChannelId,
  scenarios,
  scenarioName,
  setScenarioName,
  scenarioText,
  setScenarioText,
  scenarioPostId,
  setScenarioPostId,
  expectedMatch,
  setExpectedMatch,
  expectedAction,
  setExpectedAction,
  simulation,
  suite,
  testBusy,
  testError,
  testNotice,
  runSimulation,
  saveScenario,
  runSuite,
  deleteScenario,
  isRTL,
}: CommentTestCenterProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success mb-2">
              <FlaskConical size={13} />
              {isRTL ? 'بيئة آمنة · لا يتم إرسال أي تعليق فعلي' : 'Dry run sandbox · No live sends'}
            </div>
            <h2 className="text-base font-semibold text-text-primary">
              {isRTL ? 'مركز اختبار موثوقية الأتمتة' : 'Automation Test Center'}
            </h2>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed max-w-2xl">
              {isRTL
                ? 'جرّب مطابقة القواعد بسيناريوهات تجريبية للتأكد من دقة الردود التلقائية والكلمات المفتاحية قبل تشغيلها للعملاء.'
                : 'Simulate comment rules with synthetic input to verify keyword matching, delay, and public replies without touching production accounts.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 shrink-0 md:min-w-[380px]">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                {isRTL ? 'الوكيل' : 'Bot'}
              </label>
              <Select
                value={selectedBotId}
                disabled={bots.length === 0}
                onChange={(e) => setSelectedBotId(e.target.value)}
                options={bots.map((b) => ({
                  value: String(b.id),
                  label: `${b.name}${b.status !== 'active' ? ` (${b.status})` : ''}`,
                }))}
                placeholder={isRTL ? 'اختر وكيلاً' : 'Select bot'}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                {isRTL ? 'الحساب' : 'Account'}
              </label>
              <Select
                value={selectedChannelId}
                disabled={ruleChannels.length === 0}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                options={ruleChannels.map((c) => ({
                  value: String(c.id),
                  label: `${c.name || c.type} (${c.type})`,
                }))}
                placeholder={isRTL ? 'اختر حساباً' : 'Select account'}
              />
            </div>
          </div>
        </div>

        {testError && (
          <div role="alert" className="mt-4 rounded-xl border border-error/30 bg-error/5 p-3 text-xs text-error">
            {testError}
          </div>
        )}
        {testNotice && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{testNotice}</span>
          </div>
        )}
      </div>

      {/* Main 2-column Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Left Column: Simulation Input & Save Scenario */}
        <div className="space-y-6">
          {/* Card: Simulate Comment */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Play size={15} className="text-brand" />
                {isRTL ? 'محاكاة تعليق تجريبي' : 'Simulate a Comment'}
              </h3>
              <span className="text-[11px] text-text-tertiary">
                {isRTL ? 'اختبار فردي' : 'Single test'}
              </span>
            </div>

            <div>
              <label htmlFor="synthetic-comment" className="block text-xs font-medium text-text-secondary mb-1.5">
                {isRTL ? 'تعليق تجريبي' : 'Synthetic comment'}
              </label>
              <textarea
                id="synthetic-comment"
                aria-label={isRTL ? 'تعليق تجريبي' : 'Synthetic comment'}
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder={
                  isRTL
                    ? 'اكتب نص تعليق كما لو كان من عميل (مثال: بكم السعر؟ أو Hi)'
                    : 'Enter synthetic comment text (e.g. What is the price? or Hi)'
                }
                className="w-full rounded-xl border border-border bg-surface-elevated/40 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="target-post-id" className="block text-xs font-medium text-text-secondary mb-1.5">
                {isRTL ? 'معرّف المنشور (اختياري)' : 'Target Post ID (optional)'}
              </label>
              <input
                id="target-post-id"
                type="text"
                value={scenarioPostId}
                onChange={(e) => setScenarioPostId(e.target.value)}
                maxLength={160}
                placeholder={isRTL ? 'اتركه فارغاً إلا إذا كان لقاعدة مخصصة لمنشور معين' : 'Leave empty unless targeting a specific post rule'}
                className="w-full h-10 rounded-xl border border-border bg-surface-elevated/40 px-3 text-sm text-text-primary outline-none transition focus:border-brand"
              />
            </div>

            <Button
              variant="primary"
              onClick={() => void runSimulation()}
              loading={testBusy}
              disabled={!selectedChannelId || !scenarioText.trim() || testBusy}
              className="w-full"
            >
              <Play size={14} className="me-1.5" />
              {isRTL ? 'محاكاة القاعدة' : 'Simulate rule'}
            </Button>
          </div>

          {/* Card: Save as Regression Scenario */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Save size={15} className="text-accent" />
              {isRTL ? 'حفظ كسيناريو اختبار دائم' : 'Save as Test Scenario'}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {isRTL
                ? 'احفظ هذا التعليق مع النتيجة المتوقعة لتشغيله دورياً والتأكد من عدم تراجع الأداء أو تعطل القواعد.'
                : 'Save this input alongside its expected outcome into your automated regression suite.'}
            </p>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {isRTL ? 'اسم السيناريو' : 'Scenario Name'}
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                maxLength={120}
                placeholder={isRTL ? 'مثال: التأكد من مطابقة كلمة السعر' : 'e.g. Ensure price query triggers public reply'}
                className="w-full h-10 rounded-xl border border-border bg-surface-elevated/40 px-3 text-sm text-text-primary outline-none transition focus:border-brand"
              />
            </div>

            <div className="pt-1">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                {isRTL ? 'المطابقة المتوقعة' : 'Expected Match'}
              </label>
              <RadioGroup
                orientation="horizontal"
                value={expectedMatch}
                onChange={setExpectedMatch}
                options={[
                  { value: 'matched', label: isRTL ? 'متوقع أن يطابق قاعدة' : 'Expected match' },
                  { value: 'not_matched', label: isRTL ? 'متوقع عدم التطابق' : 'Expected no match' },
                ]}
              />
            </div>

            {expectedMatch === 'matched' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {isRTL ? 'الإجراء المتوقع' : 'Expected Action'}
                </label>
                <Select
                  value={expectedAction}
                  onChange={(e) => setExpectedAction(e.target.value)}
                  options={[
                    { value: 'public', label: isRTL ? 'رد عام (Public reply)' : 'Public reply' },
                    { value: 'none', label: isRTL ? 'لا إجراء (None)' : 'No permitted action' },
                  ]}
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => void saveScenario()}
              loading={testBusy}
              disabled={!selectedChannelId || !scenarioName.trim() || !scenarioText.trim() || testBusy}
              className="w-full"
            >
              <Save size={13} className="me-1.5" />
              {isRTL ? 'حفظ في مجموعة الاختبارات' : 'Save Scenario'}
            </Button>
          </div>
        </div>

        {/* Right Column: Simulation Result & Regression Suite */}
        <div className="space-y-6">
          {/* Simulation Result Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'نتيجة المحاكاة الفورية' : 'Simulation Result'}
              </h3>
              {simulation && (
                <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10px] font-semibold text-brand">
                  {isRTL ? 'فحص تجريبي مؤكد' : 'Dry run confirmed'}
                </span>
              )}
            </div>

            {!simulation ? (
              <div className="py-10 text-center text-text-tertiary">
                <Sparkles size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">
                  {isRTL
                    ? 'أدخل نص تعليق واضغط "محاكاة القاعدة" لعرض تفاصيل التقييم هنا.'
                    : 'Enter synthetic comment text and click "Simulate rule" to see evaluation details here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Match Banner */}
                <div
                  className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                    simulation.decision.matched
                      ? 'border-success/30 bg-success/5 text-success'
                      : 'border-warning/30 bg-warning/5 text-warning'
                  }`}
                >
                  {simulation.decision.matched ? (
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-sm">
                      {simulation.decision.matched
                        ? isRTL
                          ? `تطابق: ${simulation.decision.rule?.name || 'قاعدة مخصصة'}`
                          : `Matched: ${simulation.decision.rule?.name || 'Configured Rule'}`
                        : isRTL
                          ? 'لم تطابق أي قاعدة مفعّلة'
                          : 'No matching rule found'}
                    </p>
                    <p className="mt-1 opacity-90">
                      {isRTL ? 'السبب:' : 'Reason:'}{' '}
                      <span className="font-mono">{simulation.decision.reason || (isRTL ? 'مؤهل' : 'eligible')}</span>
                      {' · '}
                      {isRTL ? 'الإجراء:' : 'Action:'}{' '}
                      <span className="font-medium">{simulation.decision.action}</span>
                      {simulation.decision.delay_minutes > 0 && (
                        <span>
                          {' · '}
                          {isRTL ? `تأخير: ${simulation.decision.delay_minutes} دقيقة` : `Delay: ${simulation.decision.delay_minutes}m`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Matched / Excluded Keywords */}
                {simulation.decision.matched_keywords.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="text-text-tertiary font-medium">
                      {isRTL ? 'الكلمات المطابقة:' : 'Matched Keywords:'}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {simulation.decision.matched_keywords.map((kw, i) => (
                        <span key={i} className="rounded-md border border-brand/30 bg-brand/10 text-brand px-2 py-0.5 text-xs font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Preview */}
                {simulation.public_reply_preview ? (
                  <div className="rounded-xl border border-success/20 bg-success/5 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-success font-semibold uppercase tracking-wider">
                      <span>{isRTL ? 'معاينة الرد العام' : 'Public Reply Preview'}</span>
                      <span className="opacity-75 font-normal lowercase">({simulation.preview_source})</span>
                    </div>
                    <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                      {simulation.public_reply_preview}
                    </p>
                  </div>
                ) : (
                  simulation.decision.permitted_actions.includes('public') && (
                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                      {isRTL
                        ? 'لم يتم إنشاء رد ذكاء اصطناعي ديناميكي في وضع المحاكاة.'
                        : 'AI-generated dynamic reply text is not created during a dry run.'}
                    </div>
                  )
                )}

                {/* Diagnostics details */}
                <div className="rounded-xl border border-border bg-surface-elevated/40 p-3 text-xs text-text-secondary space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">{isRTL ? 'اتصال الحساب:' : 'Channel Connection:'}</span>
                    <span className={simulation.diagnostics.channel_connected ? 'text-success font-medium' : 'text-error font-medium'}>
                      {simulation.diagnostics.channel_connected ? (isRTL ? 'متصل وجاهز' : 'Connected') : (isRTL ? 'غير متصل' : 'Disconnected')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">{isRTL ? 'حالة الويب هوك:' : 'Webhook Status:'}</span>
                    <span className="font-mono">{simulation.diagnostics.comment_webhook_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">{isRTL ? 'المتجر الإلكتروني:' : 'Commerce Context:'}</span>
                    <span>
                      {simulation.diagnostics.commerce_context.status === 'resolved'
                        ? `${simulation.diagnostics.commerce_context.provider || ''} (${simulation.diagnostics.commerce_context.name || 'Store'})`
                        : (isRTL ? 'غير مرتبط' : 'Unresolved')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Saved Scenarios & Regression Suite */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  {isRTL ? 'السيناريوهات المحفوظة' : 'Saved Regression Scenarios'}
                </h3>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary font-medium">
                  {scenarios.length}
                </span>
              </div>

              {scenarios.length > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => void runSuite()}
                  loading={testBusy}
                  disabled={testBusy || !selectedBotId}
                >
                  <Play size={11} className="me-1" />
                  {isRTL ? `تشغيل الكل (${scenarios.length})` : `Run All (${scenarios.length})`}
                </Button>
              )}
            </div>

            {/* Test Suite Summary if available */}
            {suite && (
              <div className="rounded-xl border border-border bg-surface-elevated/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">
                    {isRTL ? 'نتائج فحص المجموعة:' : 'Test Suite Result:'}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-success font-semibold">
                      {suite.summary.passed} {isRTL ? 'ناجح' : 'Passed'}
                    </span>
                    <span className="text-text-tertiary">·</span>
                    <span className={suite.summary.failed > 0 ? 'text-error font-semibold' : 'text-text-muted'}>
                      {suite.summary.failed} {isRTL ? 'فشل' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {scenarios.length === 0 ? (
              <div className="py-8 text-center text-text-tertiary">
                <Info size={20} className="mx-auto mb-1.5 opacity-40" />
                <p className="text-xs">
                  {isRTL
                    ? 'لم تحفظ أي سيناريوهات اختبار بعد. احفظ السيناريوهات لتشغيلها دفعة واحدة.'
                    : 'No test scenarios saved yet. Save scenarios on the left to run batch regression tests.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
                {scenarios.map((scenario) => {
                  const suiteMatch = suite?.results.find((r) => r.scenario_id === scenario.id)
                  return (
                    <li key={scenario.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary truncate">{scenario.name}</span>
                          {suiteMatch && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                suiteMatch.passed ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                              }`}
                            >
                              {suiteMatch.passed ? 'PASS' : 'FAIL'}
                            </span>
                          )}
                        </div>
                        <p className="text-text-tertiary truncate font-mono text-[11px] mt-0.5">
                          &quot;{scenario.input.comment_text}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setScenarioText(scenario.input.comment_text)
                            setScenarioPostId(scenario.input.post_id || '')
                          }}
                          disabled={testBusy}
                          title={isRTL ? 'تحميل إلى حقل المحاكاة' : 'Load into simulator'}
                        >
                          <Upload size={12} className="me-1" />
                          {isRTL ? 'تحميل' : 'Load'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(isRTL ? 'هل تريد حذف هذا السيناريو؟' : 'Delete this test scenario?')) {
                              void deleteScenario(scenario.id)
                            }
                          }}
                          disabled={testBusy}
                          className="p-1 rounded text-text-secondary hover:text-error hover:bg-error/10 transition"
                          title={isRTL ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
