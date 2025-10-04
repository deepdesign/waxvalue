'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const setupSchema = z.object({
  verifierCode: z.string().optional(),
})

type SetupFormData = z.infer<typeof setupSchema>

export function SetupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const [requestToken, setRequestToken] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  })

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/backend/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to setup authentication')
      }

      const result = await response.json()
      setAuthUrl(result.authUrl)
      setRequestToken(result.requestToken)
      setCurrentStep(2)
      toast.success('Ready to authorize with Discogs!')
    } catch (error) {
      toast.error('Failed to setup authentication. Please try again.')
      console.error('Setup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDiscogs = () => {
    if (authUrl) {
      window.open(authUrl, '_blank')
      setCurrentStep(3)
      toast.success('Please complete authorization on Discogs and return here.')
    }
  }

  const handleVerify = async (data: SetupFormData) => {
    if (!data.verifierCode) {
      toast.error('Please enter the verification code from Discogs')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/backend/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestToken,
          verifierCode: data.verifierCode,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify authorization')
      }

      const result = await response.json()
      
      // Store user data in context/localStorage
      localStorage.setItem('waxvalue_user', JSON.stringify(result.user))
      
      setCurrentStep(4)
      toast.success('Account linked successfully!')
      
      // Auto-redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      toast.error('Failed to verify authorization. Please check your verification code.')
      console.error('Verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="ml-2 text-2xl font-semibold text-gray-900">WaxValue</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Connect to Discogs</h2>
          <p className="mt-2 text-sm text-gray-600">
            Link your Discogs account to enable automated pricing suggestions
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to connect
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  WaxValue needs permission to access your Discogs account to provide automated pricing suggestions.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Secure authorization</p>
                    <p>You'll be redirected to Discogs to authorize WaxValue. No credentials required.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  'Connect to Discogs'
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Authorize WaxValue
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Click the button below to visit Discogs and authorize WaxValue to access your account.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <ArrowRightIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Next step</p>
                    <p>You'll be redirected to Discogs to complete the authorization.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleOpenDiscogs}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verify Authorization
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Enter the verification code you received from Discogs after authorizing WaxValue.
                </p>
              </div>

              <div>
                <label htmlFor="verifierCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  {...register('verifierCode')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter verification code"
                />
                {errors.verifierCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.verifierCode.message}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </form>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Setup Complete!
                </h3>
                <p className="text-sm text-gray-600">
                  Your Discogs account is now linked to WaxValue. We're fetching your inventory 
                  and will redirect you to the dashboard shortly.
                </p>
              </div>

              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
