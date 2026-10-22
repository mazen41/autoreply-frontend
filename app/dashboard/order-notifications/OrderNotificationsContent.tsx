'use client'

import Link from 'next/link'
import { BellRing, CircleAlert } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Card, { CardContent } from '../../../components/ui/Card'
import { useLang } from '../../../lib/LangContext'

export default function OrderNotificationsContent() {
  const { isRTL } = useLang()
  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader title={isRTL ? 'إشعارات الطلبات' : 'Order notifications'} description={isRTL ? 'تحديثات تلقائية للعملاء عند تغيّر حالة طلبات المتاجر.' : 'Automatic customer updates for commerce order events.'} />

      <Card><CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-text-primary">{isRTL ? 'غير متاح بعد' : 'Not available yet'}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {isRTL
                ? 'إشعارات حالة الطلب غير مرتبطة حالياً بأحداث مزودي التجارة. أزلنا عناصر التحكم السابقة لأنها لم تكن تحفظ الإعدادات أو ترسل الرسائل، وذلك لتجنب إظهار نجاح غير حقيقي.'
                : 'Order status notifications are not currently connected to commerce provider events. The previous controls did not save notification settings or send messages, so they have been removed to avoid showing a false success state.'}
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {isRTL
                ? 'يمكنك إنشاء أتمتة محادثات مدعومة من صفحة سير العمل. يتطلب تفعيل إشعارات أحداث الطلب ربط أحداث مزود المتجر أولاً.'
                : 'You can still build supported conversation automations in Workflows. Order-event notifications will need a provider event integration before they can be configured here.'}
            </p>
            <Link href="/dashboard/workflows" className="mt-4 inline-flex"><Button><BellRing className="h-4 w-4" aria-hidden="true" />{isRTL ? 'فتح سير العمل' : 'Open workflows'}</Button></Link>
          </div>
        </div>
      </CardContent></Card>
    </main>
  )
}
