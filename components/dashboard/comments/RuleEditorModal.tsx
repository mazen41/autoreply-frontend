'use client'

import React, { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Switch from '../../../components/ui/Switch'
import { Select } from '../../../components/ui/Select'
import { CommentRule } from './types'

interface RuleEditorModalProps {
  isOpen: boolean
  onClose: () => void
  rule: CommentRule | null
  onSave: (rule: CommentRule) => void
  isRTL: boolean
}

export default function RuleEditorModal({
  isOpen,
  onClose,
  rule,
  onSave,
  isRTL,
}: RuleEditorModalProps) {
  const [name, setName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [keywordsStr, setKeywordsStr] = useState('')
  const [excludedStr, setExcludedStr] = useState('')
  const [match, setMatch] = useState<'contains' | 'equals'>('contains')
  const [postIdsStr, setPostIdsStr] = useState('')
  const [variantsStr, setVariantsStr] = useState('')
  const [delayMinutes, setDelayMinutes] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setEnabled(rule.enabled)
      setKeywordsStr(rule.keywords.join(', '))
      setExcludedStr(rule.excluded_keywords.join(', '))
      setMatch(rule.match)
      setPostIdsStr(rule.post_ids.join(', '))
      setVariantsStr(rule.public_reply_variants.join('\n'))
      setDelayMinutes(rule.delay_minutes)
      setError('')
    } else {
      setName('')
      setEnabled(true)
      setKeywordsStr('')
      setExcludedStr('')
      setMatch('contains')
      setPostIdsStr('')
      setVariantsStr('')
      setDelayMinutes(0)
      setError('')
    }
  }, [rule, isOpen])

  const handleSave = () => {
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(isRTL ? 'يرجى إدخال اسم القاعدة.' : 'Rule name is required.')
      return
    }

    const keywords = keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    if (keywords.length === 0) {
      setError(isRTL ? 'يرجى إدخال كلمة تفعيل واحدة على الأقل.' : 'At least one trigger keyword is required.')
      return
    }

    const excluded = excludedStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const postIds = postIdsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const variants = variantsStr
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)

    if (variants.length === 0) {
      setError(isRTL ? 'يرجى كتابة نص رد عام واحد على الأقل.' : 'At least one public reply variant is required.')
      return
    }

    // Check duplicates
    const checkDuplicates = (arr: string[]) => {
      const lower = arr.map((item) => item.toLowerCase())
      return lower.length !== new Set(lower).size
    }

    if (checkDuplicates(keywords)) {
      setError(isRTL ? 'توجد كلمات تفعيل مكررة.' : 'Duplicate trigger keywords found.')
      return
    }
    if (checkDuplicates(excluded)) {
      setError(isRTL ? 'توجد كلمات استثناء مكررة.' : 'Duplicate excluded keywords found.')
      return
    }
    if (checkDuplicates(postIds)) {
      setError(isRTL ? 'توجد معرّفات منشورات مكررة.' : 'Duplicate post IDs found.')
      return
    }

    const savedRule: CommentRule = {
      id: rule?.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `rule-${Date.now()}`),
      name: trimmedName,
      keywords,
      excluded_keywords: excluded,
      match,
      action: 'public',
      public_reply_variants: variants,
      delay_minutes: Math.max(0, Math.min(10080, Number(delayMinutes) || 0)),
      post_ids: [...new Set(postIds)],
      enabled,
    }

    onSave(savedRule)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        rule
          ? isRTL ? 'تعديل قاعدة الرد' : 'Edit Comment Rule'
          : isRTL ? 'إنشاء قاعدة تعليق جديدة' : 'Create Comment Rule'
      }
      description={
        isRTL
          ? 'اضبط الكلمات المفتاحية وشروط المطابقة والردود العامة عند تلقي تعليق.'
          : 'Define trigger keywords, matching criteria, and public reply variants when a comment arrives.'
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {rule
              ? isRTL ? 'حفظ التعديلات' : 'Save Changes'
              : isRTL ? 'إضافة القاعدة' : 'Create Rule'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        {error && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-xs text-error">
            {error}
          </div>
        )}

        {/* Section 1: Basic info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {isRTL ? 'اسم القاعدة' : 'Rule Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder={isRTL ? 'مثال: الترحيب بالعملاء' : 'e.g. Greeting or Price Inquiry'}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-brand"
              />
            </div>
            <div className="pt-5">
              <Switch
                checked={enabled}
                onChange={setEnabled}
                label={isRTL ? 'تفعيل القاعدة' : 'Enabled'}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Trigger conditions */}
        <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {isRTL ? 'شروط التشغيل والمطابقة' : 'Trigger & Matching'}
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {isRTL ? 'طريقة المطابقة' : 'Match Mode'}
              </label>
              <Select
                value={match}
                onChange={(e) => setMatch(e.target.value as 'contains' | 'equals')}
                options={[
                  { value: 'contains', label: isRTL ? 'تحتوي على الكلمة' : 'Contains keyword' },
                  { value: 'equals', label: isRTL ? 'تطابق النص بالكامل (Exact)' : 'Exact comment match' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {isRTL ? 'تأخير الرد (بالدقائق)' : 'Reply Delay (Minutes)'}
              </label>
              <input
                type="number"
                min={0}
                max={10080}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {isRTL ? 'كلمات التفعيل (مفصولة بفواصل)' : 'Trigger Keywords (comma-separated)'}
            </label>
            <input
              type="text"
              value={keywordsStr}
              onChange={(e) => setKeywordsStr(e.target.value)}
              placeholder={isRTL ? 'مثال: السعر, بكم, كم السعر, Hi' : 'e.g. price, how much, cost, Hi'}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-brand"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {match === 'equals'
                ? isRTL
                  ? 'يجب أن يكون نص التعليق مطابقاً تماماً لإحدى هذه الكلمات.'
                  : 'The entire comment must match one of these keywords exactly.'
                : isRTL
                  ? 'يرد إذا احتوى التعليق على أي من هذه الكلمات ككلمة منفصلة.'
                  : 'Triggers when any of these keywords appears as a standalone word.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {isRTL ? 'كلمات الاستثناء (اختياري، مفصولة بفواصل)' : 'Excluded Keywords (optional, comma-separated)'}
            </label>
            <input
              type="text"
              value={excludedStr}
              onChange={(e) => setExcludedStr(e.target.value)}
              placeholder={isRTL ? 'مثال: شكوى, نصب, مستعمل' : 'e.g. spam, scam, refund'}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-brand"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {isRTL
                ? 'إذا احتوى التعليق على أي من هذه الكلمات، سيتم تخطيه حتى لو تطابقت كلمة التفعيل.'
                : 'If a comment contains any excluded keyword, the reply will be skipped.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {isRTL ? 'استهداف منشورات محددة (اختياري، معرّفات مفصولة بفواصل)' : 'Target Post IDs (optional, comma-separated)'}
            </label>
            <input
              type="text"
              value={postIdsStr}
              onChange={(e) => setPostIdsStr(e.target.value)}
              placeholder="e.g. 1029384756, 9876543210"
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-brand"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {isRTL
                ? 'اتركه فارغاً للتطبيق على جميع منشورات الصفحة التلقائية.'
                : 'Leave blank to apply this rule to all posts across the connected page.'}
            </p>
          </div>
        </div>

        {/* Section 3: Public response */}
        <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {isRTL ? 'الرد العام المتاح' : 'Public Reply Content'}
            </h4>
            <span className="text-[11px] text-text-muted">
              {isRTL ? 'نص واحد في كل سطر' : 'One variant per line'}
            </span>
          </div>

          <textarea
            value={variantsStr}
            onChange={(e) => setVariantsStr(e.target.value)}
            rows={3}
            maxLength={3000}
            placeholder={
              isRTL
                ? 'أهلاً بك! تم إرسال التفاصيل.\nمرحباً! يسعدنا تواصلك، تفضل بالاطلاع على الرابط.'
                : 'Hello! Thank you for contacting us.\nHi there! Check our catalog at...'
            }
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand leading-relaxed"
          />
          <p className="text-[11px] text-text-muted">
            {isRTL
              ? 'إذا كتبت أكثر من سطر، سيختار النظام أحد الردود عشوائياً لكل تعليق لتجنب التكرار.'
              : 'If multiple variants are provided, one will be chosen deterministically per comment.'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
