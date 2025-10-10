'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// Simple Toggle Switch Component
function Toggle({ checked, onChange, className = '' }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  // If custom className includes bg-* color, use it, otherwise use default
  const bgColor = className.includes('bg-') 
    ? className 
    : checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
  
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`${bgColor} relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${className.replace(/bg-\S+/g, '').trim()}`}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  )
}

export function AutomationRulesCard() {
  const [rules, setRules] = useState({
    enabled: false,
    autoApplyIncreases: false,
    autoApplyThreshold: 10, // Only auto-apply if increase is less than X%
    maxPriceChange: 20, // Never change price more than $X
    minPriceFloor: 1, // Never set price below $X
    maxPriceCeiling: 1000, // Never set price above $X
    excludeConditions: [] as string[],
    onlyUnderpriced: true,
    batchLimit: 50, // Max items to update per run
    requireReview: true,
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (key: keyof typeof rules, value: any) => {
    setRules(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Save to localStorage for now (would be backend in production)
    localStorage.setItem('waxvalue_automation_rules', JSON.stringify(rules))
    toast.success('Automation rules saved successfully')
    setHasChanges(false)
  }

  const handleReset = () => {
    const saved = localStorage.getItem('waxvalue_automation_rules')
    if (saved) {
      setRules(JSON.parse(saved))
    }
    setHasChanges(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Auto-Apply Rules
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Automatically apply price suggestions that meet your criteria
            </p>
          </div>
          <Toggle
            checked={rules.enabled}
            onChange={(checked) => handleToggle('enabled', checked)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {!rules.enabled ? (
          <div className="text-center py-8">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Automation is disabled
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enable automation above to configure auto-apply rules
            </p>
          </div>
        ) : (
          <>
            {/* Safety Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Safety Guardrails</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Price decreases never auto-apply</strong> - Always require manual approval</li>
                    <li>All changes are logged and reversible</li>
                    <li>You can pause automation anytime</li>
                    <li>Daily limits prevent bulk errors</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-Apply Increases */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-apply price increases
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically apply suggestions that increase prices
                  </p>
                </div>
                <Toggle
                  checked={rules.autoApplyIncreases}
                  onChange={(checked) => handleToggle('autoApplyIncreases', checked)}
                  className={rules.autoApplyIncreases ? 'bg-green-600' : ''}
                />
              </div>

              {rules.autoApplyIncreases && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Auto-apply threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auto-apply threshold
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={rules.autoApplyThreshold}
                        onChange={(e) => handleToggle('autoApplyThreshold', parseInt(e.target.value))}
                        className="block w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                        min="1"
                        max="100"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">% or less</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Only auto-apply if price increase is {rules.autoApplyThreshold}% or less. Larger increases require manual review.
                    </p>
                  </div>

                  {/* Only underpriced */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="onlyUnderpriced"
                      checked={rules.onlyUnderpriced}
                      onChange={(e) => handleToggle('onlyUnderpriced', e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-primary-600"
                    />
                    <div className="ml-3">
                      <label htmlFor="onlyUnderpriced" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Only apply to underpriced items
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Only auto-apply when current price is below market value
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Limits */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Price Limits & Guardrails
              </h4>

              {/* Max price change */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum price change per item
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    value={rules.maxPriceChange}
                    onChange={(e) => handleToggle('maxPriceChange', parseInt(e.target.value))}
                    className="block w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    min="1"
                    max="1000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Never change a price by more than ${rules.maxPriceChange} in a single update
                </p>
              </div>

              {/* Min/Max price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum price floor
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={rules.minPriceFloor}
                      onChange={(e) => handleToggle('minPriceFloor', parseFloat(e.target.value))}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      min="0.01"
                      step="0.50"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Never set a price below this amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum price ceiling
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={rules.maxPriceCeiling}
                      onChange={(e) => handleToggle('maxPriceCeiling', parseInt(e.target.value))}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      min="1"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Never set a price above this amount
                  </p>
                </div>
              </div>

              {/* Batch limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Daily batch limit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={rules.batchLimit}
                    onChange={(e) => handleToggle('batchLimit', parseInt(e.target.value))}
                    className="block w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    min="1"
                    max="500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">items per day</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum number of items to auto-update each day
                </p>
              </div>
            </div>

            {/* Exclusions */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Exclusions
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exclude conditions
                </label>
                <div className="space-y-2">
                  {['Poor (P)', 'Fair (F)', 'Good (G)'].map((condition) => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rules.excludeConditions.includes(condition)}
                        onChange={(e) => {
                          const newConditions = e.target.checked
                            ? [...rules.excludeConditions, condition]
                            : rules.excludeConditions.filter(c => c !== condition)
                          handleToggle('excludeConditions', newConditions)
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {condition}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Don't auto-apply suggestions for these conditions
                </p>
              </div>
            </div>

            {/* Require review */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Require review before applying
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        When enabled, changes are queued for your review before being applied
                      </p>
                    </div>
                    <Toggle
                      checked={rules.requireReview}
                      onChange={(checked) => handleToggle('requireReview', checked)}
                      className={`flex-shrink-0 ${rules.requireReview ? 'bg-yellow-600' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {rules.enabled && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-b-lg">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
          >
            {hasChanges ? 'Save Rules' : 'Saved'}
          </button>
        </div>
      )}
    </div>
  )
}

