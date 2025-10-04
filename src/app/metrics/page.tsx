'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function MetricsPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  const MetricsCharts = dynamic(() => import('@/components/MetricsCharts').then(m => m.MetricsCharts), {
    ssr: false,
    loading: () => <div className="space-y-6"><div className="card animate-pulse h-64" /><div className="card animate-pulse h-64" /></div>,
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metrics & Analytics</h1>
          <p className="text-gray-600">Analyze your pricing performance and market positioning</p>
        </div>

        <MetricsCharts />
      </div>
    </DashboardLayout>
  )
}
