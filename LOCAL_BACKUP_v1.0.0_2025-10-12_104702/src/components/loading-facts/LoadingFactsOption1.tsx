'use client'

import { useState, useEffect } from 'react'

const VINYL_FACTS = [
  "The Beatles' \"Yesterday and Today\" (butcher cover) sold for $125,000 in 2016.",
  "Vinyl sales have grown for 17 consecutive years, with over 40 million units sold in 2022.",
  "\"The Quarrymen at Home\" - only 50 copies exist, valued at over $250,000 each.",
  "A 12\" vinyl record groove, if unwound, would stretch approximately 1,500 feet.",
  "Modern vinyl pressing plants can produce about 1,000 records per day per press.",
  "Picture disc variants can command 300-500% premiums over standard black vinyl.",
  "A standard 12\" LP can hold approximately 22 minutes of music per side at 33⅓ RPM.",
  "The global vinyl market was $1.2 billion in 2022, projected to reach $2.8 billion by 2030.",
  "1 in 4 collectors owns over 500 records, with average collections valued at $3,000-$5,000.",
  "Rare first-press vinyl from the 1960s-70s appreciates 8-12% annually."
]

export function LoadingFactsOption1() {
  const [currentFact, setCurrentFact] = useState(0)
  const [progress, setProgress] = useState(45)

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % VINYL_FACTS.length)
    }, 8000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 45 : prev + 1))
    }, 200)

    return () => {
      clearInterval(factInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="relative rounded-2xl p-8 overflow-hidden bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎵</div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Did You Know?
              </h3>
              <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
            </div>

            {/* Fact Display with Slide Animation */}
            <div className="h-24 flex items-center justify-center mb-6">
              <p 
                key={currentFact}
                className="text-lg text-center text-gray-700 dark:text-gray-200 animate-slide-in px-4"
              >
                {VINYL_FACTS[currentFact]}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {VINYL_FACTS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentFact
                      ? 'w-8 bg-gradient-to-r from-cyan-500 to-purple-500'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Analyzing inventory...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 4s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

