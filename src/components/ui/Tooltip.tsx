'use client'

import { useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 200,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipId = setTimeout(() => {
      setCoords({ x: rect.left + rect.width / 2, y: rect.top })
      setIsVisible(true)
    }, delay)
    setTimeoutId(tooltipId)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }

  const getTooltipPosition = () => {
    const offset = 8
    switch (position) {
      case 'top':
        return {
          left: coords.x,
          top: coords.y - offset,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          left: coords.x,
          top: coords.y + offset,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          left: coords.x - offset,
          top: coords.y,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          left: coords.x + offset,
          top: coords.y,
          transform: 'translate(0, -50%)'
        }
      default:
        return {
          left: coords.x,
          top: coords.y - offset,
          transform: 'translate(-50%, -100%)'
        }
    }
  }

  const getArrowPosition = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45'
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 translate-y-1/2`
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -translate-x-1/2`
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 translate-x-1/2`
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`
    }
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 max-w-xs"
          style={getTooltipPosition()}
        >
          {content}
          <div className={getArrowPosition()} />
        </div>,
        document.body
      )}
    </>
  )
}

// Convenience components for common tooltip patterns
export function InfoTooltip({ content, children, ...props }: Omit<TooltipProps, 'position'>) {
  return (
    <Tooltip content={content} position="top" {...props}>
      {children}
    </Tooltip>
  )
}

export function HelpTooltip({ content, children, ...props }: Omit<TooltipProps, 'position'>) {
  return (
    <Tooltip content={content} position="right" {...props}>
      {children}
    </Tooltip>
  )
}
