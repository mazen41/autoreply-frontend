import { Suspense } from 'react'
import ClassificationContent from './ClassificationContent'

export default function ClassificationPage() {
  return (
    <Suspense fallback={null}>
      <ClassificationContent />
    </Suspense>
  )
}