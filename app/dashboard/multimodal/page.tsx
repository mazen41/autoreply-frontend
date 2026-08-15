import { Suspense } from 'react'
import MultimodalContent from './MultimodalContent'

export default function MultimodalPage() {
  return (
    <Suspense fallback={null}>
      <MultimodalContent />
    </Suspense>
  )
}