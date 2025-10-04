'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StrategyForm } from '@/components/StrategyForm'
import { StrategyPresets } from '@/components/StrategyPresets'
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing Strategies</h1>
            <p className="text-gray-600">Configure how WaxValue calculates suggested prices for your inventory</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center"
          >
            Create Strategy
          </button>
        </div>

        {/* Active Strategy */}
        {activeStrategy && (
          <div className="card border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Active Strategy</h3>
                <p className="text-sm text-gray-500">{activeStrategy.name}</p>
              </div>
              <button
                onClick={() => handleApplyGlobally(activeStrategy.id)}
                className="btn-primary"
              >
                Apply Globally
              </button>
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
              initialData={selectedPreset?.strategy}
              isLoading={isFormLoading}
            />
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowForm(false)
                  setSelectedPreset(null)
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Strategies */}
        {!showForm && strategies.length > 0 && (
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Existing Strategies</h3>
              <p className="text-sm text-gray-500">Manage your pricing strategies</p>
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
                        <span className="badge badge-green">Active</span>
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
          <div className="card text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first pricing strategy to get started with automated pricing.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Create Strategy
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
