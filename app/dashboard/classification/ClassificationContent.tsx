'use client'

import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent } from '../../../components/ui/Card'
import { useLang } from '../../../lib/LangContext'
import { CircleAlert } from 'lucide-react'

export default function ClassificationContent() {
  const { isRTL } = useLang()
  const title = isRTL ? 'تصنيف الذكاء الاصطناعي' : 'AI Classification'
  const description = isRTL ? 'تصنيف المحادثات غير متاح حالياً.' : 'Conversation classification is not available yet.'

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader title={title} description={description} />
      <Card><CardContent className="flex items-start gap-3 p-5 md:p-6" role="status">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div><h2 className="font-semibold text-text-primary">{isRTL ? 'التصنيف غير متاح بعد' : 'Classification is not available yet'}</h2><p className="mt-1 text-sm leading-6 text-text-secondary">{isRTL
          ? 'تم إيقاف الإعدادات ونتائج الاختبار حتى يتوفر نظام التصنيف في الخادم.'
          : 'Classification settings and test results are disabled until the backend classifier is available.'}</p></div>
      </CardContent></Card>
    </main>
  )
}
