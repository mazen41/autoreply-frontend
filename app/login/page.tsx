import { Suspense } from 'react'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthPageLayout mode="login">
        <div className="w-full">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
    </AuthPageLayout>
  )
}
