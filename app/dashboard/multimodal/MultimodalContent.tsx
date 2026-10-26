'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Image as ImageIcon, UploadCloud } from 'lucide-react'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import toast from 'react-hot-toast'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardContent } from '../../../components/ui/Card'
import { useLang } from '../../../lib/LangContext'

interface ImageAnalysis {
  description?: string
  extracted_text?: string
  product_matches?: unknown[]
  confidence?: number
  detected_intent?: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function authHeaders(): Record<string, string> {
  const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('naz_token='))?.split('=')[1]
  return {
    Authorization: `Bearer ${decodeURIComponent(token || '')}`,
    Accept: 'application/json',
    ...getBusinessHeaders(),
  }
}

export default function MultimodalContent() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [disclosureAcknowledged, setDisclosureAcknowledged] = useState(false)
  const [disclosureLoading, setDisclosureLoading] = useState(true)
  const [disclosureError, setDisclosureError] = useState('')
  const [disclosureSaving, setDisclosureSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ImageAnalysis | null>(null)

  useEffect(() => {
    const syncBusiness = () => setBusinessId(getSelectedBusinessId())
    syncBusiness()
    window.addEventListener('naz:business-changed', syncBusiness)
    window.addEventListener('storage', syncBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', syncBusiness)
      window.removeEventListener('storage', syncBusiness)
    }
  }, [])

  const loadDisclosure = useCallback(async () => {
    if (!businessId) { setDisclosureAcknowledged(false); setDisclosureLoading(false); return }
    setDisclosureLoading(true)
    setDisclosureError('')
    try {
      const response = await fetch(`${apiBase}/api/media-processing/disclosure`, { headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(isRTL ? 'تعذر تحميل حالة الإقرار.' : data.message || 'Could not load the disclosure status.')
      setDisclosureAcknowledged(Boolean(data.acknowledged))
    } catch (error) {
      setDisclosureAcknowledged(false)
      setDisclosureError(error instanceof Error ? error.message : L('Could not load the disclosure status.', 'تعذر تحميل حالة الإقرار.'))
    } finally {
      setDisclosureLoading(false)
    }
  }, [businessId, isRTL])

  useEffect(() => { void loadDisclosure() }, [loadDisclosure])

  const saveDisclosure = async (acknowledged: boolean) => {
    setDisclosureSaving(true)
    try {
      const response = await fetch(`${apiBase}/api/media-processing/disclosure`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(isRTL ? 'تعذر حفظ الإقرار.' : payload.message || 'Could not save disclosure acknowledgment')
      setDisclosureAcknowledged(Boolean(payload.acknowledged))
      setDisclosureError('')
      toast.success(acknowledged ? L('Disclosure acknowledgment saved', 'تم حفظ الإقرار') : L('Acknowledgment removed', 'تم إلغاء الإقرار'))
    } catch {
      toast.error(L('Could not save the media disclosure setting', 'تعذر حفظ إعداد معالجة الوسائط'))
    } finally {
      setDisclosureSaving(false)
    }
  }

  const analyzeImage = async () => {
    if (!disclosureAcknowledged) {
      toast.error(L('Acknowledge the media processing disclosure first', 'أقرّ بإشعار معالجة الوسائط أولًا'))
      return
    }
    if (!businessId) {
      toast.error(L('Select a business before testing media processing', 'اختر نشاطًا تجاريًا قبل اختبار معالجة الوسائط'))
      return
    }
    if (!image) {
      toast.error(L('Choose an image to analyze', 'اختر صورة لتحليلها'))
      return
    }

    setTesting(true)
    setResult(null)
    const body = new FormData()
    body.append('image', image)
    try {
      const response = await fetch(`${apiBase}/api/multimodal/test-image`, {
        method: 'POST',
        headers: authHeaders(),
        body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(isRTL ? 'فشل تحليل الصورة.' : data.message || 'Image analysis failed')
      setResult(data)
      toast.success(L('Image analyzed by the configured provider', 'تم تحليل الصورة باستخدام المزوّد المحدد'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : L('Image analysis failed', 'فشل تحليل الصورة'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader title={L('Media processing', 'معالجة الوسائط')} description={L('Incoming voice and image messages use the server-configured AI providers. Provider credentials and processing behavior are managed by the server.', 'تُعالج الرسائل الصوتية والصور الواردة باستخدام مزوّدي الذكاء الاصطناعي المحددين على الخادم، وتُدار بيانات اعتمادهم وطريقة المعالجة من إعدادات الخادم.')} />

      {!businessId && <p role="status" className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{L('Select a business before managing media settings.', 'اختر نشاطًا تجاريًا قبل إدارة إعدادات الوسائط.')}</p>}
      <Card><CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-warning" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">{L('Third-party media processing disclosure', 'إقرار معالجة الوسائط لدى جهة خارجية')}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {L('Images and voice messages may be sent to the AI provider configured for this service so it can analyze or transcribe them.', 'قد تُرسل الصور والرسائل الصوتية إلى مزوّد الذكاء الاصطناعي المحدد لهذه الخدمة لتحليلها أو تفريغها نصيًا.')}
            </p>
            {disclosureLoading ? (
              <p className="mt-3 text-sm text-text-tertiary">{L('Loading disclosure status…', 'جارٍ تحميل حالة الإقرار…')}</p>
            ) : (
              <Checkbox checked={disclosureAcknowledged} disabled={disclosureSaving || !businessId || Boolean(disclosureError)} onChange={saveDisclosure} label={L('I acknowledge this media processing disclosure for this business.', 'أقرّ بإشعار معالجة الوسائط لهذا النشاط التجاري.')} className="mt-4 text-sm" />
            )}
            {disclosureError && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{disclosureError}</span><Button variant="outline" size="sm" onClick={() => void loadDisclosure()} disabled={disclosureLoading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
          </div>
          {disclosureAcknowledged && <CheckCircle2 className="h-5 w-5 text-success" aria-label={L('Acknowledged', 'تم الإقرار')} />}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 md:p-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-semibold text-text-primary">{L('Test image analysis', 'اختبار تحليل الصور')}</h2>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {L('This sends the selected image to the configured vision provider. The image is not saved by this test endpoint.', 'سيتم إرسال الصورة المحددة إلى مزوّد تحليل الصور. لا يحفظ هذا الاختبار الصورة.')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-brand hover:bg-brand/5">
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {L('Choose image', 'اختيار صورة')}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label={L('Choose image to analyze', 'اختر صورة لتحليلها')} onChange={event => { setImage(event.target.files?.[0] || null); setResult(null) }} />
          </label>
          <span className="max-w-full truncate text-sm text-text-secondary">{image?.name || L('No image selected', 'لم يتم اختيار صورة')}</span>
          <Button type="button" onClick={analyzeImage} disabled={testing || disclosureLoading || !disclosureAcknowledged || !image || !businessId} loading={testing}>{testing ? L('Analyzing…', 'جارٍ التحليل…') : L('Analyze image', 'تحليل الصورة')}</Button>
        </div>

        {result && (
          <div className="mt-5 space-y-2 rounded-lg border border-border bg-surface p-4 text-sm text-text-primary">
            {typeof result.confidence === 'number' && <p><strong>{L('Confidence:', 'مستوى الثقة:')}</strong> {Math.round(result.confidence * 100)}%</p>}
            {result.detected_intent && <p><strong>{L('Detected intent:', 'النية المكتشفة:')}</strong> {result.detected_intent}</p>}
            {result.description && <p><strong>{L('Description:', 'الوصف:')}</strong> {result.description}</p>}
            {result.extracted_text && <p><strong>{L('Extracted text:', 'النص المستخرج:')}</strong> {result.extracted_text}</p>}
            {!!result.product_matches?.length && <p><strong>{L('Product matches:', 'المنتجات المطابقة:')}</strong> {JSON.stringify(result.product_matches)}</p>}
          </div>
        )}
      </CardContent></Card>
    </div>
  )
}
