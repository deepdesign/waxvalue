'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ScrollSnapProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
  snapType?: 'mandatory' | 'proximity'
  snapAlign?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

const ScrollSnap = forwardRef<HTMLDivElement, ScrollSnapProps>(
  ({ 
    className, 
    direction = 'horizontal',
    snapType = 'mandatory',
    snapAlign = 'center',
    children,
    ...props 
  }, ref) => {
    const directionClasses = direction === 'horizontal' 
      ? 'overflow-x-auto overflow-y-hidden' 
      : 'overflow-y-auto overflow-x-hidden'
    
    const snapClasses = direction === 'horizontal'
      ? `snap-x snap-${snapType}`
      : `snap-y snap-${snapType}`
    
    return (
      <div
        ref={ref}
        className={clsx(
          'scroll-smooth',
          directionClasses,
          snapClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollSnap.displayName = 'ScrollSnap'

// Scroll snap item component
interface ScrollSnapItemProps extends React.HTMLAttributes<HTMLDivElement> {
  snapAlign?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

const ScrollSnapItem = forwardRef<HTMLDivElement, ScrollSnapItemProps>(
  ({ className, snapAlign = 'center', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'snap-start flex-shrink-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollSnapItem.displayName = 'ScrollSnapItem'

export { ScrollSnap, ScrollSnapItem }
