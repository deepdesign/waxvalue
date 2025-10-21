'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  required?: boolean
  variant?: 'default' | 'filled' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  success?: boolean
  warning?: boolean
  fullWidth?: boolean
}

const getVariantClasses = (variant: 'default' | 'filled' | 'outlined') => {
  switch (variant) {
    case 'filled':
      return 'bg-gray-50 dark:bg-gray-800 border-0 border-b-2 border-gray-300 dark:border-gray-600 rounded-t-lg rounded-b-none focus:border-primary-500 dark:focus:border-primary-400'
    case 'outlined':
      return 'bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 dark:focus:border-primary-400'
    default:
      return 'input-base'
  }
}

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-sm'
    case 'md':
      return 'h-10 px-4 text-sm'
    case 'lg':
      return 'h-12 px-4 text-base'
    default:
      return 'h-10 px-4 text-sm'
  }
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    icon,
    leftIcon,
    rightIcon,
    required = false,
    variant = 'default',
    size = 'md',
    success = false,
    warning = false,
    fullWidth = false,
    id,
    ...props 
  }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`
    
    const describedBy = clsx({
      [errorId]: error,
      [helperId]: helperText && !error,
    })

    const getInputClasses = () => {
      const baseClasses = getVariantClasses(variant)
      const sizeClasses = getSizeClasses(size)
      const widthClasses = fullWidth ? 'w-full' : ''
      
      const stateClasses = clsx({
        'border-red-300 focus:border-red-500 focus:ring-red-500': error,
        'border-green-300 focus:border-green-500 focus:ring-green-500': success && !error,
        'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500': warning && !error && !success,
        'pl-10': leftIcon || icon,
        'pr-10': rightIcon,
        'accent-primary-500': !error && !success && !warning,
        'accent-red-500': error,
        'accent-green-500': success,
        'accent-yellow-500': warning,
      })

      return clsx(baseClasses, sizeClasses, widthClasses, stateClasses, className)
    }

    return (
      <div className={clsx('space-y-1', fullWidth && 'w-full')}>
        <label 
          htmlFor={fieldId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <div className="relative">
          {(leftIcon || icon) && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon || icon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={fieldId}
            className={getInputClasses()}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
          
          {/* Status Icons */}
          {success && !error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
          )}
          
          {warning && !error && !success && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }
