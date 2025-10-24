'use client'

import { useEffect, memo } from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  fullPage?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  primary: 'border-primary-600 dark:border-primary-400',
  secondary: 'border-gray-600 dark:border-gray-400',
  white: 'border-white'
}

export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  className,
  fullPage = false
}: LoadingSpinnerProps) {
  // Preload landing page images while loading spinner is showing (only for full page)
  useEffect(() => {
    if (!fullPage) return
    
    const unsplashImages = [
      '/images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg',
      '/images/julian-lates-aiXhMfF_8_k-unsplash.jpg',
      '/images/mr-cup-fabien-barral-o6GEPQXnqMY-unsplash.jpg'
    ]

    // Preload all landing page images in parallel
    const preloadPromises = unsplashImages.map(imageSrc => {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve(imageSrc)
        img.onerror = () => reject(imageSrc)
        img.src = imageSrc
      })
    })

    // Start preloading immediately
    Promise.allSettled(preloadPromises).then(results => {
      const successful = results.filter(result => result.status === 'fulfilled').length
      // Removed console.log for production
    })
  }, [fullPage])

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="loader-wave mx-auto mb-4">
            <svg className="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 38.05">
              <title>Audio Wave</title>
              <path className="wave-line wave-line-1" d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"/>
              <path className="wave-line wave-line-2" d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"/>
              <path className="wave-line wave-line-3" d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H12.91Z"/>
              <path className="wave-line wave-line-4" d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H18.91Z"/>
              <path className="wave-line wave-line-5" d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H24.91Z"/>
              <path className="wave-line wave-line-6" d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H30.91Z"/>
              <path className="wave-line wave-line-7" d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H36.91Z"/>
              <path className="wave-line wave-line-8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,42.91,9Z"/>
              <path className="wave-line wave-line-9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"/>
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading Waxvalue...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={clsx(
        'animate-spin rounded-full border-2 border-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
})

// Enhanced loading component with shimmer effect
export const LoadingCard = memo(function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card-base animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
})

// Modern shimmer loading effect
export const ShimmerLoading = memo(function ShimmerLoading({ className }: { className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden', className)}>
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="relative bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
})