'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  LinkSlashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface DiscogsConnectionCardProps {
  user?: any
}

export function DiscogsConnectionCard({ user }: DiscogsConnectionCardProps) {
  // User is only truly connected if they have both discogsUserId AND access tokens
  const isConnected = !!user?.discogsUserId && !!user?.accessToken && !!user?.accessTokenSecret
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Check if user has a pending verification (returned from Discogs)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oauthVerifier = urlParams.get('oauth_verifier')
    if (oauthVerifier && !isConnected) {
      // Redirect to callback page to handle the OAuth flow
      window.location.href = `/auth/callback?${window.location.search}`
    }
  }, [isConnected])

  const handleConnectToDiscogs = async () => {
    setIsConnecting(true)
    try {
      // Check if user is logged in
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        throw new Error('No session found. Please login first.')
      }
      
      // Get the authorization URL from the backend (no session required for OAuth setup)
      const response = await fetch('/api/backend/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error: ${response.status}`)
      }

      const result = await response.json()
      
      // Store the request token and secret for later verification
      localStorage.setItem('discogs_request_token', result.requestToken)
      localStorage.setItem('discogs_request_token_secret', result.requestTokenSecret)
      
      console.log('Stored tokens:', {
        token: result.requestToken,
        secret: result.requestTokenSecret
      })
      
      // Redirect to Discogs authorization page in the same window
      window.location.href = result.authUrl
      
    } catch (error: any) {
      console.error('Connection error:', error)
      alert(`Failed to connect to Discogs: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return
    
    setIsVerifying(true)
    try {
      const requestToken = localStorage.getItem('discogs_request_token')
      const requestTokenSecret = localStorage.getItem('discogs_request_token_secret')
      
      if (!requestToken || !requestTokenSecret) {
        throw new Error('No request token found. Please try connecting again.')
      }

      // Get session ID from localStorage
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        throw new Error('No session found. Please login first.')
      }

      const response = await fetch(`/api/backend/auth/verify?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestToken,
          requestTokenSecret,
          verifierCode: verificationCode,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify authorization')
      }

      const result = await response.json()
      
      // Update user state and reload page to show connected state
      window.location.reload()
      
    } catch (error) {
      console.error('Verification error:', error)
      alert('Failed to verify authorization code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Discogs account? This will stop automated pricing suggestions.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        throw new Error('No session found. Please login first.')
      }
      
      const response = await fetch('/api/backend/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect account')
      }

      // Clear local storage and reload page
      localStorage.removeItem('waxvalue_user')
      localStorage.removeItem('discogs_request_token')
      localStorage.removeItem('discogs_request_token_secret')
      window.location.reload()
      
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect account. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Discogs connection</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your Discogs account integration</p>
        </div>
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500" role="img" aria-label="Connected status">
                <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Discogs account</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connected</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Connected as</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">{user.username}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 dark:text-green-300" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Status: Active</h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <ul role="list" className="list-disc space-y-1 pl-5">
                      <li>Automated pricing suggestions enabled</li>
                      <li>Real-time market data access active</li>
                      <li>Bulk pricing updates available</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <LinkSlashIcon className="mr-2 h-4 w-4" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Discogs connection</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Connect your Discogs account to enable automated pricing</p>
      </div>
      <div className="p-6">
        {showVerification ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Complete your connection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Great! You've authorized Waxvalue on Discogs. Enter the verification code below to complete the connection.
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code from Discogs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleVerifyCode}
                disabled={isVerifying || !verificationCode.trim()}
                className="w-full sm:w-auto"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing connection...
                  </>
                ) : (
                  'Complete Connection'
                )}
              </Button>
              
              <button
                onClick={() => setShowVerification(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Start over
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <ExclamationCircleIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Connect your Discogs account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Link your Discogs account to unlock automated pricing suggestions and market analysis. 
              You'll be redirected to Discogs to authorize Waxvalue access to your account.
            </p>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConnectToDiscogs}
                disabled={isConnecting}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Connect to Discogs
                    <ChevronRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>After connecting, you'll receive an authorization code to complete the setup.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
