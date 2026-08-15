import { Suspense } from 'react'
import CartRecoveryContent from './CartRecoveryContent'

export default function CartRecoveryPage() {
  return (
    <Suspense fallback={null}>
      <CartRecoveryContent />
    </Suspense>
  )
}