'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useApp } from './Providers'

const discogsSchema = z.object({
  verifierCode: z.string().optional(),
})

type DiscogsFormData = z.infer<typeof discogsSchema>

interface SettingsDiscogsProps {
  user?: any
  onConnectionChange?: (connected: boolean) => void
}

export function SettingsDiscogs({ user, onConnectionChange }: SettingsDiscogsProps) {
  const { setUser } = useApp()
  const [isConnected, setIsConnected] = useState(!!user?.discogsUserId)
  const [isLoading, setIsLoading] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const [requestToken, setRequestToken] = useState('')
  const [step, setStep] = useState<'authorize' | 'verify' | 'connected'>(
    isConnected ? 'connected' : 'authorize'
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DiscogsFormData>({
    resolver: zodResolver(discogsSchema),
  })

  const handleGetAuthLink = async () => {
    setIsLoading(true)
    try {
      console.log('SettingsDiscogs: Starting auth setup')
      const token = localStorage.getItem('waxvalue_token')
      console.log('SettingsDiscogs: Token found:', !!token)
      
      const response = await fetch('/api/backend/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      
      console.log('SettingsDiscogs: Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('SettingsDiscogs: Error response:', errorText)
        throw new Error('Failed to setup authentication')
      }

      const responseText = await response.text()
      console.log('SettingsDiscogs: Raw response:', responseText)
      
      const result = JSON.parse(responseText)
      console.log('SettingsDiscogs: Parsed result:', result)
      
      setAuthUrl(result.authUrl)
      setRequestToken(result.requestToken)
      setStep('authorize')
      toast.success('Ready to authorize with Discogs!')
    } catch (error) {
      toast.error('Failed to setup authentication. Please try again.')
      console.error('Auth setup error details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDiscogs = () => {
    if (authUrl) {
      window.open(authUrl, '_blank')
      setStep('verify')
      toast.success('Please complete authorization on Discogs and return here.')
    }
  }

  const handleVerify = async (data: DiscogsFormData) => {
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
      
      // Update global user state
      setUser(result.user)
      localStorage.setItem('waxvalue_user', JSON.stringify(result.user))
      
      // Update local state
      setIsConnected(true)
      setStep('connected')
      
      // Notify parent component
      onConnectionChange?.(true)
      toast.success('Account linked successfully!')
    } catch (error) {
      toast.error('Failed to verify authorization. Please check your verification code.')
      console.error('Verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Discogs account? This will stop all automated pricing.')) {
      return
    }

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

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('waxvalue_user')
        localStorage.removeItem('waxvalue_token')
        
        // Update local state
        setIsConnected(false)
        setStep('authorize')
        
        // Update global user state with disconnected user
        const disconnectedUser = { ...user, discogsUserId: null }
        setUser(disconnectedUser)
        localStorage.setItem('waxvalue_user', JSON.stringify(disconnectedUser))
        
        // Notify parent component
        onConnectionChange?.(false)
        toast.success('Account disconnected successfully')
      } else {
        throw new Error('Failed to disconnect account')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect account')
    }
  }

  if (isConnected && user) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Discogs Account</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Connected
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Connected as {user.username}</p>
                <p className="text-xs text-green-600">ID: {user.discogsUserId}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What this means:</p>
                <p>WaxValue can now read your Discogs listings and suggest price updates based on current market data. You maintain full control over all changes.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="btn-outline text-red-600 border-red-300 hover:bg-red-50 w-full inline-flex items-center justify-center"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            Disconnect Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Discogs Account</h3>
        <p className="text-sm text-gray-500">
          Connect your Discogs account to enable automated pricing suggestions
        </p>
      </div>

      {step === 'authorize' && !authUrl && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Ready to connect to Discogs!</p>
                <p>Click the button below to start the authorization process. You&apos;ll be redirected to Discogs to authorize WaxValue to access your account.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGetAuthLink}
            disabled={isLoading}
            className="btn-primary w-full"
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

      {step === 'authorize' && authUrl && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Ready to authorize:</p>
                <p>Click the button below to open Discogs in a new tab and authorize WaxValue to access your account.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenDiscogs}
            className="btn-primary w-full inline-flex items-center justify-center"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Open Discogs
          </button>

          <button
            onClick={() => setStep('authorize')}
            className="btn-outline w-full"
          >
            Back to Credentials
          </button>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleSubmit(handleVerify)} className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Authorization completed!</p>
                <p>You should see a verification code on the Discogs page. Copy and paste it below.</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="verifierCode" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              {...register('verifierCode')}
              type="text"
              className="input-field"
              placeholder="Enter the verification code from Discogs"
            />
            {errors.verifierCode && (
              <p className="mt-1 text-sm text-red-600">{errors.verifierCode.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect Account'
            )}
          </button>

          <button
            onClick={() => setStep('authorize')}
            className="btn-outline w-full"
          >
            Back to Authorization
          </button>
        </form>
      )}
    </div>
  )
}
