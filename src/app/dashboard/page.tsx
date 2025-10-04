'use client'

import { useState } from 'react'
import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { RunSummaryCards } from '@/components/RunSummaryCards'
import { InventoryReviewTable } from '@/components/InventoryReviewTable'
import { OnboardingBanner } from '@/components/OnboardingBanner'
import { FiltersBar, FilterState } from '@/components/FiltersBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { DiscogsConnectionCard } from '@/components/DiscogsConnectionCard'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    format: '',
    condition: '',
    priceRange: { min: null, max: null },
    showFlaggedOnly: false,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleClearFilters = () => {
    setFilters({
      status: '',
      format: '',
      condition: '',
      priceRange: { min: null, max: null },
      showFlaggedOnly: false,
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Review and manage your Discogs pricing suggestions</p>
        </div>

        {/* Discogs Connection Status */}
        <DiscogsConnectionCard user={user} />

        {/* Summary Cards */}
        <RunSummaryCards />

        {/* Pricing Suggestions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pricing Suggestions</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Review and manage suggested price changes for your inventory</p>
              </div>
              <div className="mt-4 sm:mt-0 relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing 120 of 150 items
                  </span>
                  <FiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                    totalItems={150} // This would come from API
                    filteredItems={120} // This would be calculated based on filters
                  />
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 dark:focus:ring-primary-400 transition-colors">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Simulate
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <InventoryReviewTable filters={filters} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
