'use client'

import { useState, useEffect } from 'react'

const VINYL_FACTS = [
  { title: "Most Expensive", text: "The Beatles' \"Yesterday and Today\" sold for $125,000 in 2016" },
  { title: "Market Growth", text: "Vinyl sales have grown for 17 consecutive years since 2006" },
  { title: "Rarest Record", text: "\"The Quarrymen at Home\" - only 50 copies exist at $250k+ each" },
  { title: "Groove Length", text: "A 12\" vinyl groove stretches 1,500 feet when unwound" },
  { title: "Production", text: "Modern plants produce ~1,000 records per day per press machine" },
]

export function LoadingFactsOption3() {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [progress, setProgress] = useState(67)

  useEffect(() => {
    const cardInterval = setInterval(() => {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentCard((prev) => (prev + 1) % VINYL_FACTS.length)
        setIsFlipping(false)
      }, 300)
    }, 8000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 67 : prev + 1))
    }, 150)

    return () => {
      clearInterval(cardInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Card Stack */}
        <div className="relative h-80 mb-8">
          {/* Background Cards (stack effect) */}
          <div className="absolute inset-x-4 inset-y-4 bg-gray-200 dark:bg-gray-700 rounded-2xl transform rotate-2 opacity-30" />
          <div className="absolute inset-x-2 inset-y-2 bg-gray-300 dark:bg-gray-600 rounded-2xl transform rotate-1 opacity-50" />
          
          {/* Main Card */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border-2 border-transparent bg-clip-padding transition-transform duration-300 ${
              isFlipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{
              borderImage: 'linear-gradient(135deg, #06b6d4, #8b5cf6) 1',
            }}
          >
            <div className="p-8 h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">💿</div>
                <div>
                  <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">
                    VINYL FACT #{currentCard + 1}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {VINYL_FACTS[currentCard].title}
                  </p>
                </div>
              </div>

              {/* Fact Content */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-center text-gray-700 dark:text-gray-200 leading-relaxed">
                  {VINYL_FACTS[currentCard].text}
                </p>
              </div>

              {/* Footer */}
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-500/30 dark:border-purple-500/30">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    [{currentCard + 1}/{VINYL_FACTS.length}]
                  </span>
                </div>
              </div>
            </div>

            {/* Gradient Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-2xl animate-spin-slow">⏳</div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Processing inventory...
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {progress}%
                </span>
              </div>
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
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

