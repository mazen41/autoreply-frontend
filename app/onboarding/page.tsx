import { Suspense } from 'react'
import OnboardingWizard from '../../components/auth/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          </div>
        }
      >
        <OnboardingWizard />
      </Suspense>
    </main>
  )
}
