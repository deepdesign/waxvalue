'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'horizontal' | 'vertical' | 'brandmark'
  className?: string
  forceDark?: boolean
}

export function Logo({ 
  size = 'md', 
  variant = 'horizontal',
  className = '',
  forceDark = false
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Determine if we should use dark logo - check both theme and resolvedTheme
  const isDark = forceDark || (mounted && (theme === 'dark' || resolvedTheme === 'dark'))
  
  // Size mappings for different variants
  const sizeClasses = {
    horizontal: {
      sm: 'h-6',
      md: 'h-8',
      lg: 'h-10',
      xl: 'h-12',
      '2xl': 'h-24'
    },
    vertical: {
      sm: 'h-12',
      md: 'h-16',
      lg: 'h-20',
      xl: 'h-24'
    },
    brandmark: {
      sm: 'h-8',
      md: 'h-12',
      lg: 'h-16',
      xl: 'h-20'
    }
  }
  
  // Determine logo path based on variant and theme
  const getLogoPath = () => {
    if (variant === 'horizontal') {
      return isDark 
        ? '/svg/dark/waxvalue-horizontal-dark.svg'
        : '/svg/light/waxvalue-horizontal-light.svg'
    } else if (variant === 'vertical') {
      return isDark
        ? '/svg/dark/waxvalue-vertical-dark.svg'
        : '/svg/light/waxvalue-vertical-light.svg'
    } else {
      return isDark
        ? '/svg/dark/waxvalue-brandmark-dark.svg'
        : '/svg/light/waxvalue-brandmark-light.svg'
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    // Use a safe fallback for size during SSR
    const safeVariant = sizeClasses[variant] ? variant : 'horizontal'
    return <div className={`relative ${sizeClasses[safeVariant][size]} ${className}`} />
  }

  const logoPath = getLogoPath()

  return (
    <div className={`relative ${sizeClasses[variant][size]} ${className}`}>
      <img
        key={logoPath}
        src={logoPath}
        alt="WaxValue"
        className="w-auto h-full object-contain"
      />
    </div>
  )
}
