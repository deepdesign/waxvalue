'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, ShieldCheckIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

export function WelcomePage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  const handleConnectDiscogs = async () => {
    setIsConnecting(true)
    
    try {
      // Initiate Discogs OAuth flow
      const response = await fetch('/api/backend/auth/setup', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.authUrl) {
        // Store OAuth tokens for callback (session will be created after auth)
        localStorage.setItem('discogs_request_token', data.requestToken)
        localStorage.setItem('discogs_request_token_secret', data.requestTokenSecret)
        
        console.log('Stored OAuth tokens, redirecting to Discogs...')
        
        // Redirect to Discogs authorization
        window.location.href = data.authUrl
      } else {
        console.error('No auth URL received:', data)
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('Failed to start OAuth:', error)
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src="/svg/light/waxvalue-horizontal-light.svg" 
                alt="WaxValue" 
                className="h-24 w-auto"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Keep your Discogs prices{' '}
              <span className="text-primary-600">in sync</span> with the market
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A consumer-friendly web app that checks your Discogs listings against wider marketplace data 
              and suggests price changes. You stay in control, but prices can be updated automatically.
            </p>
            <Button
              onClick={handleConnectDiscogs}
              loading={isConnecting}
              loadingText="Connecting to Discogs..."
              variant="gradient"
              size="lg"
              className="inline-flex items-center gap-2 btn-hover-scale"
              aria-label="Continue with Discogs"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Continue with Discogs
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                We need access to check your listings and suggest updated prices. You never share your password, 
                only a secure token.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Market-Driven Pricing</h3>
              <p className="text-gray-600">
                Suggestions come from wider Discogs data, factoring in media and sleeve condition 
                to give you competitive pricing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CogIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Control</h3>
              <p className="text-gray-600">
                Changes are only applied when you confirm them. Review all suggestions in a 
                clear table before making any updates.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg">
                1
              </div>
                <h3 className="font-semibold text-gray-900 mb-2">Connect Discogs</h3>
                <p className="text-sm text-gray-600">Link your Discogs account securely using OAuth</p>
              </div>
              
              <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg">
                2
              </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fetch Inventory</h3>
                <p className="text-sm text-gray-600">We analyze your current listings and market data</p>
              </div>
              
              <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg">
                3
              </div>
                <h3 className="font-semibold text-gray-900 mb-2">Review Suggestions</h3>
                <p className="text-sm text-gray-600">See recommended price changes with clear reasoning</p>
              </div>
              
              <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg">
                4
              </div>
                <h3 className="font-semibold text-gray-900 mb-2">Apply Changes</h3>
                <p className="text-sm text-gray-600">Approve changes individually or in bulk</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to optimize your Discogs pricing?</h2>
          <p className="text-gray-600 mb-8">Connect your Discogs account to get started in seconds.</p>
          <Button
            onClick={handleConnectDiscogs}
            loading={isConnecting}
            loadingText="Connecting to Discogs..."
            variant="gradient"
            size="lg"
            className="inline-flex items-center gap-2 btn-hover-scale"
            aria-label="Continue with Discogs"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Continue with Discogs
          </Button>
        </div>
      </div>
    </div>
  )
}
