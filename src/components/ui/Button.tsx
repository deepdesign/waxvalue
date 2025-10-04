'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  loadingText?: string
}

const getVariantClasses = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500'
    case 'secondary':
      return 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-500'
    case 'outline':
      return 'border border-secondary-300 bg-transparent hover:bg-secondary-50 hover:border-secondary-400 text-secondary-700 focus-visible:ring-secondary-500'
    case 'ghost':
      return 'hover:bg-secondary-100 hover:text-secondary-900 focus-visible:ring-secondary-500'
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
    default:
      return 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500'
  }
}

const getSizeClasses = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-xs'
    case 'lg':
      return 'h-12 px-8 text-lg'
    case 'icon':
      return 'h-10 w-10'
    default:
      return 'h-10 px-4 py-2'
  }
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'default', 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    const variantClasses = getVariantClasses(variant)
    const sizeClasses = getSizeClasses(size)
    
    return (
      <button
        className={clsx(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" 
              aria-hidden="true"
            />
            <span aria-live="polite">
              {loadingText || 'Loading...'}
            </span>
          </>
        )}
        {!loading && children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
