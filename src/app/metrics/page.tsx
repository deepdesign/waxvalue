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
    loading: () => <div className="space-y-6"><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64" /><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64" /></div>,
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Metrics & Analytics</h1>
          <p className="mt-2 text-lg text-gray-600">Analyze your pricing performance and market positioning</p>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
            <p className="mt-1 text-sm text-gray-600">Charts and insights about your pricing strategy effectiveness</p>
          </div>
          <div className="p-6">
            <MetricsCharts />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
