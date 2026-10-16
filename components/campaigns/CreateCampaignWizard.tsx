'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Save,
  Globe2,
  Camera,
  Play,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import { Channel, CampaignType, MessageAudiencePreview, EmailAudiencePreview } from './types'
import { getBusinessHeaders } from '../../lib/businessContext'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  channels: Channel[]
  businessId: number | null
  token: string
  isRTL: boolean
  onCampaignCreated: () => void
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CreateCampaignWizard({
  isOpen,
  onClose,
  channels,
  businessId,
  token,
  isRTL,
  onCampaignCreated,
}: Props) {
  const [step, setStep] = useState<number>(1)
  const totalSteps = 5

  // Form State
  const [name, setName] = useState('')
  const [channelType, setChannelType] = useState<CampaignType>('bulk')
  const [channelId, setChannelId] = useState<string>('')
  const [tagsInput, setTagsInput] = useState('')
  const [lastActivityDays, setLastActivityDays] = useState<string>('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('') // For email
  const [sendMode, setSendMode] = useState<'draft' | 'immediate' | 'scheduled'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [timezone, setTimezone] = useState('')

  // Audience Preview State
  const [audiencePreview, setAudiencePreview] = useState<MessageAudiencePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) setTimezone(tz)
    } catch {
      setTimezone('UTC')
    }
  }, [])

  // Auto-select first connected channel when opened or channel list changes
  useEffect(() => {
    if (channels.length > 0 && !channelId) {
      setChannelId(String(channels[0].id))
    }
  }, [channels, channelId])

  // Reset wizard on close
  const handleClose = () => {
    setStep(1)
    setName('')
    setMessage('')
    setSubject('')
    setTagsInput('')
    setLastActivityDays('')
    setSendMode('draft')
    setScheduledAt('')
    setAudiencePreview(null)
    onClose()
  }

  const selectedChannel = useMemo(() => {
    return channels.find((c) => String(c.id) === channelId)
  }, [channels, channelId])

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  }, [tagsInput])

  // Preview audience via API
  const handlePreviewAudience = async () => {
    if (!channelId || !businessId || !token) {
      toast.error(isRTL ? 'الرجاء اختيار الحساب أولاً' : 'Select a sending channel first')
      return
    }
    setPreviewLoading(true)
    setAudiencePreview(null)
    try {
      const res = await fetch(`${API}/api/businesses/${businessId}/campaigns/audience/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify({
          channel_id: Number(channelId),
          filters: {
            ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
            ...(lastActivityDays ? { last_activity_days: Number(lastActivityDays) } : {}),
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to preview audience')
      setAudiencePreview(data as MessageAudiencePreview)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audience preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Submit Campaign
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(isRTL ? 'يرجى إدخال اسم الحملة' : 'Please provide a campaign name')
      setStep(1)
      return
    }
    if (!channelId && channelType !== 'email') {
      toast.error(isRTL ? 'يرجى اختيار الحساب المتصل' : 'Please choose a sending channel')
      setStep(2)
      return
    }
    if (!message.trim()) {
      toast.error(isRTL ? 'يرجى كتابة نص الرسالة' : 'Please enter message content')
      setStep(4)
      return
    }
    if (sendMode === 'scheduled' && !scheduledAt) {
      toast.error(isRTL ? 'يرجى تحديد موعد الجدولة' : 'Please specify the scheduled date & time')
      setStep(5)
      return
    }

    setSaving(true)
    try {
      const endpoint = `/api/businesses/${businessId}/campaigns`
      const payload: Record<string, any> = {
        name: name.trim(),
        channel_id: Number(channelId),
        message: message.trim(),
        timezone: timezone || 'UTC',
        filters: {
          ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
          ...(lastActivityDays ? { last_activity_days: Number(lastActivityDays) } : {}),
        },
      }

      if (sendMode === 'scheduled') {
        payload.scheduled_at = scheduledAt
      }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create campaign')

      const createdCampaign = data.campaign

      // If user chose "Immediate Launch", trigger launch right after creation
      if (sendMode === 'immediate' && createdCampaign?.id) {
        const launchRes = await fetch(
          `${API}/api/businesses/${businessId}/campaigns/${createdCampaign.id}/launch`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              ...getBusinessHeaders(),
            },
          }
        )
        const launchData = await launchRes.json().catch(() => ({}))
        if (!launchRes.ok) {
          toast.success(isRTL ? 'تم إنشاء الحملة ولكن فشل الإطلاق الفوري' : 'Campaign created, but immediate launch failed')
        } else {
          toast.success(isRTL ? 'تم إنشاء الحملة وبدء الإرسال فوراً! 🚀' : 'Campaign created and launched immediately! 🚀')
        }
      } else if (sendMode === 'scheduled') {
        toast.success(isRTL ? 'تمت جدولة الحملة بنجاح 📅' : 'Campaign scheduled successfully 📅')
      } else {
        toast.success(isRTL ? 'تم حفظ الحملة كمسودة بنجاح 📝' : 'Campaign saved as draft 📝')
      }

      handleClose()
      onCampaignCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  // Validation before advancing step
  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return Boolean(channelId)
    if (step === 3) return true
    if (step === 4) return message.trim().length > 0
    return true
  }

  const stepsMeta = [
    { num: 1, title: isRTL ? 'البيانات' : 'Details' },
    { num: 2, title: isRTL ? 'القناة' : 'Channel' },
    { num: 3, title: isRTL ? 'الجمهور' : 'Audience' },
    { num: 4, title: isRTL ? 'الرسالة' : 'Message' },
    { num: 5, title: isRTL ? 'الجدولة والتأكيد' : 'Schedule & Confirm' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Send size={16} className="text-brand" />
          <span className="font-bold text-sm text-text-primary">
            {isRTL ? 'معالج إنشاء حملة بث جديدة' : 'Create New Broadcast Campaign'}
          </span>
        </div>
      }
      size="xl"
    >
      <div className="p-6 space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            {stepsMeta.map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    step === s.num
                      ? 'bg-brand text-white shadow-xs'
                      : s.num < step
                      ? 'bg-surface-elevated text-brand hover:bg-surface'
                      : 'text-text-tertiary cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px]">{s.num}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {idx < stepsMeta.length - 1 && (
                  <ChevronRight size={12} className={`text-border ${isRTL ? 'rotate-180' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="text-xs text-text-tertiary font-mono">
            {step} / {totalSteps}
          </span>
        </div>

        {/* STEP 1: Campaign Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'الخطوة 1: تفاصيل واسم الحملة' : 'Step 1: Campaign Details'}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL
                  ? 'اسم الحملة يُستخدم للتعرف عليها وإدارتها في لوحة التحكم، ولا يظهر للعملاء في الرسالة.'
                  : 'The campaign name identifies this broadcast in your dashboard. It is never displayed to customers.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">
                {isRTL ? 'اسم الحملة الداخلي *' : 'Campaign Name *'}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRTL ? 'مثال: عرض نهاية الأسبوع - خصم 20%' : 'e.g. VIP Summer Sale Announcement'}
                required
                autoFocus
              />
            </div>

            <div className="rounded-xl border border-border/80 bg-surface-elevated/40 p-3.5 text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary block mb-1">
                {isRTL ? '💡 متى تستخدم حملات البث؟' : '💡 When to use Campaigns?'}
              </span>
              {isRTL
                ? 'استخدم الحملات عندما تريد إرسال رسالة واحدة محددة لجمهور من العملاء دفعة واحدة. إذا كنت تريد رسائل متعددة على مدار أيام أو أسابيع، فاستخدم المسارات الآلية (Sequences).'
                : 'Use campaigns when you want to broadcast a single message to a selected list of recipients. If you need a multi-day drip journey, use Automated Sequences instead.'}
            </div>
          </div>
        )}

        {/* STEP 2: Channel & Account Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'الخطوة 2: اختيار قناة الإرسال والحساب المتصل' : 'Step 2: Choose Sending Channel & Account'}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL
                  ? 'اختر الحساب المصرح الذي ستُرسل الرسائل باسمه إلى العملاء.'
                  : 'Select which verified connected channel will dispatch these broadcast messages.'}
              </p>
            </div>

            {channels.length === 0 ? (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-warning space-y-2">
                <p className="font-semibold">{isRTL ? 'لا توجد قنوات مراسلة متصلة' : 'No connected channels available'}</p>
                <p>
                  {isRTL
                    ? 'يجب ربط حساب واتساب أو صفحة فيسبوك/انستغرام أولاً من قسم القنوات لتتمكن من إطلاق الحملات.'
                    : 'Please connect a WhatsApp number or Meta page in Dashboard Channels before launching campaigns.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {channels.map((ch) => {
                  const isSelected = String(ch.id) === channelId
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setChannelId(String(ch.id))}
                      className={`cursor-pointer rounded-xl border p-3.5 transition flex items-center justify-between ${
                        isSelected
                          ? 'border-brand bg-brand/[0.04] ring-1 ring-brand'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-text-primary">{ch.page_name}</span>
                          <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                            {ch.type}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-text-tertiary block">
                          ID: #{ch.id} · {ch.status === 'connected' ? (isRTL ? 'متصل وجاهز' : 'Connected') : ch.status}
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-brand bg-brand' : 'border-border'
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedChannel && (
              <div className="rounded-xl bg-surface-elevated p-3 text-xs text-text-secondary">
                <p>
                  {isRTL ? 'سيتم إرسال الرسائل عبر: ' : 'Messages will be dispatched from: '}
                  <strong className="text-text-primary">{selectedChannel.page_name}</strong> ({selectedChannel.type})
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Audience Targeting & Live Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'الخطوة 3: تحديد وتصفية الجمهور' : 'Step 3: Audience Filtering & Live Eligibility'}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL
                  ? 'حدد من سيتلقى هذه الحملة. يمكنك تصفية العملاء بالوسوم أو فترة النشاط، ومعاينة المستحقين فعلياً.'
                  : 'Target specific customer segments using tags and recency. Preview eligible contacts before saving.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {isRTL ? 'تصفية بالوسوم (Tags)' : 'Filter by Tags'}
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value)
                    setAudiencePreview(null)
                  }}
                  placeholder={isRTL ? 'vip, summer, repeat_buyer' : 'vip, summer, repeat_buyer'}
                />
                <span className="text-[10px] text-text-tertiary">
                  {isRTL ? 'افصل بين الوسوم بفواصل. اتركه فارغاً لاستهداف الجميع.' : 'Separate tags with commas. Leave blank to target all contacts.'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {isRTL ? 'النشاط الأخير (بالأيام)' : 'Last Activity (Days)'}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={lastActivityDays}
                  onChange={(e) => {
                    setLastActivityDays(e.target.value)
                    setAudiencePreview(null)
                  }}
                  placeholder={isRTL ? 'مثال: 30' : 'e.g. 30'}
                />
                <span className="text-[10px] text-text-tertiary">
                  {isRTL ? 'العملاء الذين تفاعلوا خلال هذا العدد من الأيام.' : 'Contacts active within this number of days.'}
                </span>
              </div>
            </div>

            {/* Live Audience Preview Button & Results */}
            <div className="rounded-xl border border-border/80 bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-text-primary">
                    {isRTL ? 'فحص الأهلية المباشر' : 'Live Eligibility Verification'}
                  </h4>
                  <p className="text-[11px] text-text-tertiary">
                    {isRTL ? 'التحقق من عدد المستلمين المؤهلين وفق شروط المنصة والموافقة' : 'Check real eligible audience count according to platform consent & messaging window'}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handlePreviewAudience()}
                  loading={previewLoading}
                  icon={<Users size={13} />}
                >
                  {isRTL ? 'فحص الجمهور الآن' : 'Preview Eligible Audience'}
                </Button>
              </div>

              {audiencePreview && (
                <div className="rounded-lg bg-surface-elevated p-3 text-xs space-y-2 border border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">
                      {isRTL ? 'إجمالي المطابقين: ' : 'Total Matched: '}
                      <strong className="text-text-primary">{audiencePreview.total_matched}</strong>
                    </span>
                    <span className="text-text-secondary">
                      {isRTL ? 'المؤهلون للإرسال: ' : 'Eligible for Dispatch: '}
                      <strong className="text-success">{audiencePreview.eligible}</strong>
                    </span>
                  </div>

                  {audiencePreview.excluded && Object.keys(audiencePreview.excluded).length > 0 && (
                    <div className="pt-2 border-t border-border/40 text-[11px] text-text-tertiary">
                      <span>{isRTL ? 'المستبعدون لأسباب حماية:' : 'Excluded for policy / consent reasons:'} </span>
                      {Object.entries(audiencePreview.excluded)
                        .filter(([_, count]) => count > 0)
                        .map(([reason, count]) => (
                          <span key={reason} className="mr-2 inline-block">
                            • {reason.replace(/_/g, ' ')}: {count}
                          </span>
                        ))}
                    </div>
                  )}

                  {!audiencePreview.campaign_ready && audiencePreview.configuration_reason && (
                    <p className="text-warning text-[11px] pt-1">
                      ⚠️ {audiencePreview.configuration_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Message Composer */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'الخطوة 4: صياغة نص الرسالة' : 'Step 4: Compose Broadcast Message'}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL
                  ? 'اكتب نص الرسالة التي ستصل للعملاء. يمكنك استخدام المتغيرات الديناميكية لتخصيص كل رسالة.'
                  : 'Compose the message content. Use dynamic variables to personalize the text for each customer.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary">
                  {isRTL ? 'نص الرسالة *' : 'Message Body *'}
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-tertiary">{message.length} {isRTL ? 'حرف' : 'chars'}</span>
                  <button
                    type="button"
                    onClick={() => setMessage((prev) => prev + ' {{name}}')}
                    className="rounded bg-surface-elevated px-1.5 py-0.5 text-brand hover:underline font-mono text-[10px]"
                    title="Insert customer name"
                  >
                    + &#123;&#123;name&#125;&#125;
                  </button>
                </div>
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isRTL
                    ? 'أهلاً {{name}}! يسعدنا إعلامك ببدء عرضنا الحصري لهذا الأسبوع...'
                    : 'Hi {{name}}! We are thrilled to invite you to our exclusive VIP weekend offer...'
                }
                rows={5}
                required
                className="font-sans leading-relaxed text-xs"
              />
              <span className="text-[10px] text-text-tertiary">
                {isRTL
                  ? 'يدعم التنسيقات: *غامق*، _مائل_، والروابط التلقائية القابلة للنقر.'
                  : 'Supports formatting: *bold*, _italics_, and clickable coupon links.'}
              </span>
            </div>

            {/* Live Chat Bubble Preview */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <span className="text-[11px] font-semibold text-text-primary block">
                {isRTL ? 'معاينة مظهر الرسالة في الدردشة' : 'Live Message Preview'}
              </span>
              <div className="rounded-lg bg-surface-elevated p-4 flex flex-col items-start max-w-sm">
                <div className="rounded-2xl rounded-tl-xs bg-surface border border-border p-3 text-xs text-text-primary shadow-xs leading-relaxed whitespace-pre-wrap">
                  {message
                    ? message.replace(/\{\{\s*name\s*\}\}/gi, isRTL ? 'أحمد' : 'Sarah')
                    : isRTL
                    ? 'نص الرسالة سيظهر هنا...'
                    : 'Message text will preview here...'}
                  <div className="mt-1 text-end text-[9px] text-text-tertiary">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Delivery Schedule & Confirmation */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isRTL ? 'الخطوة 5: موعد الإرسال والتأكيد النهائي' : 'Step 5: Delivery Schedule & Final Confirmation'}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL
                  ? 'اختر متى يجب أن يبدأ النظام في إرسال الحملة، وراجع ملخص البيانات قبل الحفظ.'
                  : 'Choose when the system should begin dispatching, and review final details before confirming.'}
              </p>
            </div>

            {/* Send Mode Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSendMode('draft')}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  sendMode === 'draft'
                    ? 'border-brand bg-brand/[0.04] ring-1 ring-brand'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className={sendMode === 'draft' ? 'text-brand' : 'text-text-tertiary'} />
                  <span className="font-semibold text-xs text-text-primary">
                    {isRTL ? 'حفظ كمسودة' : 'Save as Draft'}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed">
                  {isRTL ? 'حفظ البيانات دون إرسالها الآن. يمكنك مراجعتها وإطلاقها لاحقاً.' : 'Save without sending now. Review or launch whenever ready.'}
                </p>
              </div>

              <div
                onClick={() => setSendMode('immediate')}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  sendMode === 'immediate'
                    ? 'border-brand bg-brand/[0.04] ring-1 ring-brand'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send size={16} className={sendMode === 'immediate' ? 'text-brand' : 'text-text-tertiary'} />
                  <span className="font-semibold text-xs text-text-primary">
                    {isRTL ? 'إرسال فوري الآن' : 'Send Immediately'}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed">
                  {isRTL ? 'بدء معالجة وإرسال الرسائل للمستهدفين فور الضغط على تأكيد.' : 'Queue and begin dispatching to eligible contacts right away.'}
                </p>
              </div>

              <div
                onClick={() => setSendMode('scheduled')}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  sendMode === 'scheduled'
                    ? 'border-brand bg-brand/[0.04] ring-1 ring-brand'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className={sendMode === 'scheduled' ? 'text-brand' : 'text-text-tertiary'} />
                  <span className="font-semibold text-xs text-text-primary">
                    {isRTL ? 'جدولة لموعد لاحق' : 'Schedule for Later'}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed">
                  {isRTL ? 'تحديد تاريخ ووقت محدد لإطلاق الحملة تلقائياً في منطقتك.' : 'Set future date & time. The system launches automatically.'}
                </p>
              </div>
            </div>

            {/* Scheduled Datetime Input if selected */}
            {sendMode === 'scheduled' && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                <label className="text-xs font-semibold text-text-primary block">
                  {isRTL ? 'تاريخ ووقت الإطلاق المجدول *' : 'Scheduled Launch Date & Time *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface rounded-lg px-3 border border-border">
                    <Clock size={14} className="text-text-tertiary shrink-0" />
                    <span className="truncate">
                      {isRTL ? 'المنطقة الزمنية: ' : 'Timezone: '}
                      <strong className="text-text-primary">{timezone || 'UTC'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Final Summary Review Box */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <h4 className="font-semibold text-xs text-text-primary">
                {isRTL ? 'ملخص الحملة قبل الحفظ' : 'Final Campaign Review'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-tertiary">{isRTL ? 'اسم الحملة: ' : 'Campaign Name: '}</span>
                  <strong className="text-text-primary">{name}</strong>
                </div>

                <div>
                  <span className="text-text-tertiary">{isRTL ? 'الحساب المرسل: ' : 'Sending Account: '}</span>
                  <strong className="text-text-primary">{selectedChannel?.page_name || 'Channel #' + channelId}</strong>
                </div>

                <div>
                  <span className="text-text-tertiary">{isRTL ? 'الجمهور المقدر: ' : 'Audience Reach: '}</span>
                  <strong className="text-text-primary">
                    {audiencePreview ? `${audiencePreview.eligible} ${isRTL ? 'مؤهل' : 'eligible'}` : (isRTL ? 'يُفحص عند الإرسال' : 'Checked at send time')}
                  </strong>
                </div>

                <div>
                  <span className="text-text-tertiary">{isRTL ? 'وضع الإرسال: ' : 'Execution Mode: '}</span>
                  <Badge
                    variant={sendMode === 'immediate' ? 'ai' : sendMode === 'scheduled' ? 'warning' : 'outline'}
                    size="sm"
                  >
                    {sendMode === 'immediate'
                      ? isRTL ? 'إرسال فوري' : 'Send Immediately'
                      : sendMode === 'scheduled'
                      ? isRTL ? `مجدول في ${scheduledAt}` : `Scheduled: ${scheduledAt}`
                      : isRTL ? 'مسودة فقط' : 'Draft Only'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-border/80 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? handleClose : () => setStep(step - 1)}
            disabled={saving}
            icon={step > 1 ? <ChevronLeft size={13} className={isRTL ? 'rotate-180' : ''} /> : undefined}
          >
            {step === 1 ? (isRTL ? 'إلغاء' : 'Cancel') : (isRTL ? 'السابق' : 'Previous')}
          </Button>

          <div className="flex items-center gap-2">
            {step < totalSteps ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                icon={<ChevronRight size={13} className={isRTL ? 'rotate-180' : ''} />}
              >
                {isRTL ? 'المتابعة للخطوة التالية' : 'Next Step'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSubmit()}
                loading={saving}
                icon={
                  sendMode === 'immediate' ? (
                    <Play size={13} />
                  ) : sendMode === 'scheduled' ? (
                    <Calendar size={13} />
                  ) : (
                    <Save size={13} />
                  )
                }
              >
                {sendMode === 'immediate'
                  ? isRTL ? 'تأكيد وإطلاق الحملة الآن' : 'Launch Campaign Now'
                  : sendMode === 'scheduled'
                  ? isRTL ? 'تأكيد جدولة الحملة' : 'Schedule Campaign'
                  : isRTL ? 'حفظ الحملة كمسودة' : 'Save as Draft'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
