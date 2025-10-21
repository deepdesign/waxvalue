'use client'

import { useState, useMemo, forwardRef } from 'react'
import { clsx } from 'clsx'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button } from './Button'
import { FormField } from './FormField'
import { Badge } from './Badge'

export interface Column<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  pagination?: boolean
  searchable?: boolean
  pageSize?: number
  className?: string
  onRowClick?: (row: T, index: number) => void
  onSelectionChange?: (selectedRows: T[]) => void
  loading?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
}

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
}

type FilterConfig = {
  [key: string]: string
}

export const DataTable = forwardRef<HTMLDivElement, DataTableProps<any>>(
  <T,>({
    data,
    columns,
    sortable = true,
    filterable = false,
    selectable = false,
    pagination = true,
    searchable = true,
    pageSize = 10,
    className,
    onRowClick,
    onSelectionChange,
    loading = false,
    emptyMessage = "No data available",
    searchPlaceholder = "Search...",
    ...props
  }: DataTableProps<T>, ref: React.Ref<HTMLDivElement>) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
    const [filterConfig, setFilterConfig] = useState<FilterConfig>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [showFilters, setShowFilters] = useState(false)

    // Filter and sort data
    const processedData = useMemo(() => {
      let filtered = [...data]

      // Apply search
      if (searchQuery && searchable) {
        const searchableColumns = columns.filter(col => col.searchable !== false)
        filtered = filtered.filter(row =>
          searchableColumns.some(col => {
            const value = getNestedValue(row, col.key as string)
            return String(value).toLowerCase().includes(searchQuery.toLowerCase())
          })
        )
      }

      // Apply filters
      if (filterable) {
        Object.entries(filterConfig).forEach(([key, value]) => {
          if (value) {
            filtered = filtered.filter(row => {
              const rowValue = getNestedValue(row, key)
              return String(rowValue).toLowerCase().includes(value.toLowerCase())
            })
          }
        })
      }

      // Apply sorting
      if (sortConfig && sortable) {
        filtered.sort((a, b) => {
          const aValue = getNestedValue(a, sortConfig.key)
          const bValue = getNestedValue(b, sortConfig.key)
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1
          }
          return 0
        })
      }

      return filtered
    }, [data, searchQuery, filterConfig, sortConfig, columns, searchable, filterable, sortable])

    // Paginate data
    const paginatedData = useMemo(() => {
      if (!pagination) return processedData
      
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      return processedData.slice(startIndex, endIndex)
    }, [processedData, currentPage, pageSize, pagination])

    const totalPages = Math.ceil(processedData.length / pageSize)

    // Helper function to get nested values
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    // Handle sorting
    const handleSort = (key: string) => {
      if (!sortable) return
      
      setSortConfig(prev => {
        if (prev?.key === key) {
          return {
            key,
            direction: prev.direction === 'asc' ? 'desc' : 'asc'
          }
        }
        return { key, direction: 'asc' }
      })
    }

    // Handle row selection
    const handleRowSelect = (index: number) => {
      if (!selectable) return
      
      const newSelected = new Set(selectedRows)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedRows(newSelected)
      
      const selectedData = Array.from(newSelected).map(i => processedData[i])
      onSelectionChange?.(selectedData)
    }

    // Handle select all
    const handleSelectAll = () => {
      if (!selectable) return
      
      if (selectedRows.size === paginatedData.length) {
        setSelectedRows(new Set())
        onSelectionChange?.([])
      } else {
        const allIndices = new Set(paginatedData.map((_, index) => index))
        setSelectedRows(allIndices)
        onSelectionChange?.(paginatedData)
      }
    }

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
      setFilterConfig(prev => ({
        ...prev,
        [key]: value
      }))
      setCurrentPage(1)
    }

    // Clear all filters
    const clearFilters = () => {
      setFilterConfig({})
      setSearchQuery('')
    }

    const isAllSelected = selectedRows.size === paginatedData.length && paginatedData.length > 0
    const isIndeterminate = selectedRows.size > 0 && selectedRows.size < paginatedData.length

    if (loading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={clsx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)} {...props}>
        {/* Header with search and filters */}
        {(searchable || filterable) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {searchable && (
                <div className="flex-1">
                  <FormField
                    label=""
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    className="mb-0"
                  />
                </div>
              )}
              
              {filterable && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    leftIcon={<FunnelIcon className="h-4 w-4" />}
                  >
                    Filters
                  </Button>
                  
                  {(Object.keys(filterConfig).length > 0 || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      leftIcon={<XMarkIcon className="h-4 w-4" />}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Filter panel */}
            {showFilters && filterable && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columns
                    .filter(col => col.filterable !== false)
                    .map(col => (
                      <FormField
                        key={String(col.key)}
                        label={col.title}
                        placeholder={`Filter by ${col.title.toLowerCase()}`}
                        value={filterConfig[String(col.key)] || ''}
                        onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                        size="sm"
                        className="mb-0"
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {selectable && (
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                )}
                
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={clsx(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.className
                    )}
                    style={{ width: column.width }}
                  >
                    {sortable && column.sortable !== false ? (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        {column.title}
                        {sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )
                        )}
                      </button>
                    ) : (
                      column.title
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className={clsx(
                      'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                      onRowClick && 'cursor-pointer',
                      selectedRows.has(index) && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          onChange={() => handleRowSelect(index)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={clsx(
                          'px-6 py-4 text-sm text-gray-900 dark:text-gray-100',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.className
                        )}
                      >
                        {column.render 
                          ? column.render(getNestedValue(row, String(column.key)), row, index)
                          : getNestedValue(row, String(column.key))
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

DataTable.displayName = 'DataTable'
