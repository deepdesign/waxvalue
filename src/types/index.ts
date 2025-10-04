// User and Authentication Types
export interface User {
  id: string
  username: string
  discogsUserId: string | null
  email: string
  firstName?: string
  lastName?: string
  accessToken?: string
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  id: string
  userId: string
  currency: string
  defaultDryRun: boolean
  dailySchedule?: string
  globalFloor?: number
  globalCeiling?: number
  maxChangePercent: number
  apiRateLimitSeconds: number
  logRetentionDays: number
}

// Discogs API Types
export interface DiscogsListing {
  id: number
  release_id: number
  condition: string
  sleeve_condition: string
  price: number
  currency: string
  comments: string
  ships_from: string
  uri: string
  status: string
  resource_url: string
  release: {
    id: number
    title: string
    artists: Array<{
      id: number
      name: string
      resource_url: string
    }>
    images: Array<{
      uri: string
      height: number
      width: number
      resource_url: string
      type: string
      uri150: string
    }>
    resource_url: string
  }
}

export interface MarketData {
  median: number
  mean: number
  min: number
  max: number
  p25: number
  p75: number
  p90: number
  count: number
  scarcity: 'high' | 'medium' | 'low'
}

// Strategy Types
export interface Strategy {
  id: string
  userId: string
  name: string
  anchor: 'mean' | 'median' | 'mode' | 'cheapest' | 'most_expensive' | 'percentile'
  offsetType: 'percentage' | 'fixed'
  offsetValue: number
  conditionWeights: {
    media: number
    sleeve: number
  }
  scarcityBoost?: {
    threshold: number
    boostPercent: number
  }
  floor?: number
  ceiling?: number
  rounding: number
  maxChangePercent: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Pricing and Simulation Types
export interface PriceSuggestion {
  listingId: number
  currentPrice: number
  suggestedPrice: number
  basis: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  condition: string
  sleeveCondition: string
  marketData: MarketData
  release?: {
    title: string
    images?: Array<{
      uri150: string
    }>
  }
  artist?: {
    name: string
  }
}

export interface SimulationResult {
  id: string
  userId: string
  runDate: string
  isDryRun: boolean
  totalListings: number
  suggestedUpdates: number
  averageDelta: number
  suggestions: PriceSuggestion[]
  status: 'completed' | 'running' | 'failed'
  errorMessage?: string
}

// Logging Types
export interface RunLog {
  id: string
  userId: string
  runDate: string
  isDryRun: boolean
  itemsScanned: number
  itemsUpdated: number
  itemsSkipped: number
  errors: number
  status: 'completed' | 'failed' | 'partial'
  errorMessage?: string
}

export interface ListingSnapshot {
  id: string
  runLogId: string
  listingId: number
  beforePrice: number
  afterPrice?: number
  suggestedPrice: number
  confidence: 'high' | 'medium' | 'low'
  decision: 'applied' | 'declined' | 'skipped'
  reasoning: string
  marketData: MarketData
}

export interface PriceHistory {
  id: string
  listingId: number
  date: string
  userPrice: number
  marketMedian: number
  marketMean: number
  marketMin: number
  marketMax: number
}

// UI Component Types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  search?: string
  condition?: string
  priceRange?: {
    min?: number
    max?: number
  }
  status?: 'applied' | 'not_applied' | 'all'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface SetupFormData {
  verifierCode?: string
}

export interface StrategyFormData {
  name: string
  anchor: Strategy['anchor']
  offsetType: Strategy['offsetType']
  offsetValue: number
  conditionWeights: Strategy['conditionWeights']
  scarcityBoost?: Strategy['scarcityBoost']
  floor?: number
  ceiling?: number
  rounding: number
  maxChangePercent: number
}

// Metrics Types
export interface PortfolioMetrics {
  totalListings: number
  belowP25: number
  betweenP25P75: number
  aboveP75: number
  averageDelta: number
  underpriced: number
  overpriced: number
}

export interface TrendData {
  date: string
  userAverage: number
  marketMedian: number
}

export interface DistributionData {
  priceRange: string
  count: number
  userListings: number
}
