import AuthLeftPanel from '../../components/auth/AuthLeftPanel'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#050505' }}>
      <div className="hidden lg:block" style={{ width: '42%' }}>
        <AuthLeftPanel mode="login" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden"
        style={{ background: '#050505' }}>
        {/* Subtle background glow */}
        <div className="absolute pointer-events-none" style={{
          top: '-100px', right: '-100px', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198,255,0,0.04) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div className="w-full max-w-md relative z-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
