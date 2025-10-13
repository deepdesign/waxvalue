import { FilterState } from '@/components/FiltersBar'

const DEFAULT_FILTERS: FilterState = {
  status: '',
  priceDirection: '',
  condition: '',
  priceRange: { min: null, max: null },
  showFlaggedOnly: false,
  showFairlyPriced: true,
}

export const loadFilterSettings = (): FilterState => {
  if (typeof window === 'undefined') {
    return DEFAULT_FILTERS
  }

  try {
    const savedFilters = localStorage.getItem('waxvalue_filter_settings')
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters)
      return { ...DEFAULT_FILTERS, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load filter settings:', error)
  }

  return DEFAULT_FILTERS
}

export const saveFilterSettings = (filters: FilterState): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem('waxvalue_filter_settings', JSON.stringify(filters))
  } catch (error) {
    console.error('Failed to save filter settings:', error)
  }
}

