'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { RunLog, SimulationResult } from '@/types'
import toast from 'react-hot-toast'

interface SummaryData {
  totalListings: number
  suggestedUpdates: number
  averageDelta: number
  lastRunDate: string
  isRunning: boolean
}

export function RunSummaryCards() {
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

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/backend/dashboard/summary')
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSimulation = async () => {
    try {
      setSummaryData(prev => ({ ...prev, isRunning: true }))
      const response = await fetch('/api/backend/simulate', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success('Simulation completed successfully!')
        fetchSummaryData() // Refresh data
      } else {
        throw new Error('Simulation failed')
      }
    } catch (error) {
      console.error('Simulation error:', error)
      toast.error('Failed to run simulation')
    } finally {
      setSummaryData(prev => ({ ...prev, isRunning: false }))
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
          <div key={i} className="card animate-pulse">
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
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Pricing Overview</h2>
          <p className="text-sm text-gray-500">Current status of your Discogs inventory</p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dryRun"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="dryRun" className="text-sm text-gray-700">
              Dry Run Mode
            </label>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={summaryData.isRunning}
            className="btn-primary inline-flex items-center justify-center w-full sm:w-auto"
          >
            {summaryData.isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-medium text-gray-900">
                      {card.value}
                    </div>
                    {card.change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        card.change.includes('positive') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change.includes('positive') ? (
                          <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {card.change.includes('positive') ? 'Up' : 'Down'}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      {summaryData.suggestedUpdates > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{summaryData.suggestedUpdates} items</span> have pricing suggestions available. 
                Review them in the table below and apply changes as needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

