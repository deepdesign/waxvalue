'use client'

import { forwardRef, useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ 
    className,
    content,
    placement = 'top',
    trigger = 'hover',
    delay = 200,
    disabled = false,
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    const updatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft
      const scrollY = window.pageYOffset || document.documentElement.scrollTop

      let top = 0
      let left = 0

      switch (placement) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - 8
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = triggerRect.bottom + scrollY + 8
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.left + scrollX - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.right + scrollX + 8
          break
      }

      setPosition({ top, left })
    }, [placement])

    const showTooltip = () => {
      if (disabled) return
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
        updatePosition()
      }, delay)
    }

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsVisible(false)
    }

    useEffect(() => {
      if (isVisible) {
        updatePosition()
        const handleResize = () => updatePosition()
        const handleScroll = () => updatePosition()
        
        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll)
        
        return () => {
          window.removeEventListener('resize', handleResize)
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }, [isVisible, placement, updatePosition])

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
      <>
        <div
          ref={triggerRef}
          className={clsx('inline-block', className)}
          {...eventHandlers[trigger]}
          {...props}
        >
          {children}
        </div>

        {isVisible && createPortal(
          <div
            ref={tooltipRef}
            className={clsx(
              'fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg',
              'animate-fade-in',
              getPlacementClasses()
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {content}
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4 border-transparent',
                getArrowClasses()
              )}
            />
          </div>,
          document.body
        )}
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export { Tooltip }