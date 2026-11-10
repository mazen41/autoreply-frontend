import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from '../../components/auth/LoginForm'
import RegisterForm from '../../components/auth/RegisterForm'
import ContextualExplainer from '../../components/dashboard/ContextualExplainer'

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('../../lib/LangContext', () => ({
  useLang: () => ({
    isRTL: false,
    lang: 'en',
    toggleLang: vi.fn(),
    t: {
      auth: {
        login: 'Login',
        register: 'Sign Up',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Name',
        forgotPassword: 'Forgot password?',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        loginSuccess: 'Login successful',
        registerSuccess: 'Account created successfully',
        loginError: 'Login failed',
        registerError: 'Account creation failed',
        welcomeBack: 'Welcome back',
        loginToAccess: 'Sign in to access your business command center',
        invalidPassword: 'Password must be at least 8 characters',
        passwordsMismatch: 'Passwords do not match',
      },
    },
  }),
}))

describe('Redesigned Authentication & Onboarding Experience Tests', () => {
  beforeEach(() => {
    navigation.replace.mockReset()
    navigation.push.mockReset()
    vi.stubGlobal('fetch', vi.fn())
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  describe('LoginForm', () => {
    it('renders all essential login elements with refined SaaS layout', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeTruthy()
      expect(screen.getByLabelText(/password/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
      expect(screen.getByText(/remember me on this device/i)).toBeTruthy()
      expect(screen.getByText(/forgot password\?/i)).toBeTruthy()
    })

    it('validates email field on submission if empty or invalid', async () => {
      render(<LoginForm />)

      const submitBtn = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(/this field is required/i)).toBeTruthy()
      })
    })

    it('submits credentials and redirects to /onboarding for new users', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'test-naz-token',
          user: { id: 1, name: 'Merchant', onboarding_completed: false },
        }),
      } as Response)

      delete (window as any).location
      ;(window as any).location = { href: '', protocol: 'http:', pathname: '/login', search: '' }

      render(<LoginForm />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@merchant.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'SecurePass123!' } })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('test@merchant.com'),
          })
        )
        expect(window.location.href).toBe('/onboarding')
      })
    })
  })

  describe('RegisterForm', () => {
    it('renders registration form with 14-day trial selected by default', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/name/i)).toBeTruthy()
      expect(screen.getByLabelText(/email/i)).toBeTruthy()
      expect(screen.getByLabelText(/^password$/i)).toBeTruthy()
      expect(screen.getByLabelText(/confirm password/i)).toBeTruthy()
      expect(screen.getByText(/14-day free trial/i)).toBeTruthy()
    })

    it('evaluates password strength and verifies matching password confirmation', async () => {
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'StrongPass99!' } })
      await waitFor(() => {
        expect(screen.getByText(/password strength:/i)).toBeTruthy()
      })

      fireEvent.change(confirmInput, { target: { value: 'StrongPass99!' } })
      await waitFor(() => {
        expect(screen.getByText(/passwords match/i)).toBeTruthy()
      })
    })
  })

  describe('ContextualExplainer', () => {
    it('renders contextual guide content and dismisses on user action', async () => {
      render(
        <ContextualExplainer
          id="test-section"
          title="Workflow Builder"
          whatItDoes="Automates incoming chat routing"
          whyItMatters="Saves hours of support time"
          whatYouCanDo="Create if-then triggers"
          whatHappensNext="Runs 24/7 on incoming chats"
          actionLabel="Create Workflow"
        />
      )

      expect(screen.getByText('Workflow Builder')).toBeTruthy()
      expect(screen.getByText('Automates incoming chat routing')).toBeTruthy()
      expect(screen.getByText('Saves hours of support time')).toBeTruthy()
      expect(screen.getByText('Create if-then triggers')).toBeTruthy()

      const dismissBtn = screen.getByTitle(/dismiss guide/i)
      fireEvent.click(dismissBtn)

      await waitFor(() => {
        expect(screen.queryByText('Workflow Builder')).toBeNull()
        expect(window.localStorage.getItem('naz_explainer_v2_test-section')).toBe('true')
      })
    })
  })
})
