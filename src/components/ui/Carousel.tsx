'use client'

import { forwardRef, useRef, useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  showArrows?: boolean
  showDots?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  snapType?: 'mandatory' | 'proximity'
  snapAlign?: 'start' | 'center' | 'end'
}

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ 
    className, 
    children,
    showArrows = true,
    showDots = true,
    autoPlay = false,
    autoPlayInterval = 3000,
    snapType = 'mandatory',
    snapAlign = 'center',
    ...props 
  }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
    const childrenArray = Array.isArray(children) ? children : [children]

    useEffect(() => {
      if (!isAutoPlaying) return

      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % childrenArray.length)
        if (scrollRef.current) {
          const itemWidth = scrollRef.current.scrollWidth / childrenArray.length
          scrollRef.current.scrollTo({
            left: ((currentIndex + 1) % childrenArray.length) * itemWidth,
            behavior: 'smooth'
          })
        }
      }, autoPlayInterval)

      return () => clearInterval(interval)
    }, [isAutoPlaying, autoPlayInterval, currentIndex, childrenArray.length])

    const scrollToIndex = (index: number) => {
      if (scrollRef.current) {
        const itemWidth = scrollRef.current.scrollWidth / childrenArray.length
        scrollRef.current.scrollTo({
          left: index * itemWidth,
          behavior: 'smooth'
        })
        setCurrentIndex(index)
      }
    }

    const handleScroll = () => {
      if (scrollRef.current) {
        const itemWidth = scrollRef.current.scrollWidth / childrenArray.length
        const newIndex = Math.round(scrollRef.current.scrollLeft / itemWidth)
        setCurrentIndex(newIndex)
      }
    }

    return (
      <div className={clsx('relative', className)} {...props}>
        {/* Carousel Container */}
        <div
          ref={scrollRef}
          className={clsx(
            'overflow-x-auto scrollbar-hide',
            'scroll-snap-smooth',
            'flex',
            'gap-4'
          )}
          onScroll={handleScroll}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(autoPlay)}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className={clsx(
                'flex-shrink-0 w-full',
                'scroll-snap-item'
              )}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && (
          <>
            <button
              onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous item"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scrollToIndex(Math.min(childrenArray.length - 1, currentIndex + 1))}
              disabled={currentIndex === childrenArray.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next item"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {showDots && (
          <div className="flex justify-center mt-4 space-x-2">
            {childrenArray.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex
                    ? 'bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                )}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)

Carousel.displayName = 'Carousel'

export { Carousel }

