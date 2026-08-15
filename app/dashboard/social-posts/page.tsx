import { Suspense } from 'react'
import SocialPostsContent from './SocialPostsContent'

export default function SocialPostsPage() {
  return (
    <Suspense fallback={null}>
      <SocialPostsContent />
    </Suspense>
  )
}