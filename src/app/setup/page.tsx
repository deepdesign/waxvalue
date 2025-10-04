'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SetupWizard } from '@/components/SetupWizard'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function SetupPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SetupWizard />
    </div>
  )
}
