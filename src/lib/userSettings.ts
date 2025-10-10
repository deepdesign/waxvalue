export interface UserSettings {
  itemsPerPage: number
  defaultSort: string
  viewDensity?: 'compact' | 'comfortable' | 'spacious'
  autoAnalyzeOnLogin?: boolean
  minPriceChangeThreshold?: number
  showOnlyUnderpriced?: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  itemsPerPage: 50,
  defaultSort: 'priceDelta',
  viewDensity: 'comfortable',
  autoAnalyzeOnLogin: true, // Currently we always run analysis on login
  minPriceChangeThreshold: 1,
  showOnlyUnderpriced: false
}

export const loadUserSettings = (): UserSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const savedSettings = localStorage.getItem('waxvalue_user_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load user settings:', error)
  }

  return DEFAULT_SETTINGS
}

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem('waxvalue_user_settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save user settings:', error)
  }
}

