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

      {/* Animated waves */}
      <div className="absolute inset-0 overflow-hidden">
        <svg 
          className="absolute bottom-0 w-full h-1/2 animate-wave" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            shapeRendering: 'optimizeSpeed'
          }}
        >
          <path 
            fill="#ffffff" 
            fillOpacity="0.05" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            style={{ 
              vectorEffect: 'non-scaling-stroke',
              shapeRendering: 'optimizeSpeed'
            }}
          />
        </svg>
        <svg 
          className="absolute bottom-0 w-full h-1/2 animate-wave-delayed" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            shapeRendering: 'optimizeSpeed'
          }}
        >
          <path 
            fill="#ffffff" 
            fillOpacity="0.03" 
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            style={{ 
              vectorEffect: 'non-scaling-stroke',
              shapeRendering: 'optimizeSpeed'
            }}
          />
        </svg>
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

      <style jsx>{`
        @keyframes wave {
          0%, 100% { 
            transform: translateX(0) scaleX(1);
            opacity: 0.05;
          }
          50% { 
            transform: translateX(-15%) scaleX(1.1);
            opacity: 0.08;
          }
        }
        @keyframes wave-delayed {
          0%, 100% { 
            transform: translateX(0) scaleX(1);
            opacity: 0.03;
          }
          50% { 
            transform: translateX(15%) scaleX(1.1);
            opacity: 0.06;
          }
        }
        .animate-wave { 
          animation: wave 20s ease-in-out infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          isolation: isolate;
          contain: layout style paint;
        }
        .animate-wave-delayed { 
          animation: wave-delayed 25s ease-in-out infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          isolation: isolate;
          contain: layout style paint;
        }
      `}</style>
    </div>
  )
}
