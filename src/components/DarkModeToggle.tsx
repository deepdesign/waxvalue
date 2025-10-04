'use client'

import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

type Theme = 'light' | 'dark' | 'system'

export function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }
  }, [])

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      if (isSystemDark) {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    } else {
      root.classList.add(theme)
    }

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        
        if (mediaQuery.matches) {
          root.classList.add('dark')
        } else {
          root.classList.add('light')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  if (!mounted) {
    // Prevent hydration mismatch by showing a placeholder
    return (
      <div className="flex items-center space-x-1">
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
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
        onClick={() => handleThemeChange('dark')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
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
        onClick={() => handleThemeChange('system')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
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
