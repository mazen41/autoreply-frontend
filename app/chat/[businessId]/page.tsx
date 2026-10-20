'use client'

import { useParams } from 'next/navigation'
import WebChatWidget from '../../../components/webchat/WebChatWidget'

export default function HostedWebChatPage() {
  const params = useParams<{ businessId: string }>()
  const businessId = Number(params.businessId)
  if (!Number.isInteger(businessId) || businessId < 1) return <main className="p-6">Invalid chat link.</main>
  return <main className="min-h-screen bg-background"><WebChatWidget businessId={businessId} /></main>
}
