'use client'

import Link from 'next/link'
import { BellRing, CircleAlert } from 'lucide-react'

export default function OrderNotificationsContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Order notifications</h1>
        <p className="mt-1 text-sm text-text-secondary">Automatic customer updates for commerce order events.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface-elevated p-6">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-text-primary">Not available yet</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Order status notifications are not currently connected to commerce provider events. The previous controls did not save notification settings or send messages, so they have been removed to avoid showing a false success state.
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              You can still build supported conversation automations in Workflows. Order-event notifications will need a provider event integration before they can be configured here.
            </p>
            <Link
              href="/dashboard/workflows"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              <BellRing className="h-4 w-4" aria-hidden="true" />
              Open workflows
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
