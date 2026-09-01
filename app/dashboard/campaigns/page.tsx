import { Suspense } from 'react'
import CampaignsContent from './CampaignsContent'

export default function CampaignsPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsContent />
    </Suspense>
  )
}