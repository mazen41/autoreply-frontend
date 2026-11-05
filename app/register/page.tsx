import { Suspense } from 'react'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import RegisterForm from '../../components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthPageLayout mode="register">
        <div className="w-full">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
    </AuthPageLayout>
  )
}
