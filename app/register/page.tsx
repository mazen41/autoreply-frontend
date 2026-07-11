import { Suspense } from 'react'
import AuthLeftPanel from '../../components/auth/AuthLeftPanel'
import RegisterForm from '../../components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#050505' }}>
      <div className="hidden lg:block" style={{ width: '42%' }}>
        <AuthLeftPanel mode="register" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden"
        style={{ background: '#050505' }}>
        <div className="absolute pointer-events-none" style={{
          bottom: '-100px', left: '-100px', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(125,249,255,0.04) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div className="w-full max-w-md relative z-10">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
