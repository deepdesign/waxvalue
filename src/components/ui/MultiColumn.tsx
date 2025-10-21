'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface MultiColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const MultiColumn = forwardRef<HTMLDivElement, MultiColumnProps>(
  ({ 
    className, 
    columns = 3,
    gap = 'md',
    children,
    ...props 
  }, ref) => {
    const columnClasses = {
      1: 'columns-1',
      2: 'columns-2',
      3: 'columns-3',
      4: 'columns-4',
      5: 'columns-5',
      6: 'columns-6',
    }
    
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    }
    
    return (
      <div
        ref={ref}
        className={clsx(
          columnClasses[columns],
          gapClasses[gap],
          'break-inside-avoid',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MultiColumn.displayName = 'MultiColumn'

// Multi-column item component
interface MultiColumnItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MultiColumnItem = forwardRef<HTMLDivElement, MultiColumnItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'break-inside-avoid mb-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MultiColumnItem.displayName = 'MultiColumnItem'

export { MultiColumn, MultiColumnItem }
