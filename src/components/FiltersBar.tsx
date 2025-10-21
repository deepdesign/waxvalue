'use client'

import { useState } from 'react'
import {
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Tooltip } from '@/components/ui/Tooltip'

export interface FilterState {
  status: string // underpriced, overpriced, fairly_priced, all
  priceDirection: string // underpriced, overpriced, all
  condition: string
  priceRange: {
    min: number | null
    max: number | null
  }
  showFlaggedOnly: boolean
  showFairlyPriced: boolean
}

interface FiltersBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
  totalItems: number
  filteredItems: number
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'underpriced', label: 'Underpriced' },
  { value: 'overpriced', label: 'Overpriced' },
  { value: 'fairly_priced', label: 'Fairly priced' },
]

const priceDirectionOptions = [
  { value: '', label: 'All Changes' },
  { value: 'underpriced', label: 'Underpriced' },
  { value: 'overpriced', label: 'Overpriced' },
]

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'M', label: 'Mint (M)' },
  { value: 'NM', label: 'Near Mint (NM)' },
  { value: 'VG+', label: 'Very Good Plus (VG+)' },
  { value: 'VG', label: 'Very Good (VG)' },
  { value: 'G+', label: 'Good Plus (G+)' },
  { value: 'G', label: 'Good (G)' },
  { value: 'F', label: 'Fair (F)' },
  { value: 'P', label: 'Poor (P)' },
]

export function FiltersBar({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  totalItems, 
  filteredItems 
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : Number(value)
    onFiltersChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [field]: numValue,
      },
    })
  }

  const hasActiveFilters = 
    filters.status !== '' ||
    filters.priceDirection !== '' ||
    filters.condition !== '' ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.showFlaggedOnly ||
    !filters.showFairlyPriced

  // This component now renders just the filters button and expandable panel
  return (
    <div className="relative">
      {/* Filters Button */}
      <Tooltip 
        content={
          <div>
            <p className="font-medium mb-1">Filter Inventory</p>
            <p className="text-xs opacity-90">
              Filter your pricing suggestions by status, price direction, condition, price range, and flagged items.
            </p>
          </div>
        }
        placement="bottom"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200">
              Active
            </span>
          )}
        </button>
      </Tooltip>

      {/* Expandable Filters Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-6 min-w-[600px] max-w-[800px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filter Inventory</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredItems} of {totalItems} items
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pricing Status
              </label>
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors appearance-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Direction Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Direction
              </label>
              <div className="relative">
                <select
                  value={filters.priceDirection}
                  onChange={(e) => handleFilterChange('priceDirection', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors appearance-none"
                >
                  {priceDirectionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <div className="relative">
                <select
                  value={filters.condition}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors appearance-none"
                >
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range
              </label>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min || ''}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors appearance-none bg-no-repeat bg-right bg-[length:16px_16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzZiNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')]"
                  step="0.01"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max || ''}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors appearance-none bg-no-repeat bg-right bg-[length:16px_16px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzZiNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')]"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Flagged Only Toggle */}
            <div className="flex items-end">
              <Tooltip 
                content={
                  <div>
                    <p className="font-medium mb-1">Show Flagged Items Only</p>
                    <p className="text-xs opacity-90">
                      Display only items that have been flagged for manual review due to unusual price changes or low confidence scores.
                    </p>
                  </div>
                }
                placement="top"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showFlaggedOnly}
                    onChange={(e) => handleFilterChange('showFlaggedOnly', e.target.checked)}
                    className="table-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Show flagged only
                  </span>
                </label>
              </Tooltip>
            </div>

            {/* Show Fairly Priced Toggle */}
            <div className="flex items-end">
              <Tooltip 
                content={
                  <div>
                    <p className="font-medium mb-1">Show Fairly Priced Items</p>
                    <p className="text-xs opacity-90">
                      Display items that are priced within the minimum change threshold. Checked by default to show all items.
                    </p>
                  </div>
                }
                placement="top"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showFairlyPriced !== false}
                    onChange={(e) => handleFilterChange('showFairlyPriced', e.target.checked)}
                    className="table-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Show fairly priced{' '}
                    <a
                      href="/settings"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                      title="Adjust threshold in settings"
                    >
                      ($1 threshold)
                    </a>
                  </span>
                </label>
              </Tooltip>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.status && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', '')}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.priceDirection && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                    {filters.priceDirection === 'underpriced' ? 'Underpriced' : 'Overpriced'}
                    <button
                      onClick={() => handleFilterChange('priceDirection', '')}
                      className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.condition && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                    Condition: {filters.condition}
                    <button
                      onClick={() => handleFilterChange('condition', '')}
                      className="ml-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                    Price: ${filters.priceRange.min || 0} - ${filters.priceRange.max || '∞'}
                    <button
                      onClick={() => handleFilterChange('priceRange', { min: null, max: null })}
                      className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.showFlaggedOnly && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                    Flagged only
                    <button
                      onClick={() => handleFilterChange('showFlaggedOnly', false)}
                      className="ml-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {!filters.showFairlyPriced && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                    Hiding fairly priced
                    <button
                      onClick={() => handleFilterChange('showFairlyPriced', true)}
                      className="ml-1 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}