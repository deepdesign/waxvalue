'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface PriceSuggestion {
  listingId: number
  releaseId: number
  currentPrice: number
  suggestedPrice: number
  originalSuggestedPrice: number
  originalPrice?: number
  currency: string
  basis: string
  status: string
  strategy: string
  condition: string
  artist: { name: string }
  title: string
  label: string
  imageUrl?: string
  originalIndex?: number  // For stable sort order
  release?: any
}

interface SortConfig {
  key: 'currentPrice' | 'priceDelta' | null
  direction: 'asc' | 'desc'
}

interface FilterConfig {
  status: string
  priceDirection: string
  condition: string
  priceRange: { min: number | null; max: number | null }
  showFlaggedOnly: boolean
}

interface InventoryContextType {
  suggestions: PriceSuggestion[]
  setSuggestions: (suggestions: PriceSuggestion[] | ((prev: PriceSuggestion[]) => PriceSuggestion[])) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  inventoryCount: number
  setInventoryCount: (count: number) => void
  actualTotalItems: number
  setActualTotalItems: (count: number) => void
  hasInitialized: boolean
  setHasInitialized: (initialized: boolean) => void
  sortConfig: SortConfig
  setSortConfig: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void
  filters: FilterConfig
  setFilters: (filters: FilterConfig | ((prev: FilterConfig) => FilterConfig)) => void
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inventoryCount, setInventoryCount] = useState(0)
  const [actualTotalItems, setActualTotalItems] = useState(0)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'priceDelta', direction: 'desc' })
  const [filters, setFilters] = useState<FilterConfig>({
    status: '',
    priceDirection: '',
    condition: '',
    priceRange: { min: null, max: null },
    showFlaggedOnly: false,
  })

  return (
    <InventoryContext.Provider
      value={{
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
        setFilters,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}

