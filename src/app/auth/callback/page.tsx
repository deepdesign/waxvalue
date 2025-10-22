'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useApp } from '@/components/Providers'

// Force dynamic rendering - don't pre-render this page
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useApp()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double execution
      if (hasProcessed.current) {
        return
      }
      hasProcessed.current = true
      try {
        // Get the OAuth verifier from URL parameters
        const oauthVerifier = searchParams.get('oauth_verifier')
        const oauthToken = searchParams.get('oauth_token')

        if (!oauthVerifier) {
          throw new Error('No OAuth verifier found in callback URL')
        }

        // Get the stored request token and secret from localStorage
        const requestToken = localStorage.getItem('discogs_request_token')
        const requestTokenSecret = localStorage.getItem('discogs_request_token_secret')
        
        // Retrieved tokens from localStorage
        
        if (!requestToken || !requestTokenSecret) {
          throw new Error('No request token found. Please try connecting again.')
        }

        // Get or create session ID
        let sessionId = localStorage.getItem('waxvalue_session_id')
        if (!sessionId || sessionId === 'undefined') {
          // First-time OAuth from home page - create new session ID
          // Generate a URL-safe random string (similar to Python's secrets.token_urlsafe)
          const randomBytes = new Uint8Array(32)
          crypto.getRandomValues(randomBytes)
          sessionId = btoa(String.fromCharCode(...randomBytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
          
          localStorage.setItem('waxvalue_session_id', sessionId)
          // Created new session ID for OAuth flow
        }

        // Verify the authorisation with the backend
        const response = await fetch(`/api/backend/auth/verify?session_id=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestToken: requestToken,
            requestTokenSecret: requestTokenSecret,
            verifierCode: oauthVerifier,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Verification failed:', response.status, errorData)
          throw new Error(errorData.detail || `Failed to verify authorisation: ${response.status}`)
        }

        const result = await response.json()
        
        // Debug logging
        // OAuth result processed successfully

        // Update user state in both localStorage and React context
        localStorage.setItem('waxvalue_user', JSON.stringify(result.user))
        setUser(result.user) // Update React context immediately
        
        // Clear the stored request tokens
        localStorage.removeItem('discogs_request_token')
        localStorage.removeItem('discogs_request_token_secret')

        setStatus('success')
        setMessage(`Successfully connected to Discogs as ${result.user.username}`)

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to complete authorisation')
      }
    }

    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Completing authorisation...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we complete your Discogs authorisation.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Authorisation Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Authorisation Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/settings')}
                  variant="primary"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

