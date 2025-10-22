'use client'

import { useEffect } from 'react'

export function LoadingSpinner() {
  // Preload landing page images while loading spinner is showing
  useEffect(() => {
    const unsplashImages = [
      '/images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg',
      '/images/julian-lates-aiXhMfF_8_k-unsplash.jpg',
      '/images/matteo-panara-EMp3qGdtbKE-unsplash.jpg',
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
      // Preload completed silently
    })
  }, [])

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
            <path className="wave-line wave-line-8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10a1,1,0,0,0-1-1H42.91Z"/>
            <path className="wave-line wave-line-9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"/>
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading Waxvalue...</p>
      </div>
    </div>
  )
}
