'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Skeleton } from '@/components/ui/Skeleton'

interface SummaryData {
  totalListings: number
  suggestedUpdates: number
  averageDelta: number
  lastRunDate: string
  isRunning: boolean
}

interface RunSummaryCardsProps {
  refreshTrigger?: number
}

export function RunSummaryCards({ refreshTrigger }: RunSummaryCardsProps) {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalListings: 0,
    suggestedUpdates: 0,
    averageDelta: 0,
    lastRunDate: '',
    isRunning: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  useEffect(() => {
    if (refreshTrigger) {
      fetchSummaryData()
    }
  }, [refreshTrigger])

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true)
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        console.error('No session ID found')
        setIsLoading(false)
        return
      }
      
      const response = await fetch(`/api/backend/dashboard/summary?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      } else {
        console.error('Failed to fetch summary data:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const cards = [
    {
      title: 'Total Listings For Sale',
      value: summaryData.totalListings.toLocaleString(),
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      change: null,
    },
    {
      title: 'Suggested Updates Found',
      value: summaryData.suggestedUpdates.toLocaleString(),
      icon: ArrowTrendingUpIcon,
      color: 'bg-green-500',
      change: summaryData.suggestedUpdates > 0 ? '+positive' : null,
    },
    {
      title: 'Average Delta vs Market',
      value: `${summaryData.averageDelta > 0 ? '+' : ''}${summaryData.averageDelta.toFixed(1)}%`,
      icon: CurrencyDollarIcon,
      color: summaryData.averageDelta >= 0 ? 'bg-green-500' : 'bg-red-500',
      change: summaryData.averageDelta > 0 ? '+positive' : summaryData.averageDelta < 0 ? '-negative' : null,
    },
    {
      title: 'Last Run Date',
      value: summaryData.lastRunDate ? new Date(summaryData.lastRunDate).toLocaleDateString() : 'Never',
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: null,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Pricing Overview</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Current status of your Discogs inventory</p>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : (
          cards.map((card, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                    <card.icon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {card.value}
                      </div>
                      {card.change && (
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          card.change.includes('positive') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {card.change.includes('positive') ? (
                            <ArrowTrendingUpIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                          )}
                          {card.change.includes('positive') ? 'Up' : 'Down'}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {/* Quick Stats */}
        {summaryData.suggestedUpdates > 0 && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">{summaryData.suggestedUpdates} items</span> have pricing suggestions available. 
                  Review them in the table below and apply changes as needed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

