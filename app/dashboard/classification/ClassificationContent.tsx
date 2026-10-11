'use client'

import PageHeader from '../../../components/ui/PageHeader'
import { useLang } from '../../../lib/LangContext'

export default function ClassificationContent() {
  const { isRTL } = useLang()
  const title = isRTL ? 'تصنيف الذكاء الاصطناعي' : 'AI Classification'
  const description = isRTL ? 'تصنيف المحادثات غير متاح حالياً.' : 'Conversation classification is not available yet.'

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={title} description={description} />
      <section dir={isRTL ? 'rtl' : 'ltr'} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-sm text-[var(--text-secondary)]" role="status">
        {isRTL
          ? 'تم إيقاف الإعدادات ونتائج الاختبار حتى يتوفر نظام التصنيف في الخادم.'
          : 'Classification settings and test results are disabled until the backend classifier is available.'}
      </section>
    </div>
  )
}
