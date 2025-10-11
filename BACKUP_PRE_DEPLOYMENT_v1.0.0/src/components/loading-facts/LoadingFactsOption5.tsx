'use client'

import { useState, useEffect } from 'react'

const VINYL_FACTS = [
  "🎵 Vinyl sales hit 40M units in 2022",
  "💿 Market valued at $1.2 billion",
  "📈 Growing for 17 consecutive years",
  "💰 Beatles' butcher cover sold for $125k",
  "🔥 Rare vinyl appreciates 8-12% annually",
  "⚡ Plants produce 1,000 records/day",
  "🎯 1 in 4 collectors owns 500+ records",
  "✨ Picture discs command 300-500% premiums",
  "📀 LP grooves stretch 1,500 feet unwound",
  "🏆 Rarest: The Quarrymen at Home - $250k+"
]

export function LoadingFactsOption5() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [processed, setProcessed] = useState(234)
  const [progress, setProgress] = useState(58)

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setScrollPosition((prev) => (prev >= 2000 ? 0 : prev + 1))
    }, 30)

    const countInterval = setInterval(() => {
      setProcessed((prev) => (prev >= 400 ? 234 : prev + 2))
    }, 100)

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 58 : prev + 0.5))
    }, 100)

    return () => {
      clearInterval(scrollInterval)
      clearInterval(countInterval)
      clearInterval(progressInterval)
    }
  }, [])

  const remaining = 401 - processed

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        {/* Main Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              ANALYZING YOUR COLLECTION
            </h3>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-right text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">
                {Math.round(progress)}%
              </p>
            </div>

            {/* Item Counts */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {processed} items processed
              </span>
              <span>•</span>
              <span className="text-gray-500">
                {remaining} to go
              </span>
            </div>
          </div>
        </div>

        {/* Scrolling Ticker */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-300 dark:border-gray-600 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
          
          <div className="relative h-16 flex items-center overflow-hidden">
            <div
              className="flex gap-8 whitespace-nowrap px-4"
              style={{
                transform: `translateX(-${scrollPosition}px)`,
                transition: 'transform 0.03s linear'
              }}
            >
              {/* Repeat facts to create seamless loop */}
              {[...VINYL_FACTS, ...VINYL_FACTS, ...VINYL_FACTS].map((fact, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {fact}
                  </span>
                  {index < VINYL_FACTS.length * 3 - 1 && (
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                  )}
                </div>
              ))}
            </div>

            {/* Gradient Fade on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-600 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
        </div>

        {/* Subtitle */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Fun facts while we scan your collection 🎵
        </p>
      </div>
    </div>
  )
}

