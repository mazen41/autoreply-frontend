import { Suspense } from 'react'
import AuthLeftPanel from '../../components/auth/AuthLeftPanel'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <div className="hidden lg:block" style={{ width: '42%' }}>
        <AuthLeftPanel mode="login" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden"
        style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md relative z-10">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
