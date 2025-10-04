'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, ShieldCheckIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline'

export function WelcomePage() {
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleGetStarted = () => {
    setIsStarting(true)
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">WaxValue</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Keep your Discogs prices{' '}
              <span className="text-primary-600">in sync</span> with the market
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A consumer-friendly web app that checks your Discogs listings against wider marketplace data 
              and suggests price changes. You stay in control, but prices can be updated automatically.
            </p>
            <button
              onClick={handleGetStarted}
              disabled={isStarting}
              className="btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                We need access to check your listings and suggest updated prices. You never share your password, 
                only a secure token.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Market-Driven Pricing</h3>
              <p className="text-gray-600">
                Suggestions come from wider Discogs data, factoring in media and sleeve condition 
                to give you competitive pricing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CogIcon className="h-8 w-8 text-primary-600" />
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
        <div className="py-16 bg-white rounded-2xl shadow-sm">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Connect Discogs</h3>
                <p className="text-sm text-gray-600">Link your Discogs account securely using OAuth</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fetch Inventory</h3>
                <p className="text-sm text-gray-600">We analyze your current listings and market data</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Review Suggestions</h3>
                <p className="text-sm text-gray-600">See recommended price changes with clear reasoning</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
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
          <p className="text-gray-600 mb-8">Join thousands of sellers who keep their prices competitive automatically.</p>
          <button
            onClick={handleGetStarted}
            disabled={isStarting}
            className="btn-primary text-lg px-8 py-3 inline-flex items-center"
          >
            {isStarting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                Get Started Now
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
