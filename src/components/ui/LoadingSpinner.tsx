'use client'

import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  primary: 'border-primary-600 dark:border-primary-400',
  secondary: 'border-gray-600 dark:border-gray-400',
  white: 'border-white'
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  className 
}: LoadingSpinnerProps) {
  return (
    <div 
      className={clsx(
        'animate-spin rounded-full border-2 border-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Enhanced loading component with shimmer effect
export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card-base animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// Modern shimmer loading effect
export function ShimmerLoading({ className }: { className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden', className)}>
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="relative bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}
