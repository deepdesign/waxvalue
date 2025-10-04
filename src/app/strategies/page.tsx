'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StrategyForm } from '@/components/StrategyForm'
import { StrategyPresets } from '@/components/StrategyPresets'
import { Button } from '@/components/ui/Button'
import { Strategy } from '@/types'
import toast from 'react-hot-toast'

export default function StrategiesPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<any>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchStrategies()
    }
  }, [user])

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/backend/strategies')
      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies || [])
        
        // Find active strategy
        const active = data.strategies?.find((s: Strategy) => s.isActive)
        setActiveStrategy(active || null)
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
    }
  }

  const handleSaveStrategy = async (data: any) => {
    setIsFormLoading(true)
    try {
      const response = await fetch('/api/backend/strategies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchStrategies()
        setShowForm(false)
        setSelectedPreset(null)
      } else {
        throw new Error('Failed to save strategy')
      }
    } catch (error) {
      console.error('Strategy save error:', error)
      throw error
    } finally {
      setIsFormLoading(false)
    }
  }

  const handlePreviewStrategy = async (data: any) => {
    try {
      const response = await fetch('/api/backend/strategies/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const previewData = await response.json()
        console.log('Preview data:', previewData)
      } else {
        throw new Error('Failed to generate preview')
      }
    } catch (error) {
      console.error('Preview error:', error)
      throw error
    }
  }

  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset)
    setShowForm(true)
  }

  const handleApplyGlobally = async (strategyId: string) => {
    try {
      const response = await fetch('/api/backend/strategies/apply-globally', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategyId }),
      })

      if (response.ok) {
        toast.success('Strategy applied globally!')
      } else {
        throw new Error('Failed to apply strategy')
      }
    } catch (error) {
      console.error('Apply globally error:', error)
      toast.error('Failed to apply strategy globally')
    }
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
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Pricing Strategies</h1>
          <p className="mt-2 text-lg text-gray-600">Configure how WaxValue calculates suggested prices for your inventory</p>
        </div>

        {/* Active Strategy */}
        {activeStrategy && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-600 p-6 border-l-4 border-l-green-500 dark:border-l-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Active Strategy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeStrategy.name}</p>
              </div>
              <Button
                onClick={() => handleApplyGlobally(activeStrategy.id)}
                variant="primary"
                size="sm"
              >
                Apply Globally
              </Button>
            </div>
          </div>
        )}

        {/* Strategy Form */}
        {showForm && (
          <div className="space-y-6">
            {!selectedPreset && (
              <StrategyPresets onSelectPreset={handleSelectPreset} />
            )}
            
            <StrategyForm
              onSave={handleSaveStrategy}
              onPreview={handlePreviewStrategy}
              onCancel={() => {
                setShowForm(false)
                setSelectedPreset(null)
              }}
              initialData={selectedPreset?.strategy}
              isLoading={isFormLoading}
            />
          </div>
        )}

        {/* Existing Strategies */}
        {!showForm && strategies.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-600 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Existing Strategies</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your pricing strategies</p>
            </div>
            
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`p-4 border rounded-lg ${
                    strategy.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                      <p className="text-sm text-gray-500">
                        {strategy.anchor} + {strategy.offsetValue}
                        {strategy.offsetType === 'percentage' ? '%' : '$'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {strategy.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                      )}
                      <button
                        onClick={() => setActiveStrategy(strategy)}
                        className="text-sm text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showForm && strategies.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No strategies yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first pricing strategy to get started with automated pricing.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="primary"
            >
              Create Strategy
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
