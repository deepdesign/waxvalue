'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: 'badge-base bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  destructive: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 shadow-sm shadow-red-200/50 dark:shadow-red-900/30',
  outline: 'badge-base border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300'
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    children, 
    ...props 
  }, ref) => {
    const variantClass = variantClasses[variant]
    const sizeClass = sizeClasses[size]
    
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full font-medium transition-colors',
          variantClass,
          sizeClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
