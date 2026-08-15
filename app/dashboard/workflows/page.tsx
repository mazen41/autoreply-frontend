import { Suspense } from 'react'
import WorkflowContent from './WorkflowContent'

export default function WorkflowPage() {
  return (
    <Suspense fallback={null}>
      <WorkflowContent />
    </Suspense>
  )
}