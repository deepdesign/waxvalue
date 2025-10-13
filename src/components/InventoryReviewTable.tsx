'use client'

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
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
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { PriceSuggestion, FilterState } from '@/types'
import { FilterState as TableFilterState } from './FiltersBar'
import { ApiClient, RepriceResponse, RepriceItemResult, Decision } from '@/lib/apiClient'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { loadUserSettings, UserSettings } from '@/lib/userSettings'
import toast from 'react-hot-toast'
import { useInventory } from '@/contexts/InventoryContext'
import { VinylFactsCard } from '@/components/VinylFactsCard'

interface InventoryReviewTableProps {
  filters?: TableFilterState
  onFiltersChange?: (filters: TableFilterState) => void
}

export interface InventoryReviewTableRef {
  simulate: () => void
  isLoading: boolean
}

export const InventoryReviewTable = forwardRef<InventoryReviewTableRef, InventoryReviewTableProps>(
  ({ filters: _filters, onFiltersChange }, ref) => {
  // Use global inventory state from context (persists across navigation)
  const { 
    suggestions, 
    setSuggestions, 
    isLoading, 
    setIsLoading, 
    inventoryCount, 
    setInventoryCount, 
    actualTotalItems, 
    setActualTotalItems,
    hasInitialized,
    setHasInitialized,
    sortConfig,
    setSortConfig,
    filters,
    setFilters
  } = useInventory()
  
  // Local component state
  const [repriceResults, setRepriceResults] = useState<RepriceItemResult[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [processingProgress, setProcessingProgress] = useState(() => {
    // Restore progress from localStorage on mount
    try {
      const saved = localStorage.getItem('waxvalue_analysis_progress')
      if (saved) {
        const progress = JSON.parse(saved)
        if (progress.isRunning) {
          return {
            current: progress.current || 0,
            total: progress.total || 0,
            startTime: progress.startTime || Date.now(),
            estimatedTimeRemaining: 0,
            isImporting: true
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore progress:', e)
    }
    return {
      current: 0,
      total: 0,
      startTime: 0,
      estimatedTimeRemaining: 0,
      isImporting: false
    }
  })
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false)
  const [lastRunDate, setLastRunDate] = useState<string | null>(null)
  const [isCountingInventory, setIsCountingInventory] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>(loadUserSettings())

  // Function to fetch inventory count
  const fetchInventoryCount = async () => {
    try {
      setIsCountingInventory(true)
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) return
      
      const response = await fetch(`/api/backend/inventory/count?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setInventoryCount(data.totalForSale || 0)
        setActualTotalItems(data.totalForSale || 0)
      }
    } catch (error) {
      console.error('Failed to fetch inventory count:', error)
    } finally {
      setIsCountingInventory(false)
    }
  }

  // Function to fetch last run date
  const fetchLastRunDate = async () => {
    try {
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) return
      
      const response = await fetch(`/api/backend/dashboard/summary?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setLastRunDate(data.lastRunDate)
      }
    } catch (error) {
      // Silently fail - this is not a critical feature
      // The dashboard will still work without the last run date
    }
  }

  // Function to update progress tracking
  const updateProgress = (current: number, total: number) => {
    const now = Date.now()
    const elapsed = now - processingProgress.startTime
    const rate = current / (elapsed / 1000) // items per second
    
    // Save progress to localStorage for background monitoring
    const progressData = {
      isRunning: current < total,
      current,
      total,
      startTime: processingProgress.startTime
    }
    localStorage.setItem('waxvalue_analysis_progress', JSON.stringify(progressData))
    const remaining = total - current
    const estimatedTimeRemaining = rate > 0 ? (remaining / rate) * 1000 : 0

    setProcessingProgress(prev => ({
      ...prev,
      current,
      total,
      estimatedTimeRemaining
    }))
  }

  // Real progress tracking - no simulation needed since we get real data from backend
  const [isApplying, setIsApplying] = useState(false)
  const [applyingItems, setApplyingItems] = useState<Set<number>>(new Set())
  const [appliedItems, setAppliedItems] = useState<Set<number>>(new Set()) // Track successfully applied items (for visual state)
  const [fadingItems, setFadingItems] = useState<Set<number>>(new Set()) // Track items that are fading out
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [editedPrice, setEditedPrice] = useState<string>('')
  const [factsKey, setFactsKey] = useState(Date.now()) // Force new random facts on each processing
  
  // Use sortConfig from context (persists across navigation)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(userSettings.itemsPerPage)
  
  // Bulk selection state
  const [isSelectAll, setIsSelectAll] = useState(false)
  const api = new ApiClient({ baseUrl: '/api/backend' })

  useEffect(() => {
    // Ensure sortConfig is set to default (priceDelta desc) if not already set
    if (!sortConfig.key) {
      setSortConfig({
        key: 'priceDelta',
        direction: 'desc'
      })
    }
    
    // Check if analysis is still running (restored from localStorage)
    const progressData = localStorage.getItem('waxvalue_analysis_progress')
    const analysisStillRunning = progressData ? JSON.parse(progressData).isRunning : false
    
    // Only fetch suggestions if we haven't initialized yet
    // This prevents unnecessary refetches when navigating back to the dashboard
    if (!hasInitialized) {
      // Don't set loading true here - let fetchSuggestions handle it
      // This prevents flickering when cached data is returned instantly
      fetchSuggestions()
    } else if (analysisStillRunning) {
      // Analysis is still running from a previous session - restore loading state
      setIsLoading(true)
      // Trigger fetch to get latest progress
      fetchSuggestions()
    } else {
      // We already have data, ensure loading is false and clear any progress
      setIsLoading(false)
      localStorage.removeItem('waxvalue_analysis_progress')
    }
    fetchLastRunDate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = loadUserSettings()
      setUserSettings(newSettings)
      setItemsPerPage(newSettings.itemsPerPage)
      // Only update sortConfig if user changes default sort in settings
      // Don't override if user has manually changed sorting
      if (newSettings.defaultSort) {
        setSortConfig({
          key: newSettings.defaultSort as 'currentPrice' | 'priceDelta' | null,
          direction: 'desc'
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any ongoing requests when component unmounts
      console.log('Component unmounting - cleaning up streaming requests')
    }
  }, [])



  // Expose the simulate function to parent component
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(ref, () => ({
    simulate: handleSimulateSelection,
    isLoading
  }), [isLoading])

  const fetchSuggestions = async () => {
    let abortController: AbortController | null = null
    
    try {
      setIsLoading(true)
      setFactsKey(Date.now()) // Generate new random facts for this session
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        setIsLoading(false)
        return
      }
      
      // Check if there's existing progress (rejoining analysis) or starting fresh
      const existingProgress = localStorage.getItem('waxvalue_analysis_progress')
      const isRejoining = existingProgress ? JSON.parse(existingProgress).isRunning : false
      
      if (isRejoining) {
        console.log('Rejoining analysis in progress...')
        // Keep existing progress, just ensure importing state is set
        setProcessingProgress(prev => ({
          ...prev,
          isImporting: true
        }))
      } else {
        console.log('Starting fresh analysis with progress tracking...')
        // Set importing state and start progress tracking
        setProcessingProgress({
          current: 0,
          total: 0,
          startTime: Date.now(),
          estimatedTimeRemaining: 0,
          isImporting: true
        })
        
        // Save to localStorage for background monitoring
        const initialProgress = {
          isRunning: true,
          current: 0,
          total: 0,
          startTime: Date.now()
        }
        localStorage.setItem('waxvalue_analysis_progress', JSON.stringify(initialProgress))
      }
      
      // Create abort controller for this request
      abortController = new AbortController()
      
      let response: Response
      try {
        response = await fetch(`/api/backend/inventory/suggestions/stream?session_id=${sessionId}`, {
          signal: abortController.signal
        })
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          // Request was aborted - this is normal when navigating away
          console.log('Stream request aborted (user navigated away)')
          return
        }
        throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server'}`)
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          // Session expired or invalid - redirect to login
          localStorage.removeItem('waxvalue_session_id')
          localStorage.removeItem('waxvalue_user')
          window.location.href = '/auth'
          return
        }
        if (response.status === 500) {
          toast.error('Server error while processing inventory. Please try again or check your Discogs seller settings.')
          setIsLoading(false)
          return
        }
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const newSuggestions: PriceSuggestion[] = []
      
      if (!reader) {
        throw new Error('No response body reader available')
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                switch (data.type) {
                  case 'total':
                    setProcessingProgress(prev => ({
                      ...prev,
                      total: data.total
                    }))
                    setInventoryCount(data.total)
                    setActualTotalItems(data.total)
                    // Save to localStorage for banner
                    localStorage.setItem('waxvalue_analysis_progress', JSON.stringify({
                      isRunning: true,
                      current: 0,
                      total: data.total,
                      startTime: processingProgress.startTime
                    }))
                    break
                    
                  case 'progress':
                    setProcessingProgress(prev => ({
                      ...prev,
                      current: data.current,
                      total: data.total
                    }))
                    // Save to localStorage for banner
                    localStorage.setItem('waxvalue_analysis_progress', JSON.stringify({
                      isRunning: true,
                      current: data.current,
                      total: data.total,
                      startTime: processingProgress.startTime
                    }))
                    break
                    
                  case 'suggestion':
                    newSuggestions.push(data.suggestion)
                    break
                    
                  case 'complete':
                    // Add originalIndex to maintain stable sort order during user interactions
                    const suggestionsWithIndex = (data.suggestions || []).map((s: any, index: number) => ({
                      ...s,
                      originalIndex: index
                    }))
                    setSuggestions(suggestionsWithIndex)
                    setRepriceResults(data.repriceResults || [])
                    setProcessingProgress({
                      current: data.totalItems,
                      total: data.totalItems,
                      startTime: processingProgress.startTime,
                      estimatedTimeRemaining: 0,
                      isImporting: false
                    })
                    setHasProcessedInitial(true)
                    setHasInitialized(true)
                    setIsLoading(false) // Stop loading when analysis completes
                    // Mark that we have data (prevents auto-fetch on refresh and flicker)
                    localStorage.setItem('waxvalue_has_data', 'true')
                    // Clear progress from localStorage as analysis is complete
                    localStorage.removeItem('waxvalue_analysis_progress')
                    break
                    
                  case 'error':
                    // Handle "already in progress" gracefully - keep loading state active
                    if (data.error?.includes('already in progress')) {
                      console.info('Analysis already running, will continue polling')
                      // Ensure isImporting stays true to keep loading screen visible
                      setProcessingProgress(prev => ({
                        ...prev,
                        isImporting: true
                      }))
                      // Load any cached suggestions to show partial progress
                      try {
                        const cachedResponse = await fetch(`/api/backend/inventory/suggestions?session_id=${sessionId}`)
                        if (cachedResponse.ok) {
                          const cachedData = await cachedResponse.json()
                          if (cachedData.suggestions && cachedData.suggestions.length > 0) {
                            setSuggestions(cachedData.suggestions)
                            setRepriceResults(cachedData.repriceResults || [])
                            console.info(`Loaded ${cachedData.suggestions.length} cached suggestions while analysis continues`)
                          }
                        }
                      } catch (cacheError) {
                        console.warn('Could not load cached suggestions:', cacheError)
                      }
                      // Keep isLoading true and return to prevent finally block from running
                      return
                    }
                    throw new Error(data.error)
                    
                  case 'status':
                    // Optional: could show status messages
                    break
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError)
              }
            }
          }
        }
      } finally {
        // Clean up the reader
        try {
          reader.releaseLock()
        } catch (e) {
          // Reader might already be released
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      toast.error('Failed to load pricing suggestions')
      setProcessingProgress(prev => ({
        ...prev,
        isImporting: false
      }))
      setIsLoading(false)
      localStorage.removeItem('waxvalue_analysis_progress')
    }
    // NOTE: No finally block - isLoading(false) is set explicitly only when analysis completes or fails
    // This prevents the loading screen from closing during polling
  }

  const filteredAndSortedSuggestions = useMemo(() => {
    let filtered = suggestions.filter((suggestion) => {
      if (!filters) return true

      // Show fairly priced filter (hide items within threshold)
      if (filters.showFairlyPriced === false) {
        const priceDifference = Math.abs(suggestion.suggestedPrice - suggestion.currentPrice)
        if (priceDifference < (userSettings.minPriceChangeThreshold || 1)) return false
      }

      // Price Direction filter (underpriced, overpriced)
      if (filters.priceDirection && filters.priceDirection !== '') {
        if (filters.priceDirection === 'underpriced' && suggestion.status !== 'underpriced') return false
        if (filters.priceDirection === 'overpriced' && suggestion.status !== 'overpriced') return false
      }

      // Condition filter (M, NM, VG+, etc.)
      if (filters.condition && filters.condition !== '') {
        const suggestionCondition = suggestion.condition || ''
        if (!suggestionCondition.includes(filters.condition)) return false
      }

      // Price range filter (current price range)
      if (filters.priceRange?.min !== null && suggestion.currentPrice < filters.priceRange.min) {
        return false
      }
      if (filters.priceRange?.max !== null && suggestion.currentPrice > filters.priceRange.max) {
        return false
      }

      // Flagged only filter (items with large price differences)
      if (filters.showFlaggedOnly) {
        const priceDifference = Math.abs(suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice
        if (priceDifference < 0.25) return false
      }

      return true
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue
        
        if (sortConfig.key === 'priceDelta') {
          // Sort by price delta (suggested - current)
          // Positive delta = underpriced (needs increase) → shows at top
          // Negative delta = overpriced (needs decrease) → shows at bottom
          // desc: largest positive → zero → largest negative
          aValue = a.suggestedPrice - a.currentPrice
          bValue = b.suggestedPrice - b.currentPrice
        } else {
          // Sort by current price
          aValue = a[sortConfig.key!]
          bValue = b[sortConfig.key!]
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        
        // Use originalIndex as tiebreaker to maintain stable sort order
        const aIndex = (a as any).originalIndex ?? 0
        const bIndex = (b as any).originalIndex ?? 0
        return aIndex - bIndex
      })
    }

    return filtered
  }, [suggestions, filters, sortConfig])

  // Calculate pricing statistics
  const pricingStats = useMemo(() => {
    const overpriced = suggestions.filter(s => s.status === 'overpriced').length
    const underpriced = suggestions.filter(s => s.status === 'underpriced').length
    const fairlyPriced = suggestions.filter(s => s.status === 'fairly_priced').length
    const needsAction = overpriced + underpriced
    
    return { overpriced, underpriced, fairlyPriced, needsAction, total: suggestions.length }
  }, [suggestions])

  // Calculate pagination
  const totalItems = filteredAndSortedSuggestions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSuggestions = filteredAndSortedSuggestions.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, itemsPerPage])

  // Bulk selection handlers
  const handleSelectItem = (listingId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(listingId)) {
        newSet.delete(listingId)
      } else {
        newSet.add(listingId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedItems(new Set())
      setIsSelectAll(false)
    } else {
      const allIds = new Set(paginatedSuggestions.map(s => s.listingId))
      setSelectedItems(allIds)
      setIsSelectAll(true)
    }
  }

  const handleBulkApply = async () => {
    if (selectedItems.size === 0) return
    
    try {
      setIsApplying(true)
      const listingIds = Array.from(selectedItems)
      console.log('Bulk apply starting for listings:', listingIds)
      
      // Use the bulk apply API method
      const result = await api.bulkApply(listingIds) as any
      console.log('Bulk apply result:', result)
      
      // Show success message
      if (result.successful_updates > 0) {
        toast.success(`Successfully applied ${result.successful_updates} price changes`)
        
        // STEP 1: Mark all successfully applied items (buttons turn green IMMEDIATELY)
        setAppliedItems(prev => {
          const newSet = new Set(prev)
          listingIds.forEach(id => newSet.add(id))
          return newSet
        })
        
        // STEP 2: Store original prices for visual display (DON'T update currentPrice or status yet)
        setSuggestions(prevSuggestions => 
          prevSuggestions.map(s => 
            listingIds.includes(s.listingId) 
              ? { ...s, originalPrice: s.currentPrice }
              : s
          )
        )
        
        // STEP 3: After 2000ms pause (user sees green buttons for 2 seconds), THEN update data and trigger re-sort
        setTimeout(() => {
          setSuggestions(prevSuggestions => 
            prevSuggestions.map(s => {
              if (listingIds.includes(s.listingId)) {
                return {
                  ...s,
                  currentPrice: s.suggestedPrice, // Update price - triggers re-sort
                  status: 'fairly_priced' as const // Update status
                }
              }
              return s
            })
          )
        }, 2000)
      }
      
      if (result.errors > 0) {
        console.error('Bulk apply errors:', result.results)
        const failedItems = result.results?.filter((r: any) => !r.success) || []
        const errorMsg = failedItems.length > 0 && failedItems[0].error 
          ? failedItems[0].error 
          : 'Unknown error'
        toast.error(`${result.errors} items failed to update: ${errorMsg}`)
      }
      
      // Clear selection after successful apply
      setSelectedItems(new Set())
      setIsSelectAll(false)
      
      // Don't refresh - keep rows visible with updated state
      
    } catch (error: any) {
      console.error('Bulk apply failed:', error)
      toast.error(error.message || 'Failed to apply price changes')
    } finally {
      setIsApplying(false)
    }
  }

  const handleSort = (key: 'currentPrice' | 'priceDelta') => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Same column, toggle direction
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      } else {
        // New column, start with ascending
        return {
          key,
          direction: 'asc'
        }
      }
    })
  }

  const handleApplyIndividual = async (listingId: number) => {
    try {
      // Add this item to the applying set
      setApplyingItems(prev => new Set(prev).add(listingId))
      
      // Find the suggestion to get the suggested price
      const suggestion = suggestions.find(s => s.listingId === listingId)
      if (!suggestion) {
        throw new Error('Suggestion not found')
      }
      
      // Use the individual apply API method with the suggested price
      await api.applySuggestion(listingId, suggestion.suggestedPrice)
      
      // STEP 1: Mark as applied AND store original price (button turns green IMMEDIATELY)
      // Visual display will use originalPrice to show old→new, but actual data doesn't change yet
      setAppliedItems(prev => new Set(prev).add(listingId))
      
      // Store original price for visual display
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          s.listingId === listingId 
            ? { ...s, originalPrice: s.currentPrice }
            : s
        )
      )
      
      // STEP 2: Show success message
      toast.success(`Price updated to $${suggestion.suggestedPrice.toFixed(2)}`)
      
      // STEP 3: After 2000ms pause (user sees green button for 2 seconds), THEN update actual data and trigger re-sort
      setTimeout(() => {
        setSuggestions(prevSuggestions => 
          prevSuggestions.map(s => 
            s.listingId === listingId 
              ? { 
                  ...s,
                  currentPrice: s.suggestedPrice, // Update price - triggers re-sort
                  status: 'fairly_priced' as const // Update status
                }
              : s
          )
        )
      }, 2000)
      
    } catch (error: any) {
      console.error('Apply error:', error)
      toast.error(error.message || 'Failed to apply price change')
    } finally {
      // Remove this item from the applying set
      setApplyingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(listingId)
        return newSet
      })
    }
  }


  const handleSimulateSelection = async () => {
    try {
      setIsLoading(true)
      
      // Clear cached data flags to force fresh analysis
      localStorage.removeItem('waxvalue_has_data')
      
      // Clear cached data to force fresh analysis
      setHasInitialized(false)
      setSuggestions([])
      localStorage.removeItem('waxvalue_analysis_progress')
      
      // Get session ID from localStorage
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        throw new Error('No session found. Please login first.')
      }
      
      // Set importing state and start progress tracking
      setProcessingProgress({
        current: 0,
        total: 0,
        startTime: Date.now(),
        estimatedTimeRemaining: 0,
        isImporting: true
      })
      
      // Save to localStorage for background monitoring
      const initialProgress = {
        isRunning: true,
        current: 0,
        total: 0,
        startTime: Date.now()
      }
      localStorage.setItem('waxvalue_analysis_progress', JSON.stringify(initialProgress))
      
      // Try streaming endpoint first, fallback to regular endpoint
      let response = await fetch(`/api/backend/inventory/suggestions/stream?session_id=${sessionId}`)
      
      if (!response.ok) {
        console.warn('Streaming endpoint failed, falling back to regular endpoint')
        
        // Fallback to regular endpoint
        response = await fetch(`/api/backend/inventory/suggestions?session_id=${sessionId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 401) {
            // Session expired or invalid - redirect to login
            localStorage.removeItem('waxvalue_session_id')
            localStorage.removeItem('waxvalue_user')
            window.location.href = '/auth'
            return
          }
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
        }
        
        // Handle regular (non-streaming) response
        const data = await response.json()
        // Add originalIndex to maintain stable sort order
        const suggestionsWithIndex = (data.suggestions || []).map((s: any, index: number) => ({
          ...s,
          originalIndex: index
        }))
        setSuggestions(suggestionsWithIndex)
        setRepriceResults(data.repriceResults || [])
        
        // Update progress to show completion
        const actualTotal = data.totalItems || data.total || (data.suggestions?.length || 0)
        setProcessingProgress(prev => ({
          ...prev,
          current: actualTotal,
          total: actualTotal,
          isImporting: false
        }))
        setHasProcessedInitial(true)
        return
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const newSuggestions: PriceSuggestion[] = []
      
      if (!reader) {
        throw new Error('No response body reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'total':
                  setProcessingProgress(prev => ({
                    ...prev,
                    total: data.total
                  }))
                  setInventoryCount(data.total)
                  setActualTotalItems(data.total)
                  // Save to localStorage for banner
                  localStorage.setItem('waxvalue_analysis_progress', JSON.stringify({
                    isRunning: true,
                    current: 0,
                    total: data.total,
                    startTime: processingProgress.startTime
                  }))
                  break
                  
                case 'progress':
                  setProcessingProgress(prev => ({
                    ...prev,
                    current: data.current,
                    total: data.total
                  }))
                  // Save to localStorage for banner
                  localStorage.setItem('waxvalue_analysis_progress', JSON.stringify({
                    isRunning: true,
                    current: data.current,
                    total: data.total,
                    startTime: processingProgress.startTime
                  }))
                  break
                  
                case 'suggestion':
                  newSuggestions.push(data.suggestion)
                  // Don't update state yet - wait for 'complete' event to show all items at once
                  break
                  
                case 'complete':
                  // Add originalIndex to maintain stable sort order during user interactions
                  const suggestionsWithIndex = (data.suggestions || []).map((s: any, index: number) => ({
                    ...s,
                    originalIndex: index
                  }))
                  setSuggestions(suggestionsWithIndex)
                  setRepriceResults(data.repriceResults || [])
                  setProcessingProgress({
                    current: data.totalItems,
                    total: data.totalItems,
                    startTime: processingProgress.startTime,
                    estimatedTimeRemaining: 0,
                    isImporting: false
                  })
                  setHasProcessedInitial(true)
                  setHasInitialized(true)
                  setIsLoading(false) // Stop loading when analysis completes
                  // Mark that we have data (prevents auto-fetch on refresh and flicker)
                  localStorage.setItem('waxvalue_has_data', 'true')
                  // Clear progress from localStorage as analysis is complete
                  localStorage.removeItem('waxvalue_analysis_progress')
                  break
                  
                case 'error':
                  // Handle "already in progress" gracefully - keep loading state active
                  if (data.error?.includes('already in progress')) {
                    console.info('Analysis already running, will continue polling')
                    // Ensure isImporting stays true to keep loading screen visible
                    setProcessingProgress(prev => ({
                      ...prev,
                      isImporting: true
                    }))
                    // Keep isLoading true and return to prevent completion
                    return
                  }
                  throw new Error(data.error)
                  
                case 'status':
                  // Optional: could show status messages
                  break
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }
      
      // Check if analysis is actually complete - if stream ended without 'complete' event, keep polling
      const progressData = localStorage.getItem('waxvalue_analysis_progress')
      if (progressData) {
        const progress = JSON.parse(progressData)
        if (progress.isRunning) {
          // Analysis is still running - keep loading screen visible and poll for updates
          console.info('Stream ended but analysis still running, polling for completion...')
          setTimeout(() => {
            fetchSuggestions() // Poll again
          }, 3000) // Poll every 3 seconds
          return // Keep loading screen visible, don't run finally block
        }
      }
      
      // Analysis is complete - calculate actionable insights
      const totalAnalyzed = actualTotalItems || suggestions.length || newSuggestions.length
      const allSuggestions = suggestions.length > 0 ? suggestions : newSuggestions
      const needsAction = allSuggestions.filter(s => s.status === 'overpriced' || s.status === 'underpriced').length
      
      if (needsAction > 0) {
        toast.success(`Found ${needsAction} out of ${totalAnalyzed} items that need price adjustments`)
      } else if (totalAnalyzed > 0) {
        toast.success(`Analysis complete! All ${totalAnalyzed} items are fairly priced.`)
      }
      
      // Analysis complete - hide loading screen
      setIsLoading(false)
      setProcessingProgress(prev => ({ ...prev, isImporting: false }))
      localStorage.removeItem('waxvalue_analysis_progress')
    } catch (error: any) {
      console.error('Analysis failed:', error)
      toast.error('Failed to run pricing analysis. Make sure you are connected to Discogs.')
      setProcessingProgress(prev => ({
        ...prev,
        isImporting: false
      }))
      setIsLoading(false)
      localStorage.removeItem('waxvalue_analysis_progress')
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

  const handlePriceAdjust = async (listingId: number, adjustment: number) => {
    try {
      const suggestion = suggestions.find(s => s.listingId === listingId)
      if (!suggestion) return

      const newSuggestedPrice = Math.max(0, suggestion.suggestedPrice + adjustment)
      
      // Update the suggestion locally (optimistically)
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          s.listingId === listingId 
            ? { ...s, suggestedPrice: newSuggestedPrice }
            : s
        )
      )
      
      toast.success(`Suggested price ${adjustment > 0 ? 'increased' : 'decreased'} by $${Math.abs(adjustment)}`)
      
      // Optionally sync with backend (non-blocking)
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (sessionId) {
        fetch(`/api/backend/inventory/adjust-suggested-price?session_id=${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, newSuggestedPrice }),
        }).catch(err => {
          console.warn('Failed to sync price adjustment to backend:', err)
          // Silently fail - the local update already succeeded
        })
      }
    } catch (error) {
      console.error('Price adjustment error:', error)
      toast.error('Failed to adjust suggested price')
    }
  }


  // Map condition names to abbreviated codes
  const getConditionCode = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'Mint': 'M',
      'Near Mint': 'NM',
      'Very Good Plus': 'VG+',
      'Very Good': 'VG',
      'Good': 'G',
      'Fair': 'F',
      'Poor': 'P',
    }
    return conditionMap[condition] || condition
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

  const getConditionBadgeCompact = (condition: string) => {
    const styles = {
      Mint: 'badge badge-green',
      'Near Mint': 'badge badge-green',
      'Very Good Plus': 'badge badge-blue',
      'Very Good': 'badge badge-yellow',
      Good: 'badge badge-yellow',
      Fair: 'badge badge-red',
      Poor: 'badge badge-red',
    }
    return <span className={styles[condition as keyof typeof styles] || 'badge'}>{getConditionCode(condition)}</span>
  }


  // Show loading card when actively importing data (analysis running)
  // This ensures users see the fun facts loading screen during analysis
  if (isLoading && processingProgress.isImporting) {
    return (
      <div className="space-y-6">
        {/* Main Loading Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            {/* Spinner */}
            <div className="relative mb-6">
              <svg className="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 38.05">
                <path className="wave-line wave-line-1" d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"/>
                <path className="wave-line wave-line-2" d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"/>
                <path className="wave-line wave-line-3" d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H12.91Z"/>
                <path className="wave-line wave-line-4" d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H18.91Z"/>
                <path className="wave-line wave-line-5" d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H24.91Z"/>
                <path className="wave-line wave-line-6" d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H30.91Z"/>
                <path className="wave-line wave-line-7" d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H36.91Z"/>
                <path className="wave-line wave-line-8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10a1,1,0,0,0-1-1H42.91Z"/>
                <path className="wave-line wave-line-9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"/>
              </svg>
            </div>
            
            {/* Loading Message */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Analysing your inventory
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Pulling data from Discogs and calculating pricing suggestions. 
              <br />
              Due to API rate limits, this may take a few minutes for larger inventories.
            </p>
            
            {/* Progress Indicator with Gradient */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                style={{
                  width: `${isCountingInventory ? 25 : processingProgress.total > 0 ? Math.min((processingProgress.current / processingProgress.total) * 100, 100) : 0}%`
                }}
              ></div>
            </div>
            
            {/* Progress Details */}
            <div className="space-y-1">
              {isCountingInventory ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Counting your inventory items...
                </p>
              ) : processingProgress.isImporting && processingProgress.total > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Processing {processingProgress.current} of {processingProgress.total} items
                </p>
              ) : processingProgress.total > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Processing {processingProgress.current} of {processingProgress.total} items
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysing your Discogs inventory...
                </p>
              )}
              {processingProgress.estimatedTimeRemaining > 0 && !isCountingInventory && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Estimated time remaining: {Math.ceil(processingProgress.estimatedTimeRemaining / 1000)} seconds
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {isCountingInventory 
                  ? 'Getting inventory count from Discogs...'
                  : inventoryCount > 0 
                    ? `Found ${inventoryCount} items for sale in your inventory`
                    : 'Fetching inventory data from Discogs...'
                }
              </p>
            </div>
            
          </div>
        </div>

        {/* Vinyl Facts Card */}
        <VinylFactsCard key={factsKey} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pricing Suggestions Table - Responsive */}
      {(filteredAndSortedSuggestions.length > 0 || isLoading) && (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                Pricing suggestions
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Review and manage suggested price changes for your inventory</p>
            </div>
            {lastRunDate && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-3 w-3 mr-1" />
                Last run: {new Date(lastRunDate).toLocaleString('en-AU', { 
                  timeZone: 'Australia/Sydney',
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })} AEST
              </div>
            )}
          </div>
          
          {/* Pricing Summary Statistics */}
          {pricingStats.total > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              {/* Overpriced */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800/30">
                <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Overpriced</div>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{pricingStats.overpriced}</div>
                  <div className="text-sm text-red-600/70 dark:text-red-400/70">
                    ({pricingStats.total > 0 ? Math.round((pricingStats.overpriced / pricingStats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>
              
              {/* Underpriced */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800/30">
                <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Underpriced</div>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{pricingStats.underpriced}</div>
                  <div className="text-sm text-green-600/70 dark:text-green-400/70">
                    ({pricingStats.total > 0 ? Math.round((pricingStats.underpriced / pricingStats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>
              
              {/* Fairly Priced */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Fairly priced</div>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pricingStats.fairlyPriced}</div>
                  <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    ({pricingStats.total > 0 ? Math.round((pricingStats.fairlyPriced / pricingStats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Filters Row */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAndSortedSuggestions.length} of {actualTotalItems || suggestions.length} items for sale
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Price Direction Button Group */}
                <div className="grid grid-cols-3 sm:inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-theme-xs overflow-hidden">
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, priceDirection: '' }
                      setFilters(newFilters)
                      onFiltersChange?.(newFilters)
                    }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                      !filters?.priceDirection
                        ? 'bg-primary-600 dark:bg-primary-500 text-white'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-800 dark:hover:text-gray-200'
                    } sm:rounded-l-lg`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, priceDirection: 'underpriced' }
                      setFilters(newFilters)
                      onFiltersChange?.(newFilters)
                    }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors sm:border-l border-gray-200 dark:border-gray-700 ${
                      filters?.priceDirection === 'underpriced'
                        ? 'bg-primary-600 dark:bg-primary-500 text-white'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Underpriced
                  </button>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, priceDirection: 'overpriced' }
                      setFilters(newFilters)
                      onFiltersChange?.(newFilters)
                    }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors sm:border-l border-gray-200 dark:border-gray-700 sm:rounded-r-lg ${
                      filters?.priceDirection === 'overpriced'
                        ? 'bg-primary-600 dark:bg-primary-500 text-white'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Overpriced
                  </button>
                </div>

                {/* Show Fairly Priced Checkbox */}
                <div className="flex items-center">
                  <Tooltip 
                    content="Show items that are priced within the minimum change threshold. Most users prefer to hide these to focus on items needing price changes."
                    position="top"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters?.showFairlyPriced || false}
                        onChange={(e) => {
                          const newFilters = { ...filters, showFairlyPriced: e.target.checked }
                          setFilters(newFilters)
                          onFiltersChange?.(newFilters)
                        }}
                        className="table-checkbox"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        Show fairly priced
                      </span>
                    </label>
                  </Tooltip>
                </div>
              </div>

              {/* Refresh Analysis Button - Moved to right side */}
              <Tooltip 
                content="Re-analyse your entire Discogs inventory to get fresh pricing suggestions for all items"
                position="top"
              >
                <button
                  onClick={handleSimulateSelection}
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-400 shadow-theme-xs hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 disabled:opacity-50"
                >
                  <svg
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isLoading ? 'Refreshing...' : 'Refresh analysis'}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Bulk Actions Row */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setSelectedItems(new Set())
                  setIsSelectAll(false)
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkApply}
                disabled={isApplying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isApplying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply to selected
                  </>
                )}
              </button>
              
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="w-full overflow-x-auto hidden xl:block">
          <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="border-gray-200 border-y dark:border-gray-700">
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isSelectAll && paginatedSuggestions.length > 0}
                    onChange={handleSelectAll}
                    className="table-checkbox"
                  />
                </th>
                <th className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  RELEASE
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  CONDITION
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  ITEM ID
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('currentPrice')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    CURRENT PRICE
                    <svg className={`w-3 h-3 transition-transform ${
                      sortConfig.key === 'currentPrice' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('priceDelta')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    SUGGESTED PRICE
                    <svg className={`w-3 h-3 transition-transform ${
                      sortConfig.key === 'priceDelta' && sortConfig.direction === 'asc' ? 'rotate-180' : ''
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedSuggestions.map((suggestion) => (
                <tr 
                  key={suggestion.listingId} 
                  className={`${
                    appliedItems.has(suggestion.listingId)
                      ? 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <td className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(suggestion.listingId)}
                      onChange={() => handleSelectItem(suggestion.listingId)}
                      className="table-checkbox"
                    />
                  </td>
                  <td className="w-64 px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          className="h-16 w-16 rounded object-cover border border-gray-200 dark:border-gray-700"
                          src={suggestion.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMjggMjUuMzEzNyAyMC42ODYzIDI4IDE4IDI4QzI4IDMxLjMxMzcgMjAuNjg2MyAzNCAyNCAzNEMyNy4zMTM3IDM0IDMwIDMxLjMxMzcgMzAgMjhDMzAgMjUuMzEzNyAyNy4zMTM3IDI4IDMwIDI4QzMwIDI0LjY4NjMgMjcuMzEzNyAyMiAyNCAyMkMyNy4zMTM3IDIyIDMwIDE5LjMxMzcgMzAgMTZDMzAgMTIuNjg2MyAyNy4zMTM3IDEwIDI0IDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                          alt={suggestion.release?.title || 'Album cover'}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMjggMjUuMzEzNyAyMC42ODYzIDI4IDE4IDI4QzI4IDMxLjMxMzcgMjAuNjg2MyAzNCAyNCAzNEMyNy4zMTM3IDM0IDMwIDMxLjMxMzcgMzAgMjhDMzAgMjUuMzEzNyAyNy4zMTM3IDI4IDMwIDI4QzMwIDI0LjY4NjMgMjcuMzEzNyAyMiAyNCAyMkMyNy4zMTM3IDIyIDMwIDE5LjMxMzcgMzAgMTZDMzAgMTIuNjg2MyAyNy4zMTM3IDEwIDI0IDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                          {suggestion.title || 'Unknown Title'}
                        </div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                          {typeof suggestion.artist === 'object' ? (suggestion.artist as any)?.name : suggestion.artist || 'Unknown Artist'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {suggestion.label || 'Unknown Label'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-20 px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-0.5">
                      {suggestion.condition.split(', ').map((part, index) => (
                        <div key={index} className="leading-tight">
                          {part.includes(':') ? (
                            <>
                              <span className="text-gray-500 dark:text-gray-400">
                                {part.split(':')[0]}:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {part.split(':')[1]}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-900 dark:text-gray-100">
                              {part}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="w-20 px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://www.discogs.com/sell/item/${suggestion.listingId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono text-sm inline-flex items-center gap-1"
                    >
                      {suggestion.listingId}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="w-20 px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="font-medium">
                      {appliedItems.has(suggestion.listingId) && suggestion.originalPrice ? (
                        <div className="flex flex-col">
                          <span className="text-gray-400 dark:text-gray-500 line-through text-xs">
                            {formatCurrency(suggestion.originalPrice, suggestion.currency)}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatCurrency(suggestion.suggestedPrice, suggestion.currency)}
                          </span>
                        </div>
                      ) : (
                        formatCurrency(suggestion.currentPrice, suggestion.currency)
                      )}
                    </div>
                  </td>
                  <td className="w-20 px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(suggestion.suggestedPrice, suggestion.currency)}
                        </div>
                        <div className={`text-xs ${
                          suggestion.suggestedPrice > suggestion.currentPrice 
                            ? 'text-green-600 dark:text-green-400' 
                            : suggestion.suggestedPrice < suggestion.currentPrice 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {suggestion.suggestedPrice > suggestion.currentPrice ? '+' : ''}
                          {formatCurrency(suggestion.suggestedPrice - suggestion.currentPrice, suggestion.currency)}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <button
                          onClick={() => handlePriceAdjust(suggestion.listingId, 1)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Increase by $1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePriceAdjust(suggestion.listingId, -1)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Decrease by $1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="w-24 px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Tooltip 
                            content="Apply this price suggestion to update the item on Discogs"
                            position="top"
                          >
                            <button
                              onClick={() => handleApplyIndividual(suggestion.listingId)}
                              disabled={applyingItems.has(suggestion.listingId) || appliedItems.has(suggestion.listingId) || selectedItems.size > 0}
                              className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200 w-[72px] ${
                                appliedItems.has(suggestion.listingId)
                                  ? 'bg-green-600 hover:bg-green-600 disabled:opacity-100 focus:ring-green-500'
                                  : selectedItems.size > 0
                                  ? 'bg-gray-400 hover:bg-gray-400 focus:ring-gray-400 disabled:opacity-50'
                                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 disabled:opacity-50 disabled:bg-primary-600'
                              }`}
                            >
                              {applyingItems.has(suggestion.listingId) ? (
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : appliedItems.has(suggestion.listingId) ? (
                                <span className="flex items-center gap-1">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Applied
                                </span>
                              ) : 'Apply'}
                            </button>
                          </Tooltip>
                        </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="xl:hidden px-4 py-4 space-y-3">
          {paginatedSuggestions.map((suggestion) => (
            <div 
              key={suggestion.listingId} 
              className={`rounded-lg border p-3 relative ${
                appliedItems.has(suggestion.listingId)
                  ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Discogs Link and ID - Top Right */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <a
                  href={`https://www.discogs.com/sell/item/${suggestion.listingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-mono"
                  title={`View on Discogs: ${suggestion.listingId}`}
                >
                  {suggestion.listingId}
                </a>
                <a
                  href={`https://www.discogs.com/sell/item/${suggestion.listingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  title={`View on Discogs: ${suggestion.listingId}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedItems.has(suggestion.listingId)}
                  onChange={() => handleSelectItem(suggestion.listingId)}
                  className="table-checkbox mt-1 flex-shrink-0"
                />
                <div className="flex gap-2 flex-1 min-w-0 pr-8">
                  <img
                    className="h-14 w-14 rounded object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    src={suggestion.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMjggMjUuMzEzNyAyMC42ODYzIDI4IDE4IDI4QzI4IDMxLjMxMzcgMjAuNjg2MyAzNCAyNCAzNEMyNy4zMTM3IDM0IDMwIDMxLjMxMzcgMzAgMjhDMzAgMjUuMzEzNyAyNy4zMTM3IDI4IDMwIDI4QzMwIDI0LjY4NjMgMjcuMzEzNyAyMiAyNCAyMkMyNy4zMTM3IDIyIDMwIDE5LjMxMzcgMzAgMTZDMzAgMTIuNjg2MyAyNy4zMTM3IDEwIDI0IDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                    alt={suggestion.release?.title || 'Album cover'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMjggMjUuMzEzNyAyMC42ODYzIDI4IDE4IDI4QzI4IDMxLjMxMzcgMjAuNjg2MyAzNCAyNCAzNEMyNy4zMTM3IDM0IDMwIDMxLjMxMzcgMzAgMjhDMzAgMjUuMzEzNyAyNy4zMTM3IDI4IDMwIDI4QzMwIDI0LjY4NjMgMjcuMzEzNyAyMiAyNCAyMkMyNy4zMTM3IDIyIDMwIDE5LjMxMzcgMzAgMTZDMzAgMTIuNjg2MyAyNy4zMTM3IDEwIDI0IDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                   <div className="flex-1 min-w-0">
                     <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                       {suggestion.title || 'Unknown Title'}
                     </h3>
                     <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate mb-1">
                       {typeof suggestion.artist === 'object' ? (suggestion.artist as any)?.name : suggestion.artist || 'Unknown Artist'}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                       {suggestion.label || 'Unknown Label'}
                     </p>
                   </div>
                </div>
              </div>
              
               {/* Condition Row - Aligned with thumbnail */}
               <div className="flex items-center gap-1 mb-3">
                 <div className="w-4"></div> {/* Spacer for checkbox */}
                 <div className="w-2"></div> {/* Spacer for gap-3 */}
                 <div className="w-14"></div> {/* Spacer for thumbnail */}
                 <div className="w-2"></div> {/* Spacer for gap-2 */}
                 <div className="text-xs space-x-2">
                   {suggestion.condition.split(', ').map((part, index) => (
                     <span key={index}>
                       {part.includes(':') ? (
                         <>
                           <span className="text-gray-500 dark:text-gray-400">{part.split(':')[0]}:</span>
                           <span className="text-gray-900 dark:text-gray-100">{part.split(':')[1]}</span>
                         </>
                       ) : (
                         <span className="text-gray-900 dark:text-gray-100">{part}</span>
                       )}
                     </span>
                   ))}
                 </div>
               </div>
              
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Current</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {appliedItems.has(suggestion.listingId) && suggestion.originalPrice ? (
                      <div className="flex flex-col">
                        <span className="line-through text-gray-400 dark:text-gray-500">
                          {formatCurrency(suggestion.originalPrice, suggestion.currency)}
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(suggestion.suggestedPrice, suggestion.currency)}
                        </span>
                      </div>
                    ) : (
                      formatCurrency(suggestion.currentPrice, suggestion.currency)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Suggested</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(suggestion.suggestedPrice, suggestion.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Change</div>
                  <div className={`font-medium ${
                    suggestion.suggestedPrice > suggestion.currentPrice 
                      ? 'text-green-600 dark:text-green-400' 
                      : suggestion.suggestedPrice < suggestion.currentPrice 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {suggestion.suggestedPrice > suggestion.currentPrice ? '+' : ''}
                    {formatCurrency(suggestion.suggestedPrice - suggestion.currentPrice, suggestion.currency)}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleApplyIndividual(suggestion.listingId)}
                disabled={applyingItems.has(suggestion.listingId) || appliedItems.has(suggestion.listingId) || selectedItems.size > 0}
                variant="primary"
                className={`w-full text-sm ${
                  appliedItems.has(suggestion.listingId)
                    ? 'bg-green-600 hover:bg-green-600'
                    : selectedItems.size > 0
                    ? 'bg-gray-400 hover:bg-gray-400'
                    : ''
                }`}
              >
                {applyingItems.has(suggestion.listingId) ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : appliedItems.has(suggestion.listingId) ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckIcon className="h-4 w-4" />
                    Applied
                  </span>
                ) : 'Apply'}
              </Button>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls - Responsive */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <label htmlFor="itemsPerPage" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                  <option value={200}>200</option>
                  <option value={250}>250</option>
                </select>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">items</span>
              </div>
              <div className="hidden sm:block text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                           ? 'bg-primary-600 dark:bg-primary-500 text-white'
                            : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        
        {totalItems === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              {suggestions.length === 0 ? "No pricing suggestions available" : "No suggestions found"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {suggestions.length === 0 
                ? "Run a pricing analysis to see recommendations for your Discogs inventory. We'll analyse market data and suggest optimal prices."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {suggestions.length === 0 && (
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  onClick={handleSimulateSelection}
                >
                  Run Pricing Analysis
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  )
})

InventoryReviewTable.displayName = 'InventoryReviewTable'

