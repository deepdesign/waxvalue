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
        // Add retry logic for first-time auth (localStorage might not be ready immediately)
        let requestToken = localStorage.getItem('discogs_request_token')
        let requestTokenSecret = localStorage.getItem('discogs_request_token_secret')
        
        // If tokens not found, wait a bit and retry (handles race condition on first auth)
        if (!requestToken || !requestTokenSecret) {
          console.log('Tokens not found immediately, retrying...')
          await new Promise(resolve => setTimeout(resolve, 100))
          requestToken = localStorage.getItem('discogs_request_token')
          requestTokenSecret = localStorage.getItem('discogs_request_token_secret')
        }
        
        // Also check sessionStorage as fallback
        if (!requestToken || !requestTokenSecret) {
          requestToken = sessionStorage.getItem('discogs_request_token') || requestToken
          requestTokenSecret = sessionStorage.getItem('discogs_request_token_secret') || requestTokenSecret
        }
        
        // Retrieved tokens for OAuth flow
        console.log('Retrieved tokens:', {
          token: requestToken ? `${requestToken.substring(0, 10)}...` : 'null',
          secret: requestTokenSecret ? `${requestTokenSecret.substring(0, 10)}...` : 'null'
        })
        
        if (!requestToken || !requestTokenSecret) {
          // Don't show error immediately - try to proceed with verification anyway
          // The backend might handle it, or we can use oauth_token from URL
          console.warn('No request token found in storage, but proceeding with verification attempt')
          // Continue anyway - the backend will handle the error if tokens are truly missing
        }

        // Helper function to handle success (defined early so it can be used in retry logic)
        const handleSuccess = (result: any) => {
          // Debug logging
          console.log('OAuth result processed successfully')

          // Update user state in both localStorage and React context
          localStorage.setItem('waxvalue_user', JSON.stringify(result.user))
          setUser(result.user) // Update React context immediately
          
          // Clear the stored request tokens
          localStorage.removeItem('discogs_request_token')
          localStorage.removeItem('discogs_request_token_secret')
          sessionStorage.removeItem('discogs_request_token')
          sessionStorage.removeItem('discogs_request_token_secret')

          setStatus('success')
          setMessage(`Successfully connected to Discogs as ${result.user.username}`)

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
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
        // Only send tokens if we have them - backend will handle missing tokens
        const verifyPayload: any = {
          verifierCode: oauthVerifier,
        }
        
        if (requestToken && requestTokenSecret) {
          verifyPayload.requestToken = requestToken
          verifyPayload.requestTokenSecret = requestTokenSecret
        } else if (oauthToken) {
          // Use oauth_token from URL as fallback
          verifyPayload.requestToken = oauthToken
          console.log('Using oauth_token from URL as fallback')
        }

        const response = await fetch(`/api/backend/auth/verify?session_id=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        })

        if (!response.ok) {
          // Try to parse error response, with better error handling
          let errorData: any = {}
          try {
            const text = await response.text()
            errorData = text ? JSON.parse(text) : {}
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
            errorData = { detail: `Server returned ${response.status}: ${response.statusText}` }
          }
          
          console.error('Verification failed:', response.status, errorData)
          
          // Provide more specific error message
          const errorMessage = errorData.detail || errorData.error || `Failed to verify authorisation: ${response.status}`
          
          // If error is about missing tokens but we have oauth_token, try one more time
          if ((!requestToken || !requestTokenSecret) && oauthToken && errorMessage.includes('token')) {
            console.log('Retrying with oauth_token from URL...')
            const retryResponse = await fetch(`/api/backend/auth/verify?session_id=${sessionId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requestToken: oauthToken,
                verifierCode: oauthVerifier,
                // Note: We don't have the secret, but let backend try
              }),
            })
            
            if (retryResponse.ok) {
              const result = await retryResponse.json()
              // Success on retry - continue with success flow
              handleSuccess(result)
              return
            }
            
            // If retry also failed, get the error message
            try {
              const retryText = await retryResponse.text()
              const retryError = retryText ? JSON.parse(retryText) : {}
              throw new Error(retryError.detail || retryError.error || errorMessage)
            } catch (retryParseError) {
              throw new Error(errorMessage)
            }
          }
          
          throw new Error(errorMessage)
        }

        const result = await response.json()
        
        // Call success handler
        handleSuccess(result)

      } catch (error) {
        // Auth callback error - handled by UI
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

