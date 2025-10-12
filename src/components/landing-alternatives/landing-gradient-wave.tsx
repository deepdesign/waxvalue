'use client'

import { useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export function LandingGradientWave() {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated waves */}
      <div className="absolute inset-0">
        <svg className="absolute bottom-0 w-full h-1/2 animate-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="0.05" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute bottom-0 w-full h-1/2 animate-wave-delayed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="0.03" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl text-center">
          {/* Floating cards background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-64 h-40 bg-white/5 backdrop-blur-sm rounded-2xl rotate-6 animate-float"></div>
            <div className="absolute bottom-32 right-16 w-72 h-48 bg-white/5 backdrop-blur-sm rounded-2xl -rotate-3 animate-float-delayed"></div>
            <div className="absolute top-1/2 right-32 w-48 h-32 bg-white/5 backdrop-blur-sm rounded-2xl rotate-12 animate-float-slower"></div>
          </div>

          <div className="mb-16 animate-zoom-in">
            <img 
              src="/svg/dark/waxvalue-horizontal-dark.svg"
              alt="waxvalue"
              className="h-24 w-auto mx-auto"
            />
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
            Keep your Discogs prices
            <br />
            <span className="gradient-text-animated-wave">
              market-perfect
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-white/80 mb-12 max-w-2xl mx-auto animate-slide-up-delayed">
              Scan your entire catalogue for mispriced items and update them in bulk.
          </p>

          <button
            onClick={handleConnectDiscogs}
            disabled={isConnecting}
            className="group px-10 py-5 bg-white text-purple-900 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting to Discogs...
                </>
              ) : (
                <>
                  Connect with Discogs
                  <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <div className="mt-8 flex items-center justify-center gap-8 text-white/60 text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              Secure OAuth
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              Real-time Updates
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              Free to Start
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-24 relative pb-0 -mb-32">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-t-2xl overflow-hidden shadow-2xl">
              <img 
                src="/images/waxvalue-screenshot-01.png"
                alt="waxvalue Dashboard"
                className="w-full h-auto"
              />
            </div>
            {/* Floating orbs around image */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-purple-500 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-1/4 -right-8 w-20 h-20 bg-pink-500 rounded-full blur-2xl animate-pulse-delayed"></div>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="relative z-10 py-6">
        <p className="text-xs text-center text-white/60">
          © {new Date().getFullYear()} Deep Design Australia Pty Ltd. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
        }
        @keyframes wave-delayed {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(25%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(6deg); }
          50% { transform: translateY(-30px) rotate(6deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-40px) rotate(-3deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-25px) rotate(12deg); }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up-delayed {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gradient-shift {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-wave { animation: wave 15s ease-in-out infinite; }
        .animate-wave-delayed { animation: wave-delayed 20s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-zoom-in { animation: zoom-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out 0.2s both; }
        .animate-slide-up-delayed { animation: slide-up-delayed 0.8s ease-out 0.4s both; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.6s both; }
        .animate-fade-in { animation: fade-in 0.8s ease-out 0.8s both; }
        .gradient-text-animated-wave {
          background: linear-gradient(90deg, #67e8f9, #60a5fa, #a78bfa, #67e8f9);
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

