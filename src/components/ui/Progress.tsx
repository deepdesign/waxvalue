'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient'
  showLabel?: boolean
  animated?: boolean
  striped?: boolean
  indeterminate?: boolean
  label?: string
  showPercentage?: boolean
  showValue?: boolean
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const variantClasses = {
  default: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  gradient: 'bg-gradient-to-r from-primary-500 to-purple-500'
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className,
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = false,
    striped = false,
    indeterminate = false,
    label,
    showPercentage = true,
    showValue = false,
    ...props 
  }, ref) => {
    const percentage = indeterminate ? 0 : Math.min(Math.max((value / max) * 100, 0), 100)
    const displayLabel = label || 'Progress'
    const displayValue = showValue ? `${value}/${max}` : undefined
    const displayPercentage = showPercentage ? `${Math.round(percentage)}%` : undefined

    return (
      <div className={clsx('w-full', className)} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayLabel}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {displayValue && <span>{displayValue}</span>}
              {displayPercentage && <span>{displayPercentage}</span>}
            </div>
          </div>
        )}
        
        <div
          ref={ref}
          className={clsx(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative',
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={indeterminate ? 'Loading...' : `${displayLabel}: ${Math.round(percentage)}%`}
        >
          {indeterminate ? (
            <div
              className={clsx(
                'h-full bg-gradient-to-r from-transparent via-current to-transparent',
                'animate-pulse',
                variantClasses[variant]
              )}
              style={{
                background: 'linear-gradient(90deg, transparent, currentColor, transparent)',
                animation: 'indeterminate 2s infinite linear'
              }}
            />
          ) : (
            <div
              className={clsx(
                'h-full transition-all duration-300 ease-out',
                variantClasses[variant],
                {
                  'animate-pulse': animated,
                  'bg-stripes': striped,
                }
              )}
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

// Circular Progress Component
interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient'
  showLabel?: boolean
  animated?: boolean
}

const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    className,
    value,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'default',
    showLabel = false,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const getStrokeColor = () => {
      switch (variant) {
        case 'success': return '#10b981'
        case 'warning': return '#f59e0b'
        case 'error': return '#ef4444'
        case 'gradient': return 'url(#gradient)'
        default: return '#3b82f6'
      }
    }

    return (
      <div
        ref={ref}
        className={clsx('relative inline-flex items-center justify-center', className)}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className={clsx('transform -rotate-90', { 'animate-spin': animated })}
        >
          {variant === 'gradient' && (
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          )}
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)

CircularProgress.displayName = 'CircularProgress'

export { Progress, CircularProgress }




