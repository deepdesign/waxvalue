'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon'
type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'gray'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const getVariantClasses = (variant: ButtonVariant, color: ButtonColor = 'primary') => {
  const colorMap = {
    primary: 'primary',
    secondary: 'secondary', 
    success: 'green',
    warning: 'yellow',
    destructive: 'red',
    gray: 'gray'
  }
  
  const colorName = colorMap[color]
  
  switch (variant) {
    case 'primary':
      return `bg-${colorName}-600 dark:bg-${colorName}-500 text-white hover:bg-${colorName}-700 dark:hover:bg-${colorName}-600 active:bg-${colorName}-800 dark:active:bg-${colorName}-700 shadow-lg shadow-${colorName}-500/25 dark:shadow-${colorName}-400/25 hover:shadow-xl hover:shadow-${colorName}-500/30 dark:hover:shadow-${colorName}-400/30`
    case 'secondary':
      return `bg-${colorName}-100 dark:bg-${colorName}-800 text-${colorName}-700 dark:text-${colorName}-200 hover:bg-${colorName}-200 dark:hover:bg-${colorName}-700 active:bg-${colorName}-300 dark:active:bg-${colorName}-600 shadow-sm shadow-${colorName}-200/50 dark:shadow-${colorName}-800/50 hover:shadow-md hover:shadow-${colorName}-200/60 dark:hover:shadow-${colorName}-800/60`
    case 'outline':
      return `border border-${colorName}-300 dark:border-${colorName}-600 bg-transparent hover:bg-${colorName}-50 dark:hover:bg-${colorName}-800 hover:border-${colorName}-400 dark:hover:border-${colorName}-500 active:bg-${colorName}-100 dark:active:bg-${colorName}-700 text-${colorName}-700 dark:text-${colorName}-300 shadow-sm hover:shadow-md transition-all duration-200`
    case 'ghost':
      return `hover:bg-${colorName}-100 dark:hover:bg-${colorName}-800 hover:text-${colorName}-900 dark:hover:text-${colorName}-100 active:bg-${colorName}-200 dark:active:bg-${colorName}-700 transition-all duration-200`
    case 'destructive':
      return 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-700 shadow-lg shadow-red-500/25 dark:shadow-red-400/25 hover:shadow-xl hover:shadow-red-500/30 dark:hover:shadow-red-400/30'
    case 'gradient':
      return 'bg-gradient-primary text-white bg-gradient-primary-hover bg-gradient-primary-active shadow-lg shadow-primary-500/30 dark:shadow-primary-400/30 hover:shadow-xl hover:shadow-primary-500/40 dark:hover:shadow-primary-400/40 transition-all duration-200'
    default:
      return `bg-${colorName}-600 dark:bg-${colorName}-500 text-white hover:bg-${colorName}-700 dark:hover:bg-${colorName}-600 active:bg-${colorName}-800 dark:active:bg-${colorName}-700 focus-visible:ring-${colorName}-500/50 dark:focus-visible:ring-${colorName}-400/50 shadow-lg shadow-${colorName}-500/25 dark:shadow-${colorName}-400/25 hover:shadow-xl hover:shadow-${colorName}-500/30 dark:hover:shadow-${colorName}-400/30`
  }
}

const getSizeClasses = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-xs'
    case 'md':
      return 'h-10 px-4 py-2 text-sm'
    case 'lg':
      return 'h-12 px-6 text-base'
    case 'xl':
      return 'h-14 px-8 text-lg'
    case 'icon':
      return 'h-10 w-10 p-0'
    default:
      return 'h-10 px-4 py-2 text-sm'
  }
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    color = 'primary',
    loading = false, 
    loadingText, 
    leftIcon,
    rightIcon,
    fullWidth = false,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 transform-gpu hover:scale-105 active:scale-95'
    const variantClasses = getVariantClasses(variant, color)
    const sizeClasses = getSizeClasses(size)
    const widthClasses = fullWidth ? 'w-full' : ''
    
    return (
      <button
        className={clsx(baseClasses, variantClasses, sizeClasses, widthClasses, className)}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
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
        {!loading && (
          <>
            {leftIcon && (
              <span className="mr-2 flex-shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2 flex-shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
