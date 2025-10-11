'use client'

import { useState, useEffect } from 'react'

const VINYL_FACTS = [
  "The Beatles' \"Yesterday and Today\" sold for $125,000!",
  "Vinyl sales hit 40 million units in 2022",
  "Only 50 copies of \"The Quarrymen at Home\" exist",
  "Vinyl grooves stretch 1,500 feet when unwound",
  "Plants produce 1,000 records per day per press",
  "Picture discs command 300-500% premiums",
  "An LP holds 22 minutes per side at 33⅓ RPM",
  "Vinyl market projected to reach $2.8B by 2030",
  "Average collection valued at $3,000-$5,000",
  "Rare vinyl appreciates 8-12% annually"
]

export function LoadingFactsOption2() {
  const [currentFact, setCurrentFact] = useState(0)
  const [itemCount, setItemCount] = useState(234)

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % VINYL_FACTS.length)
    }, 8000)

    const countInterval = setInterval(() => {
      setItemCount((prev) => (prev >= 450 ? 234 : prev + 3))
    }, 100)

    return () => {
      clearInterval(factInterval)
      clearInterval(countInterval)
    }
  }, [])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl text-center">
        {/* Rotating Vinyl Record */}
        <div className="relative inline-block mb-8">
          <svg
            className="w-48 h-48 animate-spin-slow"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer edge */}
            <circle cx="100" cy="100" r="95" fill="#1a1a1a" stroke="#666" strokeWidth="2" />
            
            {/* Grooves */}
            {[85, 75, 65, 55, 45, 35].map((r, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke="#333"
                strokeWidth="1"
                className="animate-pulse-slow"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
            
            {/* Center label */}
            <circle cx="100" cy="100" r="25" fill="#dc2626" />
            <circle cx="100" cy="100" r="20" fill="#1a1a1a" />
            <circle cx="100" cy="100" r="5" fill="#666" />
          </svg>

          {/* "Did You Know" Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🎵 DID YOU KNOW?
          </div>
        </div>

        {/* Fact Display */}
        <div className="mb-8 min-h-[80px] flex items-center justify-center">
          <p
            key={currentFact}
            className="text-xl text-gray-700 dark:text-gray-200 animate-typewriter max-w-xl"
          >
            {VINYL_FACTS[currentFact]}
          </p>
        </div>

        {/* Progress */}
        <div className="text-gray-600 dark:text-gray-400">
          <p className="text-sm mb-2">Scanning your collection...</p>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">
            {itemCount} / 450
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes typewriter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-typewriter {
          animation: typewriter 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

