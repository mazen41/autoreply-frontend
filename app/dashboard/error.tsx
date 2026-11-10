'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useLang } from '../../lib/LangContext'

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { isRTL } = useLang()

  useEffect(() => {
    console.error('Dashboard route failed to render', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="grid min-h-[70vh] place-items-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <section role="alert" className="w-full max-w-lg rounded-3xl border border-border bg-surface-elevated p-7 text-center shadow-xl">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-error/10 text-error"><AlertTriangle size={22} /></span>
        <h1 className="mt-4 text-xl font-bold text-text-primary">{isRTL ? 'تعذر فتح هذه الصفحة' : 'This page could not be opened'}</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{isRTL ? 'لم تتأثر بياناتك. أعد المحاولة أو انتقل إلى صفحة أخرى من القائمة.' : 'Your data is safe. Try rendering this page again or navigate to another workspace page.'}</p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-text-tertiary">Ref: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text"><RefreshCw size={15} />{isRTL ? 'إعادة المحاولة' : 'Try again'}</button>
          <Link href="/dashboard" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-primary">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</Link>
        </div>
      </section>
    </main>
  )
}
