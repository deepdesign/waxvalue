'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

export function LandingHeroSplit4() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  // Array of all 4 Unsplash images - memoized to prevent unnecessary re-renders
  const unsplashImages = useMemo(() => [
    '/images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg',
    '/images/julian-lates-aiXhMfF_8_k-unsplash.jpg',
    '/images/matteo-panara-EMp3qGdtbKE-unsplash.jpg',
    '/images/mr-cup-fabien-barral-o6GEPQXnqMY-unsplash.jpg'
  ], [])

  // Preload the selected image to prevent flickering
  useEffect(() => {
    const randomImageIndex = Math.floor(Math.random() * unsplashImages.length)
    const imageToLoad = unsplashImages[randomImageIndex]
    
    // Set the selected image immediately
    setSelectedImage(imageToLoad)
    
    // Preload the image using native HTML Image constructor
    const img = new window.Image()
    img.onload = () => {
      setIsImageLoaded(true)
    }
    img.onerror = () => {
      // Fallback to first image if random selection fails
      setSelectedImage(unsplashImages[0])
      setIsImageLoaded(true)
    }
    img.src = imageToLoad
  }, [unsplashImages])

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
        <div className="flex flex-col justify-between px-8 lg:px-16 py-8 lg:py-12">
          <div className="flex-1 flex items-center">
            <div className="max-w-xl animate-fade-in-up">
            {/* Logo */}
            <div className="mb-6 lg:mb-12">
              <Image 
                src="/svg/light/waxvalue-horizontal-light.svg"
                alt="waxvalue"
                className="h-20 lg:h-24 w-auto dark:hidden"
                width={200}
                height={80}
              />
              <Image 
                src="/svg/dark/waxvalue-horizontal-dark.svg"
                alt="waxvalue"
                className="h-20 lg:h-24 w-auto hidden dark:block"
                width={200}
                height={80}
              />
            </div>

            {/* Main content */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6 lg:mb-10 animate-bounce-slow" role="banner" aria-label="Product tagline">
              🎵 Smart Pricing for Record Sellers
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 dark:text-white mb-6 lg:mb-10 leading-tight tracking-tight text-shadow-sm">
              Keep your Discogs prices{' '}
              <span className="gradient-text-animated" aria-label="market-perfect with animated gradient">
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
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform transform-gpu touch-manipulation min-h-[56px] active:scale-95"
                aria-label={isConnecting ? "Connecting to Discogs, please wait" : "Connect your Discogs account to start pricing analysis"}
                aria-describedby="connect-description"
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
            <p id="connect-description" className="text-sm text-gray-500 dark:text-gray-400">
              🔒 Secure OAuth • No password required • Free to start
            </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="max-w-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Deep Design Australia Pty Ltd. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="relative bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900 flex items-center justify-center overflow-hidden">
          {/* Hero image - full bleed */}
          <div className="absolute inset-0">
            {isImageLoaded && selectedImage ? (
              <Image 
                src={selectedImage}
                alt="Vinyl records collection"
                className="w-full h-full object-cover transition-opacity duration-500"
                width={800}
                height={600}
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-200 via-purple-200 to-pink-200 dark:from-primary-800 dark:via-purple-800 dark:to-pink-800 animate-pulse" />
            )}
          </div>
          
          {/* Gradient overlay for better text contrast if needed */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10"></div>
          
        </div>
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


