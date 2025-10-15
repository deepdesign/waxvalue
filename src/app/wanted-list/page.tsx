'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, ViewfinderCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { WantedListTable } from '@/components/WantedListTable'
import { AddReleaseModal } from '@/components/AddReleaseModal'
import { useApp } from '@/components/Providers'
import { DashboardLayout } from '@/components/DashboardLayout'
import { AuthGuard } from '@/components/AuthGuard'
import { ApiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface WantedListEntry {
  id: string
  discogs_release_id: number
  release_title: string
  artist_name: string
  release_year?: number
  release_format?: string
  cover_image_url?: string
  max_price?: number
  max_price_currency: string
  min_condition?: string
  location_filter?: string
  min_seller_rating?: number
  underpriced_percentage?: number
  status: 'monitoring' | 'price_matched' | 'underpriced' | 'no_listings' | 'paused'
  is_active: boolean
  last_checked?: string
  created_at: string
  updated_at?: string
}

interface WantedListStats {
  total_releases: number
  active_alerts: number
  price_matched: number
  underpriced: number
}

export default function WantedListPage() {
  const { user } = useApp()
  const [entries, setEntries] = useState<WantedListEntry[]>([])
  const [stats, setStats] = useState<WantedListStats>({
    total_releases: 0,
    active_alerts: 0,
    price_matched: 0,
    underpriced: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const apiClient = new ApiClient(user?.accessToken, user?.accessTokenSecret)

  useEffect(() => {
    if (user?.id) {
      fetchWantedList()
    }
  }, [user?.id])

  const fetchWantedList = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get('/wanted-list/')
      setEntries(response.data || [])
      
      // Calculate stats
      const entriesData = response.data || []
      const newStats = {
        total_releases: entriesData.length,
        active_alerts: entriesData.filter((e: WantedListEntry) => e.is_active).length,
        price_matched: entriesData.filter((e: WantedListEntry) => e.status === 'price_matched').length,
        underpriced: entriesData.filter((e: WantedListEntry) => e.status === 'underpriced').length
      }
      setStats(newStats)
      
    } catch (error: any) {
      console.error('Failed to fetch wanted list:', error)
      toast.error(error.response?.data?.detail || 'Failed to load wanted list. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, apiClient])

  const handleAddRelease = async (releaseData: any) => {
    if (!user?.id) return
    
    try {
      await apiClient.post('/wanted-list/', releaseData)
      toast.success('Release added to wanted list!')
      await fetchWantedList()
      setShowAddModal(false)
    } catch (error: any) {
      console.error('Failed to add release:', error)
      toast.error(error.response?.data?.detail || 'Failed to add release. Please try again.')
    }
  }

  const handleRefresh = () => {
    fetchWantedList()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'monitoring':
        return 'text-gray-600 dark:text-gray-400'
      case 'price_matched':
        return 'text-blue-600 dark:text-blue-400'
      case 'underpriced':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'no_listings':
        return 'text-red-600 dark:text-red-400'
      case 'paused':
        return 'text-gray-500 dark:text-gray-500'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'monitoring':
        return 'Monitoring'
      case 'price_matched':
        return 'Price Matched'
      case 'underpriced':
        return 'Underpriced'
      case 'no_listings':
        return 'No Listings'
      case 'paused':
        return 'Paused'
      default:
        return 'Unknown'
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Wanted List</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Monitor releases and get alerts when they match your criteria</p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ChartBarIcon className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Release
            </Button>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Releases</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_releases}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active_alerts}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Matched</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.price_matched}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Underpriced</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.underpriced}</div>
        </div>
      </div>

      {/* Wanted List Table */}
      <WantedListTable 
        entries={entries}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onUpdate={fetchWantedList}
      />

        {/* Add Release Modal */}
        {showAddModal && (
          <AddReleaseModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddRelease}
            user={user}
          />
        )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
