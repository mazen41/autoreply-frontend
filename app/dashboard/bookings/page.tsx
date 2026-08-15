import { Suspense } from 'react'
import BookingsContent from './BookingsContent'

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsContent />
    </Suspense>
  )
}