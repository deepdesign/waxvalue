'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { InventoryReviewTable, InventoryReviewTableRef } from '@/components/InventoryReviewTable'
import { OnboardingBanner } from '@/components/OnboardingBanner'
import { FiltersBar, FilterState } from '@/components/FiltersBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { DiscogsConnectionCard } from '@/components/DiscogsConnectionCard'
import { AuthGuard } from '@/components/AuthGuard'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { Tooltip } from '@/components/ui/Tooltip'

export default function DashboardPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const inventoryTableRef = useRef<InventoryReviewTableRef>(null)
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priceDirection: '',
    condition: '',
    priceRange: { min: null, max: null },
    showFlaggedOnly: false,
  })
  const [hasAutoFetched, setHasAutoFetched] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priceDirection: '',
      condition: '',
      priceRange: { min: null, max: null },
      showFlaggedOnly: false,
    })
  }

  const handleSimulate = () => {
    inventoryTableRef.current?.simulate()
    // Trigger refresh of summary cards after analysis
    setTimeout(() => setRefreshTrigger(prev => prev + 1), 2000)
  }

  // Auto-fetch data when user connects to Discogs
  useEffect(() => {
    const isConnected = user?.discogsUserId && user?.accessToken && user?.accessTokenSecret
    if (isConnected && !hasAutoFetched) {
      // Auto-fetch data after a short delay to ensure everything is loaded
      const timer = setTimeout(() => {
        inventoryTableRef.current?.simulate()
        setHasAutoFetched(true)
        // Trigger refresh of summary cards after auto-fetch
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 3000)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [user, hasAutoFetched])

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Review and manage your Discogs pricing suggestions</p>
        </div>

        {/* Discogs Connection Status - Only show when user is not connected */}
        {(!user?.discogsUserId || !user?.accessToken || !user?.accessTokenSecret) && (
          <DiscogsConnectionCard user={user} />
        )}

        {/* Pricing Suggestions Table - Only show when user is connected to Discogs */}
        {(user?.discogsUserId && user?.accessToken && user?.accessTokenSecret) && (
          <InventoryReviewTable ref={inventoryTableRef} filters={filters} onFiltersChange={setFilters} />
        )}
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}
