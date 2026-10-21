'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Switch from '../../../components/ui/Switch'
import { Select } from '../../../components/ui/Select'
import RuleEditorModal from './RuleEditorModal'
import { BotOption, CommentRule, RuleChannel } from './types'

interface CommentRulesManagerProps {
  bots: BotOption[]
  selectedBotId: string
  setSelectedBotId: (id: string) => void
  ruleChannels: RuleChannel[]
  selectedChannelId: string
  setSelectedChannelId: (id: string) => void
  rules: CommentRule[]
  setRules: React.Dispatch<React.SetStateAction<CommentRule[]>>
  ruleBusy: boolean
  ruleNotice: string
  saveRules: () => Promise<void>
  isRTL: boolean
  onToggleChannelEnabled?: (channelId: number, enabled: boolean) => void
  onTogglePublicReplyEnabled?: (channelId: number, enabled: boolean) => void
}

export default function CommentRulesManager({
  bots,
  selectedBotId,
  setSelectedBotId,
  ruleChannels,
  selectedChannelId,
  setSelectedChannelId,
  rules,
  setRules,
  ruleBusy,
  ruleNotice,
  saveRules,
  isRTL,
  onToggleChannelEnabled,
  onTogglePublicReplyEnabled,
}: CommentRulesManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CommentRule | null>(null)

  const selectedChannel = ruleChannels.find((c) => String(c.id) === selectedChannelId)

  const handleCreateRule = () => {
    setEditingRule(null)
    setModalOpen(true)
  }

  const handleEditRule = (rule: CommentRule) => {
    setEditingRule(rule)
    setModalOpen(true)
  }

  const handleSaveModalRule = (savedRule: CommentRule) => {
    if (editingRule) {
      setRules((current) => current.map((r) => (r.id === savedRule.id ? savedRule : r)))
    } else {
      setRules((current) => [...current, savedRule])
    }
  }

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه القاعدة؟' : 'Are you sure you want to delete this rule?')) {
      setRules((current) => current.filter((r) => r.id !== ruleId))
    }
  }

  const handleToggleRuleEnabled = (ruleId: string, enabled: boolean) => {
    setRules((current) => current.map((r) => (r.id === ruleId ? { ...r, enabled } : r)))
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Controls */}
      <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand" />
              {isRTL ? 'إدارة قواعد التعليقات الآلية' : 'Comment Automation Rules'}
            </h2>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              {isRTL
                ? 'حدّد الكلمات المفتاحية والردود العامة التي يرسلها وكيل الذكاء الاصطناعي عند وصول تعليقات جديدة على حساباتك.'
                : 'Configure keyword triggers and public responses sent automatically when users comment on your social pages.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateRule}
              disabled={!selectedChannelId || ruleBusy}
            >
              <Plus size={14} className="me-1.5" />
              {isRTL ? 'إضافة قاعدة' : 'Create Rule'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void saveRules()}
              loading={ruleBusy}
              disabled={!selectedChannelId || ruleBusy}
            >
              {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Bot & Channel Selectors */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              {isRTL ? 'الوكيل الذكي المكلّف' : 'Assigned Bot'}
            </label>
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              ariaLabel={isRTL ? 'اختر الوكيل الذكي' : 'Select bot'}
              value={selectedBotId}
              disabled={bots.length === 0}
              onChange={(e) => setSelectedBotId(e.target.value)}
              options={bots.map((b) => ({
                value: String(b.id),
                label: `${b.name}${b.status !== 'active' ? ` (${b.status})` : ''}`,
              }))}
              placeholder={isRTL ? 'اختر وكيلاً' : 'Select a bot'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              {isRTL ? 'الحساب الاجتماعي المرتبط' : 'Connected Social Account'}
            </label>
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              ariaLabel={isRTL ? 'اختر الحساب الاجتماعي' : 'Select social account'}
              value={selectedChannelId}
              disabled={ruleChannels.length === 0}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              options={ruleChannels.map((c) => ({
                value: String(c.id),
                label: `${c.name || c.type} (${c.type})`,
              }))}
              placeholder={isRTL ? 'اختر حساباً' : 'Select an account'}
            />
          </div>

          {selectedChannel && (
            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-border bg-surface-elevated/40 p-2.5 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-medium text-text-primary block">
                    {isRTL ? 'أتمتة التعليقات للحساب' : 'Account Auto-Reply'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {selectedChannel.enabled
                      ? isRTL ? 'مفعّلة على هذا الحساب' : 'Active on this page'
                      : isRTL ? 'معطّلة' : 'Disabled'}
                  </span>
                </div>
                {onToggleChannelEnabled && (
                  <Switch
                    checked={selectedChannel.enabled}
                    onChange={(checked) => onToggleChannelEnabled(selectedChannel.id, checked)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {ruleNotice && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{ruleNotice}</span>
          </div>
        )}
      </div>

      {/* Rules List Section */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary text-sm">
              {isRTL ? 'القواعد المفعّلة للحساب' : 'Configured Rules'}
            </h3>
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary font-medium">
              {rules.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateRule}
            disabled={!selectedChannelId}
            className="text-xs"
          >
            <Plus size={13} className="me-1" />
            {isRTL ? 'إضافة جديدة' : 'Add Rule'}
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="py-16 text-center px-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-text-tertiary">
              <Sparkles size={22} />
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              {isRTL ? 'لا توجد قواعد ردود بعد' : 'No comment rules yet'}
            </h4>
            <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              {isRTL
                ? 'أنشئ أول قاعدة لتحديد الكلمات التي يجب الرد عليها تلقائياً على هذا الحساب.'
                : 'Create your first rule to automatically match keywords and respond publicly to customer comments.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateRule}
              disabled={!selectedChannelId}
              className="mt-4"
            >
              <Plus size={14} className="me-1.5" />
              {isRTL ? 'إنشاء قاعدة الآن' : 'Create First Rule'}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className={`p-4 md:p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  rule.enabled ? 'hover:bg-surface-elevated/30' : 'opacity-60 bg-surface-elevated/10'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-sm text-text-primary">
                      {rule.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        rule.match === 'equals'
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-border bg-surface-elevated text-text-secondary'
                      }`}
                    >
                      {rule.match === 'equals'
                        ? isRTL ? 'تطابق كامل (Exact)' : 'Exact Match'
                        : isRTL ? 'تحتوي على الكلمة' : 'Contains'}
                    </span>
                    {rule.delay_minutes > 0 && (
                      <span className="text-[10px] text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded-full">
                        {isRTL ? `تأخير ${rule.delay_minutes} د` : `Delay ${rule.delay_minutes}m`}
                      </span>
                    )}
                  </div>

                  {/* Keywords chips */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[11px] text-text-tertiary font-medium">
                      {isRTL ? 'الكلمات:' : 'Keywords:'}
                    </span>
                    {rule.keywords.map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="rounded-md border border-border bg-surface-elevated px-2 py-0.5 text-xs text-text-primary font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                    {rule.excluded_keywords.length > 0 && (
                      <span className="text-[11px] text-error font-medium ms-2">
                        {isRTL ? `(استثناء: ${rule.excluded_keywords.join(', ')})` : `(Excludes: ${rule.excluded_keywords.join(', ')})`}
                      </span>
                    )}
                  </div>

                  {/* Reply preview */}
                  <div className="text-xs text-text-secondary truncate max-w-2xl bg-surface-elevated/40 rounded-lg p-2 border border-border/50">
                    <span className="text-text-tertiary me-2 font-medium">
                      {isRTL ? 'الرد العام:' : 'Public Reply:'}
                    </span>
                    <span className="text-text-primary">
                      {rule.public_reply_variants[0] || (isRTL ? '—' : 'None')}
                    </span>
                    {rule.public_reply_variants.length > 1 && (
                      <span className="text-[10px] text-text-tertiary ms-2">
                        +{rule.public_reply_variants.length - 1} {isRTL ? 'بدائل أخرى' : 'more variants'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-muted">
                      {rule.enabled
                        ? isRTL ? 'مفعّلة' : 'Active'
                        : isRTL ? 'معطّلة' : 'Paused'}
                    </span>
                    <Switch
                      checked={rule.enabled}
                      onChange={(checked) => handleToggleRuleEnabled(rule.id, checked)}
                    />
                  </div>

                  <div className="flex items-center gap-1 border-s border-border ps-3">
                    <button
                      type="button"
                      onClick={() => handleEditRule(rule)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition"
                      title={isRTL ? 'تعديل القاعدة' : 'Edit Rule'}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition"
                      title={isRTL ? 'حذف القاعدة' : 'Delete Rule'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule Editor Modal */}
      <RuleEditorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        rule={editingRule}
        onSave={handleSaveModalRule}
        isRTL={isRTL}
      />
    </div>
  )
}
