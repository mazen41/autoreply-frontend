import { Suspense } from 'react'
import ApiKeysContent from './ApiKeysContent'

export default function ApiKeysPage() {
  return (
    <Suspense fallback={null}>
      <ApiKeysContent />
    </Suspense>
  )
}