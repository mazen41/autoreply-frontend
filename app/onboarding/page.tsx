import { Suspense } from 'react'
import OnboardingWizard from '../../components/auth/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </div>
    }>
      <OnboardingWizard />
    </Suspense>
  )
}
