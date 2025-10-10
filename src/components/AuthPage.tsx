'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from './Providers'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { Logo } from './Logo'

export function AuthPage() {
  const { setUser } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleAuthSuccess = (user: any) => {
    setUser(user)
    // Store user in localStorage
    localStorage.setItem('waxvalue_user', JSON.stringify(user))
    // Redirect to dashboard
    router.push('/dashboard')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-6 left-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo variant="vertical" size="lg" />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Get started with WaxValue today'
              }
            </p>
          </div>
          
          {mode === 'login' ? (
            <LoginForm 
              onAuthSuccess={handleAuthSuccess} 
              onSwitchToSignup={switchMode}
            />
          ) : (
            <SignupForm 
              onAuthSuccess={handleAuthSuccess} 
              onSwitchToLogin={switchMode}
            />
          )}
        </div>
      </div>
      
      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        By using WaxValue, you agree to our{' '}
        <Link href="/terms" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}