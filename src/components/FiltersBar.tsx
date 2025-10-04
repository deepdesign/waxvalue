'use client'

import { useState } from 'react'
import {
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

export interface FilterState {
  status: string
  format: string
  condition: string
  priceRange: {
    min: number | null
    max: number | null
  }
  showFlaggedOnly: boolean
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
  { value: 'For Sale', label: 'For Sale' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Sold', label: 'Sold' },
]

const formatOptions = [
  { value: '', label: 'All Formats' },
  { value: 'Vinyl', label: 'Vinyl' },
  { value: 'CD', label: 'CD' },
  { value: 'Cassette', label: 'Cassette' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Other', label: 'Other' },
]

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'Mint', label: 'Mint' },
  { value: 'Near Mint', label: 'Near Mint' },
  { value: 'Very Good Plus', label: 'Very Good Plus' },
  { value: 'Very Good', label: 'Very Good' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
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
    filters.format !== '' ||
    filters.condition !== '' ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.showFlaggedOnly

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 w-full sm:w-auto justify-center sm:justify-start"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Active
              </span>
            )}
          </button>
          
          <div className="text-sm text-gray-500 text-center sm:text-left">
            Showing {filteredItems} of {totalItems} items
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 w-full sm:w-auto"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={filters.format}
              onChange={(e) => handleFilterChange('format', e.target.value)}
              className="input-field"
            >
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="input-field"
            >
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange.min || ''}
                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                className="input-field flex-1"
                step="0.01"
                min="0"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange.max || ''}
                onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                className="input-field flex-1"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Flagged Only Toggle */}
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showFlaggedOnly}
                onChange={(e) => handleFilterChange('showFlaggedOnly', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Show flagged only
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.format && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Format: {filters.format}
                <button
                  onClick={() => handleFilterChange('format', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.condition && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Condition: {filters.condition}
                <button
                  onClick={() => handleFilterChange('condition', '')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Price: ${filters.priceRange.min || 0} - ${filters.priceRange.max || '∞'}
                <button
                  onClick={() => handleFilterChange('priceRange', { min: null, max: null })}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.showFlaggedOnly && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Flagged only
                <button
                  onClick={() => handleFilterChange('showFlaggedOnly', false)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
