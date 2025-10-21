'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  required?: boolean
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    icon, 
    required = false,
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

    return (
      <div className="space-y-1">
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
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {icon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={fieldId}
            className={clsx(
              'input-base',
              {
                'border-red-300 focus:border-red-500 focus:ring-red-500': error,
                'pl-10': icon,
                // Native form control styling
                'accent-primary-500': !error,
                'accent-red-500': error,
              },
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
        </div>
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-sm text-gray-500"
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
