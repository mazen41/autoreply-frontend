import { Suspense } from 'react'
import AuthLeftPanel from '../../components/auth/AuthLeftPanel'
import RegisterForm from '../../components/auth/RegisterForm'
import LanguageToggle from '../../components/auth/LanguageToggle'

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex" style={{ background: 'var(--background)' }}>
      <LanguageToggle className="absolute top-4 z-30" style={{ insetInlineEnd: '1rem' }} />
      <div className="hidden lg:block" style={{ width: '42%' }}>
        <AuthLeftPanel mode="register" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden"
        style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md relative z-10">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
