import { Suspense } from 'react'
import RoutingContent from './RoutingContent'

export default function RoutingPage() {
  return (
    <Suspense fallback={null}>
      <RoutingContent />
    </Suspense>
  )
}