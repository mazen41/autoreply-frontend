import { Suspense } from 'react'
import AIKnowledgeContent from './AIKnowledgeContent'

export default function AIKnowledgePage() {
  return (
    <Suspense fallback={null}>
      <AIKnowledgeContent />
    </Suspense>
  )
}
