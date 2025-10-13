'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, ComputerDesktopIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Tooltip } from './ui/Tooltip'

export function DarkModeToggleCollapsed() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('right')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { theme, setTheme } = useTheme()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate dropdown position to avoid screen edge clipping
  const calculatePosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 128 // w-32 = 128px
      const spaceOnRight = window.innerWidth - buttonRect.right
      const spaceOnLeft = buttonRect.left
      
      // Position dropdown to the left if there's not enough space on the right
      if (spaceOnRight < dropdownWidth && spaceOnLeft > dropdownWidth) {
        setDropdownPosition('left')
      } else {
        setDropdownPosition('right')
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      calculatePosition()
      
      // Recalculate on window resize
      const handleResize = () => calculatePosition()
      window.addEventListener('resize', handleResize)
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  if (!mounted) {
    // Prevent hydration mismatch by showing a placeholder
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    )
  }

  const getCurrentIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="h-4 w-4" />
      case 'dark':
        return <MoonIcon className="h-4 w-4" />
      case 'system':
        return <ComputerDesktopIcon className="h-4 w-4" />
      default:
        return <ComputerDesktopIcon className="h-4 w-4" />
    }
  }

  const getCurrentTitle = () => {
    switch (theme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
        return 'System theme'
      default:
        return 'System theme'
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Theme selector"
        title={getCurrentTitle()}
      >
        {getCurrentIcon()}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute top-0 z-50 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 ${
          dropdownPosition === 'left' 
            ? 'right-10' 
            : 'left-10'
        }`}>
          <button
            onClick={() => {
              setTheme('light')
              setIsOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
              theme === 'light'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <SunIcon className="h-4 w-4 mr-2" />
            Light
          </button>
          
          <button
            onClick={() => {
              setTheme('dark')
              setIsOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
              theme === 'dark'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MoonIcon className="h-4 w-4 mr-2" />
            Dark
          </button>
          
          <button
            onClick={() => {
              setTheme('system')
              setIsOpen(false)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
              theme === 'system'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ComputerDesktopIcon className="h-4 w-4 mr-2" />
            System
          </button>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
