'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function AuthPageRoute() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to home - auth flow now starts from home page
    router.push('/')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner fullPage />
    </div>
  )
}




