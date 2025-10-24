'use client'

import { useApp } from '@/components/Providers'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LandingHeroSplit4 } from '@/components/landing-alternatives'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Home() {
  const { user, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner fullPage />
  }

  if (!user) {
    return <LandingHeroSplit4 />
  }

  return null
}
