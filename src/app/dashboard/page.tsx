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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Review and manage your Discogs pricing suggestions</p>
        </div>

        {/* Discogs Connection Status */}
        <DiscogsConnectionCard user={user} />

        {/* Summary Cards */}
        <RunSummaryCards />

        {/* Filters Bar */}
        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          totalItems={150} // This would come from API
          filteredItems={120} // This would be calculated based on filters
        />

        {/* Inventory Review Table */}
        <InventoryReviewTable filters={filters} />
      </div>
    </DashboardLayout>
  )
}
