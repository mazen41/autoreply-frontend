import { Suspense } from 'react'
import OrderNotificationsContent from './OrderNotificationsContent'

export default function OrderNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <OrderNotificationsContent />
    </Suspense>
  )
}