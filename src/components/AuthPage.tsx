'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useApp } from './Providers'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const { setUser } = useApp()
  const router = useRouter()

  const handleAuthSuccess = (user: any) => {
    setUser(user)
    router.push('/dashboard')
  }

  const switchToRegister = () => {
    setAuthMode('register')
  }

  const switchToLogin = () => {
    setAuthMode('login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-6 left-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600">WaxValue</h1>
            <p className="text-lg text-gray-600 mt-2">Smart Discogs Pricing</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {authMode === 'login' ? (
          <LoginForm 
            onSwitchToRegister={switchToRegister}
            onLoginSuccess={handleAuthSuccess}
          />
        ) : (
          <RegisterForm 
            onSwitchToLogin={switchToLogin}
            onRegisterSuccess={handleAuthSuccess}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          By using WaxValue, you agree to our{' '}
          <a href="/terms" className="text-primary-600 hover:text-primary-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary-600 hover:text-primary-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
