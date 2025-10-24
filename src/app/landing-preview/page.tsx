'use client'

import { useState } from 'react'
import {
  LandingHeroSplit4,
  LandingGradientWave,
} from '@/components/landing-alternatives'
import { WaveAnimationTest } from '@/components/WaveAnimationTest'

const landingPages = [
  { 
    id: 'hero-split-4', 
    name: 'Hero Split v4', 
    component: LandingHeroSplit4, 
    description: 'Valentino Funghi - artistic overhead shot of records.' 
  },
  { 
    id: 'gradient-wave', 
    name: 'Gradient Wave', 
    component: LandingGradientWave, 
    description: 'Vibrant gradient with animated waves and dashboard screenshot.' 
  },
  { 
    id: 'wave-test', 
    name: 'Wave Animation Test', 
    component: WaveAnimationTest, 
    description: 'Test component to verify wave animation is working correctly.' 
  },
]

export default function LandingPreviewPage() {
  const [selectedPage, setSelectedPage] = useState<string | null>(null)

  if (selectedPage) {
    const page = landingPages.find(p => p.id === selectedPage)
    const Component = page?.component

    return (
      <div className="min-h-screen">
        {/* Back button */}
        <button
          onClick={() => setSelectedPage(null)}
          className="fixed top-4 left-4 z-50 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          ← Back to Gallery
        </button>

        {/* Page name indicator */}
        <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{page?.name}</span>
        </div>

        {/* Preview */}
        {Component && <Component />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Waxvalue landing pages
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Choose your favourite design
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on any design to preview it in full screen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {landingPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page.id)}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Preview thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900 dark:to-purple-900 flex items-center justify-center relative overflow-hidden">
                {/* Visual indicator */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20"></div>
                <div className="text-6xl relative z-10">🎵</div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {page.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {page.description}
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

        <div className="text-center">
          <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              How to use your chosen design
            </h2>
            <ol className="text-left text-gray-600 dark:text-gray-300 space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <div>
                  <span className="font-semibold">Preview each design</span> by clicking on it to see it in full screen
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <span className="font-semibold">Choose your favourite</span> image and layout combination
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <div>
                  <span className="font-semibold">Replace the component</span> in <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">src/app/page.tsx</code>:
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
{`// Replace:
import { WelcomePage } from '@/components/WelcomePage'

// With (example for Hero Split v1):
import { LandingHeroSplit as WelcomePage } 
  from '@/components/landing-alternatives'
  
// Or Hero Split v5 (monochrome):
import { LandingHeroSplit5 as WelcomePage } 
  from '@/components/landing-alternatives'`}
                  </pre>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <div>
                  <span className="font-semibold">That&apos;s it!</span> Your new landing page is live
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
