'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  disabled?: boolean
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ 
    className,
    content,
    placement = 'top',
    trigger = 'hover',
    delay = 200,
    disabled = false,
    maxWidth = 'max-w-xs',
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    const showTooltip = () => {
      if (disabled) return
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, delay)
    }

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsVisible(false)
    }

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    const getPlacementClasses = () => {
      switch (placement) {
        case 'top':
          return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
        case 'bottom':
          return 'top-full left-1/2 -translate-x-1/2 mt-2'
        case 'left':
          return 'right-full top-1/2 -translate-y-1/2 mr-2'
        case 'right':
          return 'left-full top-1/2 -translate-y-1/2 ml-2'
        default:
          return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      }
    }

    const getArrowClasses = () => {
      switch (placement) {
        case 'top':
          return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700'
        case 'bottom':
          return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700'
        case 'left':
          return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700'
        case 'right':
          return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700'
        default:
          return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700'
      }
    }

    const eventHandlers = {
      hover: {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
      },
      click: {
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          if (isVisible) {
            hideTooltip()
          } else {
            showTooltip()
          }
        },
      },
      focus: {
        onFocus: showTooltip,
        onBlur: hideTooltip,
      },
    }

    return (
      <div
        ref={triggerRef}
        className={clsx('tooltip-container', className)}
        {...eventHandlers[trigger]}
        {...props}
      >
        {children}
        
        {isVisible && (
          <div
            className={clsx(
              'tooltip-content px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg',
              'z-[9999]', // Ensure tooltips are always on top
              'animate-fade-in'
            )}
            role="tooltip"
            aria-live="polite"
            data-placement={placement}
            style={{
              maxWidth: '300px',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              lineHeight: '1.4',
            }}
          >
            <div className="break-words">
              {content}
            </div>
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4 border-transparent',
                getArrowClasses()
              )}
            />
          </div>
        )}
      </div>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export { Tooltip }