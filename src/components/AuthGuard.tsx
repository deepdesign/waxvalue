'use client'

import { useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from './Providers'
import { LoadingSpinner } from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard = memo(function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner fullPage />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
})
