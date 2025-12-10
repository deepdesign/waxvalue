'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

export function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Prevent hydration mismatch by showing a placeholder
    return (
      <div className="flex items-center space-x-1">
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-yellow-500 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Light mode"
        aria-label="Switch to light mode"
      >
        <SunIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Dark mode"
        aria-label="Switch to dark mode"
      >
        <MoonIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all duration-200 ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="System theme"
        aria-label="Use system theme"
      >
        <ComputerDesktopIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
