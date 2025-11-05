'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useApp } from './Providers'
import {
  HomeIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { DarkModeToggle } from './DarkModeToggle'
import Image from 'next/image'
import { DarkModeToggleCollapsed } from './DarkModeToggleCollapsed'
import { Logo } from './Logo'
import { Tooltip } from './ui/Tooltip'
import Footer from './Footer'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help & support', href: '/help', icon: QuestionMarkCircleIcon },
]

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useApp()
  

  // Monitor background analysis progress - optimized polling
  useEffect(() => {
    const checkAnalysisProgress = () => {
      try {
        const progressData = localStorage.getItem('waxvalue_analysis_progress')
        if (progressData) {
          const progress = JSON.parse(progressData)
          if (progress.isRunning) {
            setAnalysisProgress({ 
              current: progress.current, 
              total: progress.total || 0
            })
            return true // Analysis is running
          }
        }
        setAnalysisProgress(null)
        return false // No analysis running
      } catch (error) {
        console.error('Failed to check analysis progress:', error)
        setAnalysisProgress(null)
        return false
      }
    }

    // Check immediately
    const isRunning = checkAnalysisProgress()

    // Only poll if analysis is running, with longer interval
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        const stillRunning = checkAnalysisProgress()
        if (!stillRunning) {
          clearInterval(interval!)
        }
      }, 2000) // Reduced frequency
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    router.push('/')
  }, [logout, router])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => navigation, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 xl:hidden 
        ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-900">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white touch-manipulation"
                onClick={toggleSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex flex-shrink-0 items-center justify-center px-4 mt-[35px] mb-[20px] select-none">
            <Logo size="lg" className="scale-[1.17] pointer-events-none" />
          </div>
          
          <div className="mt-5 h-0 flex-1 overflow-y-auto">
          <nav className="space-y-1 px-2" role="navigation" aria-label="Main navigation" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={`group relative flex items-center px-3 py-3 text-base font-medium rounded-lg select-none cursor-pointer touch-manipulation min-h-[44px] overflow-hidden transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/20 active:scale-[0.98] active:transition-transform active:duration-150 sidebar-nav-item ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100 shadow-sm shadow-primary-200/30 dark:shadow-primary-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700'
                  }`}
                  style={{ 
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                    animationFillMode: 'both'
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Navigate to ${item.name}${isActive ? ' (current page)' : ''}`}
                  onClick={(e) => {
                    setSidebarOpen(false)
                    // Create ripple effect
                    const ripple = document.createElement('span')
                    const rect = e.currentTarget.getBoundingClientRect()
                    const size = Math.max(rect.width, rect.height)
                    const x = e.clientX - rect.left - size / 2
                    const y = e.clientY - rect.top - size / 2
                    
                    ripple.style.cssText = `
                      position: absolute;
                      border-radius: 50%;
                      background: ${isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(156, 163, 175, 0.3)'};
                      transform: scale(0);
                      animation: ripple 600ms linear;
                      left: ${x}px;
                      top: ${y}px;
                      width: ${size}px;
                      height: ${size}px;
                      pointer-events: none;
                    `
                    
                    e.currentTarget.appendChild(ripple)
                    
                    setTimeout(() => {
                      ripple.remove()
                    }, 600)
                  }}
                >
                    <item.icon
                      className={`mr-4 h-6 w-6 flex-shrink-0 transition-all duration-300 ${
                        isActive 
                          ? 'text-primary-500 dark:text-primary-400 scale-110' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:scale-105'
                      }`}
                      aria-hidden="true"
                      onAnimationEnd={(e) => {
                        // Add bounce animation on click
                        e.currentTarget.classList.add('icon-bounce')
                        setTimeout(() => {
                          e.currentTarget.classList.remove('icon-bounce')
                        }, 600)
                      }}
                    />
                    <span className="transition-all duration-300 group-hover:translate-x-0.5">
                      {item.name}
                    </span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full animate-pulse shadow-lg shadow-primary-500/50 dark:shadow-primary-400/50" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* Dark Mode Toggle */}
          <div className="px-4 py-3">
            <div className="w-full">
              <DarkModeToggle />
            </div>
          </div>
          
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <Image
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatar}
                    alt={user.name || user.username}
                    width={32}
                    height={32}
                    onError={(e) => {
                      console.error('Avatar failed to load:', user.avatar)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {(user?.name || user?.username)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 select-none">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || user?.username}</p>
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center mt-1 select-none"
                >
                  <ArrowRightOnRectangleIcon className="h-3 w-3 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - full width */}
      <div className="hidden xl:fixed xl:inset-y-0 xl:flex xl:w-64 xl:flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-center px-4 mt-[35px] mb-[20px] select-none">
            <Logo size="lg" className="scale-[1.17] pointer-events-none" />
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors select-none cursor-pointer ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Dark Mode Toggle */}
          <div className="px-4 py-3">
            <div className="w-full">
              <DarkModeToggle />
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <Image
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatar}
                    alt={user.name || user.username}
                    width={32}
                    height={32}
                    onError={(e) => {
                      console.error('Avatar failed to load:', user.avatar)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {(user?.name || user?.username)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 select-none">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || user?.username}</p>
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center mt-1 select-none"
                >
                  <ArrowRightOnRectangleIcon className="h-3 w-3 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed sidebar - icon only */}
      <div className="hidden lg:flex xl:hidden fixed inset-y-0 w-16 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-center px-2 mt-[35px] mb-[20px] select-none">
            <Logo size="sm" variant="brandmark" className="pointer-events-none" />
          </div>
            <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Main navigation">
              {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.name} content={item.name} placement="right">
                  <Link
                    href={item.href}
                    className={`group flex items-center justify-center px-2 py-2 text-sm font-medium rounded-md transition-colors select-none cursor-pointer ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                  </Link>
                </Tooltip>
              )
            })}
          </nav>
          
          {/* Dark Mode Toggle */}
          <div className="px-2 py-3">
            <div className="w-full flex justify-center">
              <DarkModeToggleCollapsed />
            </div>
          </div>
          
          {/* User profile section hidden in collapsed sidebar */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image
                  className="h-8 w-8 rounded-full"
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'User')}&background=6366f1&color=ffffff`}
                  alt={user?.name || user?.username || 'User'}
                  width={32}
                  height={32}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-16 xl:pl-64 flex flex-col flex-1">
        {/* Background Analysis Banner - Only show when NOT on dashboard */}
        {analysisProgress && pathname !== '/dashboard' && (
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm animate-slide-down">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <svg className="wave-svg" style={{height: '40px', width: '40px'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 38.05">
                  <path className="wave-line wave-line-1" d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"/>
                  <path className="wave-line wave-line-2" d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"/>
                  <path className="wave-line wave-line-3" d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H12.91Z"/>
                  <path className="wave-line wave-line-4" d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H18.91Z"/>
                  <path className="wave-line wave-line-5" d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H24.91Z"/>
                  <path className="wave-line wave-line-6" d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H30.91Z"/>
                  <path className="wave-line wave-line-7" d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H36.91Z"/>
                  <path className="wave-line wave-line-8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10a1,1,0,0,0-1-1H42.91Z"/>
                  <path className="wave-line wave-line-9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {analysisProgress.total > 0 
                      ? `Processing ${analysisProgress.current} of ${analysisProgress.total} items`
                      : 'Preparing inventory analysis...'}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1.5 max-w-xs overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                      style={{ width: `${analysisProgress.total > 0 ? (analysisProgress.current / analysisProgress.total) * 100 : 25}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-10 xl:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer - below sidebar and content, aligned with content area */}
      <div className="lg:pl-16 xl:pl-64">
        <Footer 
          logo={<Logo size="lg" variant="horizontal" className="scale-[1.17]" />}
          strapline="Keep your Discogs prices in sync with the market"
          homeLink="/dashboard"
          settingsLink={null}
        />
      </div>
    </div>
  )
})