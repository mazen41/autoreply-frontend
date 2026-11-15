'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Inbox route failed to load', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="grid min-h-[70vh] place-items-center p-6 bg-background">
      <section
        role="alert"
        className="w-full max-w-lg rounded-3xl border border-border bg-surface-elevated p-7 text-center shadow-xl"
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-error/10 text-error">
          <AlertTriangle size={22} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-text-primary">
          تعذر تحميل صفحة الرسائل / Could not load inbox
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          لم تتأثر بياناتك. يمكنك إعادة المحاولة أو العودة إلى لوحة التحكم.
          <br />
          Your data is safe. Please retry or return to your dashboard.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-text-tertiary">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-hover transition-colors"
          >
            <RefreshCw size={15} />
            إعادة المحاولة / Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
          >
            لوحة التحكم / Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
