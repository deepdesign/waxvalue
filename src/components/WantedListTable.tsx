'use client'

import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

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

interface WantedListTableProps {
  entries: WantedListEntry[]
  isLoading: boolean
  onRefresh: () => void
  onUpdate: () => void
}

export function WantedListTable({ entries, isLoading, onRefresh, onUpdate }: WantedListTableProps) {
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null)

  const handleEdit = (entryId: string) => {
    setEditingEntry(entryId)
    // TODO: Open edit modal
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to remove this release from your wanted list?')) {
      return
    }

    try {
      setDeletingEntry(entryId)
      
      const response = await fetch(`/api/backend/wanted-list/${entryId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      onUpdate()
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setDeletingEntry(null)
    }
  }

  const handleToggleActive = async (entryId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/backend/wanted-list/${entryId}/toggle`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle entry')
      }

      onUpdate()
    } catch (error) {
      console.error('Failed to toggle entry:', error)
      alert('Failed to update entry. Please try again.')
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    if (!isActive) {
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`
    }

    switch (status) {
      case 'monitoring':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`
      case 'price_matched':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
      case 'underpriced':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
      case 'no_listings':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`
      case 'paused':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`
    }
  }

  const getStatusText = (status: string, isActive: boolean) => {
    if (!isActive) return 'Paused'
    
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

  const formatPrice = (price?: number, currency: string = 'USD') => {
    if (!price) return 'Any'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No releases in your wanted list
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Add releases you want to monitor and get alerts when they match your criteria.
          </p>
          <Button onClick={onRefresh}>
            Add Your First Release
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Wanted List ({entries.length})
        </h2>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Release
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Alert Criteria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Checked
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {/* Release Info */}
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {entry.cover_image_url ? (
                      <img
                        src={entry.cover_image_url}
                        alt={entry.release_title}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.release_title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {entry.artist_name}
                      </div>
                      {entry.release_year && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {entry.release_year} • {entry.release_format}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Alert Criteria */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white space-y-1">
                    <div>Max Price: {formatPrice(entry.max_price, entry.max_price_currency)}</div>
                    {entry.min_condition && (
                      <div>Min Condition: {entry.min_condition}</div>
                    )}
                    {entry.underpriced_percentage && (
                      <div>Underpriced: {entry.underpriced_percentage}%</div>
                    )}
                    {entry.location_filter && (
                      <div>Location: {entry.location_filter}</div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={getStatusBadge(entry.status, entry.is_active)}>
                    {getStatusText(entry.status, entry.is_active)}
                  </span>
                </td>

                {/* Last Checked */}
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(entry.last_checked)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip content="View on Discogs">
                      <a
                        href={`https://www.discogs.com/release/${entry.discogs_release_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </Tooltip>

                    <Tooltip content={entry.is_active ? "Pause monitoring" : "Resume monitoring"}>
                      <button
                        onClick={() => handleToggleActive(entry.id, entry.is_active)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {entry.is_active ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>
                    </Tooltip>

                    <Tooltip content="Edit criteria">
                      <button
                        onClick={() => handleEdit(entry.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Remove from wanted list">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingEntry === entry.id}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              {/* Header with cover and title */}
              <div className="flex items-start gap-3 mb-3">
                {entry.cover_image_url ? (
                  <img
                    src={entry.cover_image_url}
                    alt={entry.release_title}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.release_title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {entry.artist_name}
                  </div>
                  {entry.release_year && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {entry.release_year} • {entry.release_format}
                    </div>
                  )}
                </div>
                <span className={getStatusBadge(entry.status, entry.is_active)}>
                  {getStatusText(entry.status, entry.is_active)}
                </span>
              </div>

              {/* Criteria */}
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <div>Max Price: {formatPrice(entry.max_price, entry.max_price_currency)}</div>
                {entry.min_condition && <div>Min Condition: {entry.min_condition}</div>}
                {entry.underpriced_percentage && <div>Underpriced: {entry.underpriced_percentage}%</div>}
                <div>Last Checked: {formatDate(entry.last_checked)}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.discogs.com/release/${entry.discogs_release_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                  
                  <button
                    onClick={() => handleToggleActive(entry.id, entry.is_active)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {entry.is_active ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(entry.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingEntry === entry.id}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
