'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LinkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useApp } from './Providers'

const setupSchema = z.object({
  verifierCode: z.string().min(1, 'Verification code is required'),
})

type SetupFormData = z.infer<typeof setupSchema>

interface OAuthState {
  authUrl: string
  requestToken: string
  requestTokenSecret: string
}

export function SetupWizard() {
  const router = useRouter()
  const { user, setUser } = useApp()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthState, setOAuthState] = useState<OAuthState | null>(null)
  const [discogsUser, setDiscogsUser] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  })

  // Check if user is already connected to Discogs
  useEffect(() => {
    if (user?.discogsUserId) {
      // User is already connected, redirect to dashboard
      router.push('/dashboard')
    }
  }, [user, router])

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('waxvalue_token')
      if (!token) {
        throw new Error('No authentication token found. Please log in first.')
      }

      const response = await fetch('/api/backend/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to setup authentication')
      }

      const result = await response.json()
      
      setOAuthState({
        authUrl: result.authUrl,
        requestToken: result.requestToken,
        requestTokenSecret: result.requestTokenSecret || '',
      })
      
      setCurrentStep(2)
      toast.success('Ready to authorize with Discogs!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup authentication'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Setup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDiscogs = () => {
    if (oauthState?.authUrl) {
      window.open(oauthState.authUrl, '_blank')
      setCurrentStep(3)
      toast.success('Please complete authorization on Discogs and return here.')
    }
  }

  const handleVerify = async (data: SetupFormData) => {
    if (!data.verifierCode) {
      toast.error('Please enter the verification code from Discogs')
      return
    }

    if (!oauthState) {
      toast.error('OAuth state not found. Please restart the setup process.')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('waxvalue_token')
      if (!token) {
        throw new Error('No authentication token found. Please log in first.')
      }

      const response = await fetch('/api/backend/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestToken: oauthState.requestToken,
          verifierCode: data.verifierCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to verify authorization')
      }

      const result = await response.json()
      
      // Update user data in context and localStorage
      const updatedUser = { ...user, ...result.user }
      setUser(updatedUser)
      localStorage.setItem('waxvalue_user', JSON.stringify(updatedUser))
      
      setDiscogsUser(result.discogsUser)
      setCurrentStep(4)
      toast.success('Account linked successfully!')
      
      // Auto-redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify authorization'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setCurrentStep(1)
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">WaxValue</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Connect to Discogs</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Link your Discogs account to enable automated pricing suggestions and market analysis
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Setup' },
              { step: 2, label: 'Authorize' },
              { step: 3, label: 'Verify' }
            ].map(({ step, label }, index) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                    step <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 2 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100% - 2.5rem)', marginLeft: '1.25rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Setup Error</p>
                <p>{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-red-600 hover:text-red-800 font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to connect
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  WaxValue needs permission to access your Discogs account to provide automated pricing suggestions and market analysis.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Secure OAuth authorization</p>
                      <p>You&apos;ll be redirected to Discogs to authorize WaxValue. No passwords are shared.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">What we&apos;ll access</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Your inventory listings</li>
                        <li>• Market price data</li>
                        <li>• Update listing prices (with your approval)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up connection...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-5 w-5 mr-2" />
                    Connect to Discogs
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightIcon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Authorize WaxValue
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Click the button below to visit Discogs and authorize WaxValue to access your account.
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Authorization required</p>
                    <p>You&apos;ll be redirected to Discogs to complete the authorization process.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleOpenDiscogs}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  Continue to Discogs
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleSubmit(handleVerify)} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Verify Authorization
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Enter the verification code you received from Discogs after authorizing WaxValue.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium">Where to find the code</p>
                    <p>After authorizing WaxValue on Discogs, you&apos;ll see a verification code on the confirmation page.</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="verifierCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  {...register('verifierCode')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg font-mono tracking-wider"
                  placeholder="Enter verification code"
                  autoComplete="off"
                />
                {errors.verifierCode && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.verifierCode.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Complete Setup
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Setup Complete! 🎉
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your Discogs account is now successfully linked to WaxValue.
                </p>
                {discogsUser && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Connected as:</span> {discogsUser.username}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  We&apos;re fetching your inventory and will redirect you to the dashboard shortly.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-gray-600">Loading dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
