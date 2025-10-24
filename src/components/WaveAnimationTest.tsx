'use client'

import { useState } from 'react'

export function WaveAnimationTest() {
  const [showTest, setShowTest] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Test Controls */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setShowTest(!showTest)}
          className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          {showTest ? 'Hide' : 'Show'} Wave Test
        </button>
      </div>

      {/* Animated waves - using the same working implementation from dashboard */}
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="relative mb-8">
          <svg className="wave-svg" style={{height: '120px', width: '120px'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 38.05">
            <path className="wave-line wave-line-1" d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"/>
            <path className="wave-line wave-line-2" d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"/>
            <path className="wave-line wave-line-3" d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1A1,1,0,0,0,12.91,0Z"/>
            <path className="wave-line wave-line-4" d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11A1,1,0,0,0,18.91,10Z"/>
            <path className="wave-line wave-line-5" d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16A1,1,0,0,0,24.91,15Z"/>
            <path className="wave-line wave-line-6" d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11A1,1,0,0,0,30.91,10Z"/>
            <path className="wave-line wave-line-7" d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1A1,1,0,0,0,36.91,0Z"/>
            <path className="wave-line wave-line-8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,42.91,9Z"/>
            <path className="wave-line wave-line-9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16A1,1,0,0,0,48.91,15Z"/>
          </svg>
        </div>
      </div>

      {/* Test Info */}
      {showTest && (
        <div className="absolute top-20 left-4 z-50 bg-black/50 backdrop-blur-sm text-white p-4 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Wave Animation Test</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Wave 1: 20s ease-in-out infinite</li>
            <li>✅ Wave 2: 25s ease-in-out infinite (delayed)</li>
            <li>✅ Hardware acceleration enabled</li>
            <li>✅ Backface visibility hidden</li>
            <li>✅ Optimized SVG rendering</li>
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6">
            Wave Animation Test
          </h1>
          <p className="text-xl lg:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
            Check if the wave animation is smooth and not corrupted
          </p>
        </div>
      </div>

    </div>
  )
}
