'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { PriceSuggestion, FilterState } from '@/types'
import { FilterState as TableFilterState } from './FiltersBar'
import { ApiClient, RepriceResponse, RepriceItemResult, Decision } from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface InventoryReviewTableProps {
  filters?: TableFilterState
}

export function InventoryReviewTable({ filters }: InventoryReviewTableProps) {
  const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([])
  const [repriceResults, setRepriceResults] = useState<RepriceItemResult[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [editedPrice, setEditedPrice] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  const api = new ApiClient({ baseUrl: '/api/backend' })

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/backend/inventory/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      toast.error('Failed to load pricing suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((suggestion) => {
      if (!filters) return true

      // Status filter
      if (filters.status && filters.status !== '') {
        // This would need to be mapped from the suggestion data
        // For now, we'll assume all are "For Sale"
        if (filters.status !== 'For Sale') return false
      }

      // Format filter (would need to be added to suggestion data)
      if (filters.format && filters.format !== '') {
        // This would need to be mapped from the suggestion data
        // For now, we'll assume all are "Vinyl"
        if (filters.format !== 'Vinyl') return false
      }

      // Condition filter
      if (filters.condition && filters.condition !== '') {
        if (suggestion.condition !== filters.condition) return false
      }

      // Price range filter
      if (filters.priceRange?.min !== null && suggestion.currentPrice < filters.priceRange.min) {
        return false
      }
      if (filters.priceRange?.max !== null && suggestion.currentPrice > filters.priceRange.max) {
        return false
      }

      // Flagged only filter
      if (filters.showFlaggedOnly) {
        // This would need to be determined based on the suggestion
        // For now, we'll assume flagged items have confidence 'low'
        if (suggestion.confidence !== 'low') return false
      }

      return true
    })
  }, [suggestions, filters])

  const handleSelectItem = (listingId: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId)
    } else {
      newSelected.add(listingId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredSuggestions.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredSuggestions.map(s => s.listingId)))
    }
  }

  const handleApplyIndividual = async (listingId: number) => {
    try {
      setIsApplying(true)
      const response = await api.reprice({
        approved_listing_ids: [listingId],
        strategy_id: 'median_plus_8pct',
        params: { offset_value: 8 }
      }, { dry_run: false })

      // Update local state with results
      setRepriceResults(prev => [...prev, ...response.items])
      
      const item = response.items[0]
      if (item) {
        if (item.decision === 'user_applied') {
          toast.success(`Price updated: $${item.old_price.toFixed(2)} → $${item.new_price.toFixed(2)}`)
        } else if (item.decision === 'flagged') {
          toast.error(`Cannot apply: ${item.reason}`)
        }
      }
      
      fetchSuggestions() // Refresh data
    } catch (error: any) {
      console.error('Apply error:', error)
      toast.error(error.message || 'Failed to apply price change')
    } finally {
      setIsApplying(false)
    }
  }

  const handleDeclineIndividual = async (listingId: number) => {
    // For declining, we just remove from the UI and mark as declined
    // The actual declining could be handled by removing from suggestions
    toast.success('Suggestion declined')
    setSuggestions(prev => prev.filter(s => s.listingId !== listingId))
  }

  const handleBulkApply = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to apply')
      return
    }

    try {
      setIsApplying(true)
      const response = await api.reprice({
        approved_listing_ids: Array.from(selectedItems),
        strategy_id: 'median_plus_8pct',
        params: { offset_value: 8 }
      }, { dry_run: false })

      // Update local state with results
      setRepriceResults(prev => [...prev, ...response.items])
      
      // Show summary
      const { user_applied, flagged, errors } = response.summary
      if (user_applied > 0) {
        toast.success(`${user_applied} prices updated successfully`)
      }
      if (flagged > 0) {
        toast.error(`${flagged} items flagged for manual review`)
      }
      if (errors > 0) {
        toast.error(`${errors} errors occurred`)
      }
      
      setSelectedItems(new Set())
      fetchSuggestions() // Refresh data
    } catch (error: any) {
      console.error('Bulk apply error:', error)
      toast.error(error.message || 'Failed to apply bulk changes')
    } finally {
      setIsApplying(false)
    }
  }

  const handleBulkDecline = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to decline')
      return
    }

    // For bulk declining, we just remove from the UI
    toast.success(`${selectedItems.size} suggestions declined`)
    setSuggestions(prev => prev.filter(s => !selectedItems.has(s.listingId)))
    setSelectedItems(new Set())
  }

  const handleSimulateSelection = async () => {
    try {
      setIsLoading(true)
      const response = await api.simulate({
        scope: 'selection',
        filters: filters ? {
          status: filters.status,
          media: filters.condition ? [filters.condition] : undefined,
          price_range: filters.priceRange
        } : undefined,
        strategy_id: 'median_plus_8pct',
        params: { offset_value: 8 }
      })

      // Convert reprice results to suggestions for display
      const newSuggestions = response.items.map(item => ({
        listingId: item.listing_id,
        releaseId: 0, // Would need to be populated from actual data
        currentPrice: item.old_price,
        suggestedPrice: item.new_price,
        confidence: item.confidence > 0.8 ? 'high' as const : item.confidence > 0.5 ? 'medium' as const : 'low' as const,
        condition: 'Very Good Plus', // Would need to be populated from actual data
        sleeveCondition: 'Not Graded',
        basis: item.reason,
        reason: item.reason,
        reasoning: item.reason,
        marketData: {
          median: item.new_price,
          mean: item.new_price,
          min: item.old_price,
          max: item.new_price * 1.5,
          count: 10,
          p25: item.old_price,
          p75: item.new_price * 1.2,
          p90: item.new_price * 1.4,
          scarcity: 'medium' as const
        },
        release: undefined,
        artist: undefined
      }))

      setSuggestions(newSuggestions)
      setRepriceResults(response.items)
    } catch (error: any) {
      console.error('Simulation error:', error)
      toast.error(error.message || 'Failed to run simulation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEdit = (listingId: number, currentPrice: number) => {
    setEditingPrice(listingId)
    setEditedPrice(currentPrice.toString())
  }

  const handleSaveEdit = async (listingId: number) => {
    try {
      const newPrice = parseFloat(editedPrice)
      if (isNaN(newPrice) || newPrice <= 0) {
        toast.error('Please enter a valid price')
        return
      }

      const response = await fetch('/api/backend/inventory/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, newPrice }),
      })

      if (response.ok) {
        toast.success('Price updated successfully')
        setEditingPrice(null)
        setEditedPrice('')
        fetchSuggestions() // Refresh data
      } else {
        throw new Error('Failed to update price')
      }
    } catch (error) {
      console.error('Update price error:', error)
      toast.error('Failed to update price')
    }
  }

  const handleCancelEdit = () => {
    setEditingPrice(null)
    setEditedPrice('')
  }

  const getConfidenceBadge = (confidence: string) => {
    const styles = {
      high: 'badge badge-green',
      medium: 'badge badge-yellow',
      low: 'badge badge-red',
    }
    return <span className={styles[confidence as keyof typeof styles]}>{confidence}</span>
  }

  const getConditionBadge = (condition: string) => {
    const styles = {
      Mint: 'badge badge-green',
      'Near Mint': 'badge badge-green',
      'Very Good Plus': 'badge badge-blue',
      'Very Good': 'badge badge-yellow',
      Good: 'badge badge-yellow',
      Fair: 'badge badge-red',
      Poor: 'badge badge-red',
    }
    return <span className={styles[condition as keyof typeof styles] || 'badge'}>{condition}</span>
  }

  const getStatusBadge = (suggestion: any) => {
    // Check if we have reprice results for this suggestion
    const result = repriceResults.find(r => r.listing_id === suggestion.listingId)
    const decision = result?.decision

    if (decision === 'auto_applied') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Auto-applied
        </span>
      )
    }
    
    if (decision === 'user_applied') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Applied
        </span>
      )
    }
    
    if (decision === 'flagged') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Flagged
        </span>
      )
    }
    
    if (decision === 'simulated') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Simulated
        </span>
      )
    }
    
    // Fallback to confidence-based logic
    if (suggestion.confidence === 'low' || Math.abs(suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice > 0.25) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Review
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Normal
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Inventory Review</h2>
          <p className="text-sm text-gray-500">
            {filteredSuggestions.length} items with pricing suggestions
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline inline-flex items-center justify-center w-full sm:w-auto"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={handleSimulateSelection}
            disabled={isLoading}
            className="btn-secondary inline-flex items-center justify-center w-full sm:w-auto"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Simulating...' : 'Simulate'}
          </button>
          
          {selectedItems.size > 0 && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleBulkApply}
                disabled={isApplying}
                className="btn-primary inline-flex items-center justify-center w-full sm:w-auto"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isApplying ? 'Applying...' : `Apply Selected (${selectedItems.size})`}
              </button>
              <button
                onClick={handleBulkDecline}
                disabled={isApplying}
                className="btn-secondary inline-flex items-center justify-center w-full sm:w-auto"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Decline Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}

      {/* Desktop Table */}
      <div className="card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredSuggestions.length && filteredSuggestions.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Release
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuggestions.map((suggestion) => (
                <tr key={suggestion.listingId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(suggestion.listingId)}
                      onChange={() => handleSelectItem(suggestion.listingId)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={suggestion.release?.images?.[0]?.uri150 || '/placeholder-album.png'}
                          alt={suggestion.release?.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.release?.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {suggestion.artist?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getConditionBadge(suggestion.condition)}
                      {suggestion.sleeveCondition && (
                        <div className="text-xs text-gray-500">
                          Sleeve: {suggestion.sleeveCondition}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingPrice === suggestion.listingId ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => handleSaveEdit(suggestion.listingId)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>${suggestion.currentPrice.toFixed(2)}</span>
                        <button
                          onClick={() => handleStartEdit(suggestion.listingId, suggestion.currentPrice)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${suggestion.suggestedPrice.toFixed(2)}
                    </div>
                    <div className={`text-xs ${
                      suggestion.suggestedPrice > suggestion.currentPrice ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {suggestion.suggestedPrice > suggestion.currentPrice ? '+' : ''}
                      ${(suggestion.suggestedPrice - suggestion.currentPrice).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {suggestion.basis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getConfidenceBadge(suggestion.confidence)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(suggestion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApplyIndividual(suggestion.listingId)}
                        disabled={isApplying}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplying ? 'Applying...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => handleDeclineIndividual(suggestion.listingId)}
                        disabled={isApplying}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuggestions.length === 0 && (
          <div className="text-center py-12">
            <EyeSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {suggestions.length === 0 
                ? "Run a simulation to see pricing suggestions for your inventory."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="card text-center py-12">
            <EyeSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {suggestions.length === 0 
                ? "Run a simulation to see pricing suggestions for your inventory."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div key={suggestion.listingId} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(suggestion.listingId)}
                    onChange={() => handleSelectItem(suggestion.listingId)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.release?.title || `Release ${suggestion.listingId}`}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.artist?.name || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(suggestion)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</label>
                  <div className="mt-1">{getConditionBadge(suggestion.condition)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</label>
                  <div className="mt-1">{getConfidenceBadge(suggestion.confidence)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Price</span>
                  <span className="text-sm font-medium text-gray-900">${suggestion.currentPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Suggested Price</span>
                  <span className="text-sm font-medium text-primary-600">${suggestion.suggestedPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Change</span>
                  <span className={`text-sm font-medium ${suggestion.suggestedPrice >= suggestion.currentPrice ? 'text-green-600' : 'text-red-600'}`}>
                    {suggestion.suggestedPrice >= suggestion.currentPrice ? '+' : ''}${(suggestion.suggestedPrice - suggestion.currentPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => handleApplyIndividual(suggestion.listingId)}
                    disabled={isApplying}
                    className="btn-primary text-sm py-2 px-4 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => handleDeclineIndividual(suggestion.listingId)}
                    disabled={isApplying}
                    className="btn-outline text-sm py-2 px-4 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
