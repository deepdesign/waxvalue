'use client'

import { useState } from 'react'
import {
  LoadingFactsOption1,
  LoadingFactsOption2,
  LoadingFactsOption3,
  LoadingFactsOption5,
} from '@/components/loading-facts'

const loadingOptions = [
  {
    id: 'option-1',
    name: 'Gradient Carousel',
    component: LoadingFactsOption1,
    description: 'Modern gradient card with sliding facts and progress dots. Clean and elegant.',
  },
  {
    id: 'option-2',
    name: 'Rotating Vinyl Record',
    component: LoadingFactsOption2,
    description: 'Spinning vinyl record with pulsing grooves. Thematic and engaging.',
  },
  {
    id: 'option-3',
    name: 'Card Flip Stack',
    component: LoadingFactsOption3,
    description: 'Cards that flip like browsing vinyl in a crate. Interactive 3D effect.',
  },
  {
    id: 'option-5',
    name: 'Minimalist Ticker',
    component: LoadingFactsOption5,
    description: 'Clean ticker with scrolling facts. Subtle and professional.',
  },
]

export default function LoadingFactsPreviewPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  if (selectedOption) {
    const option = loadingOptions.find((o) => o.id === selectedOption)
    const Component = option?.component

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Back button */}
        <button
          onClick={() => setSelectedOption(null)}
          className="fixed top-4 left-4 z-50 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          ← Back to Gallery
        </button>

        {/* Option name indicator */}
        <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {option?.name}
          </span>
        </div>

        {/* Full Preview */}
        <div className="pt-20">
          {Component && <Component />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Loading facts gallery
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Choose your favourite loading indicator design
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These will display while processing user inventory (30-60 seconds)
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {loadingOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left"
            >
              {/* Preview Container */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center relative overflow-hidden p-4">
                {/* Render small preview */}
                <div className="transform scale-75">
                  {option.id === 'option-1' && (
                    <div className="w-full h-48 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-xl">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎵</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Gradient Card</div>
                        <div className="flex gap-1 mt-3 justify-center">
                          <div className="w-6 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {option.id === 'option-2' && (
                    <div className="text-center">
                      <svg className="w-32 h-32 mx-auto animate-spin-slow" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="#1a1a1a" stroke="#666" strokeWidth="1" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#333" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="25" fill="none" stroke="#333" strokeWidth="0.5" />
                        <circle cx="50" cy="50" r="12" fill="#dc2626" />
                        <circle cx="50" cy="50" r="3" fill="#666" />
                      </svg>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Spinning Vinyl</div>
                    </div>
                  )}
                  {option.id === 'option-3' && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600 rounded-lg transform rotate-3 opacity-30"></div>
                      <div className="absolute inset-0 bg-gray-400 dark:bg-gray-700 rounded-lg transform rotate-1 opacity-50"></div>
                      <div className="relative w-64 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4">
                        <div className="text-2xl mb-2">💿</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">VINYL FACT #1</div>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">Flipping Cards</div>
                      </div>
                    </div>
                  )}
                  {option.id === 'option-5' && (
                    <div className="w-80">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl mb-2">
                        <div className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-2"></div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">58% Complete</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-xl overflow-hidden">
                        <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          🎵 Vinyl facts • Market data • Stats...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary-600/10 dark:bg-primary-400/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-6 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-semibold shadow-xl">
                  Preview →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📋 Implementation Notes
            </h2>
            <div className="text-left text-gray-600 dark:text-gray-300 space-y-4 text-sm">
              <p>
                <strong className="text-gray-900 dark:text-white">10 Curated Facts:</strong> Each design rotates through interesting vinyl collecting trivia every 8 seconds.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Real-time Progress:</strong> Shows actual inventory processing status with item counts and percentage.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Smooth Animations:</strong> Gradient shifts, fades, and transitions keep users engaged during 30-60 second loads.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Responsive:</strong> All designs work beautifully on mobile and desktop.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Recommendation:</strong> Option 1 (Gradient Carousel) or Option 5 (Minimalist Ticker) are most versatile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  )
}

