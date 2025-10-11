export interface AutomationRules {
  enabled: boolean
  autoApplyIncreases: boolean
  autoApplyThreshold: number
  maxPriceChange: number
  minPriceFloor: number
  maxPriceCeiling: number
  excludeConditions: string[]
  onlyUnderpriced: boolean
  batchLimit: number
  requireReview: boolean
}

const DEFAULT_RULES: AutomationRules = {
  enabled: false,
  autoApplyIncreases: false,
  autoApplyThreshold: 10,
  maxPriceChange: 20,
  minPriceFloor: 1,
  maxPriceCeiling: 1000,
  excludeConditions: [],
  onlyUnderpriced: true,
  batchLimit: 50,
  requireReview: true,
}

export const loadAutomationRules = (): AutomationRules => {
  if (typeof window === 'undefined') {
    return DEFAULT_RULES
  }

  try {
    const savedRules = localStorage.getItem('waxvalue_automation_rules')
    if (savedRules) {
      const parsed = JSON.parse(savedRules)
      return { ...DEFAULT_RULES, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load automation rules:', error)
  }

  return DEFAULT_RULES
}

export const saveAutomationRules = (rules: AutomationRules): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem('waxvalue_automation_rules', JSON.stringify(rules))
  } catch (error) {
    console.error('Failed to save automation rules:', error)
  }
}

