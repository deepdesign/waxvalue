'use client'

import { useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export function LandingHeroSplit4() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectDiscogs = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/backend/auth/setup', { method: 'POST' })
      const data = await response.json()
      if (data.authUrl) {
        localStorage.setItem('discogs_request_token', data.requestToken)
        localStorage.setItem('discogs_request_token_secret', data.requestTokenSecret)
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Failed to start OAuth:', error)
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Content */}
        <div className="flex items-center px-8 lg:px-16 py-8 lg:py-12">
          <div className="max-w-xl animate-fade-in-up mt-0 lg:-mt-28">
            {/* Logo */}
            <div className="mb-6 lg:mb-12">
              <img 
                src="/svg/light/waxvalue-horizontal-light.svg"
                alt="waxvalue"
                className="h-20 lg:h-24 w-auto dark:hidden"
              />
              <img 
                src="/svg/dark/waxvalue-horizontal-dark.svg"
                alt="waxvalue"
                className="h-20 lg:h-24 w-auto hidden dark:block"
              />
            </div>

            {/* Main content */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6 lg:mb-10 animate-bounce-slow">
              🎵 Smart Pricing for Record Sellers
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-6 lg:mb-10 leading-tight tracking-tight">
              Keep your Discogs prices{' '}
              <span className="gradient-text-animated">
                market-perfect
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 lg:mb-12">
              Scan your entire catalogue for mispriced items and update them in bulk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleConnectDiscogs}
                disabled={isConnecting}
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting to Discogs...
                    </>
                  ) : (
                    <>
                      Connect Discogs
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              🔒 Secure OAuth • No password required • Free to start
            </p>
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="relative bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900 flex items-center justify-center overflow-hidden">
          {/* Hero image - full bleed */}
          <div className="absolute inset-0">
            <img 
              src="/images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg"
              alt="Vinyl records collection"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Gradient overlay for better text contrast if needed */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10"></div>
          
          {/* Floating elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full animate-float"></div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-0 left-0 right-0 py-4 px-8">
        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Deep Design Australia Pty Ltd. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
        @keyframes gradient-shift {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .gradient-text-animated {
          background: linear-gradient(90deg, #dc2626, #9333ea, #3b82f6, #dc2626);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: gradient-shift 4s linear infinite;
        }
      `}</style>
    </div>
  )
}


