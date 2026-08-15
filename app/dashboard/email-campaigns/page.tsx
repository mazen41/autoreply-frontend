import { Suspense } from 'react'
import EmailCampaignsContent from './EmailCampaignsContent'

export default function EmailCampaignsPage() {
  return (
    <Suspense fallback={null}>
      <EmailCampaignsContent />
    </Suspense>
  )
}