'use client'

import { useState, useEffect } from 'react'
import { loadUserSettings, saveUserSettings, UserSettings } from '@/lib/userSettings'
import toast from 'react-hot-toast'

export function SettingsCard() {
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings())
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveUserSettings(settings)
    setHasChanges(false)
    toast.success('Settings saved successfully')
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'))
  }

  const handleReset = () => {
    const defaultSettings = loadUserSettings()
    setSettings(defaultSettings)
    setHasChanges(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Display and analysis settings
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Customise how you view and analyse your inventory
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Table Display Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Table display
          </h4>

          {/* Items Per Page */}
          <div>
            <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Items per page
            </label>
            <div className="relative">
              <select
                id="itemsPerPage"
                value={settings.itemsPerPage}
                onChange={(e) => handleChange('itemsPerPage', parseInt(e.target.value))}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
                <option value={150}>150 items</option>
                <option value={200}>200 items</option>
                <option value={250}>250 items</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Default Sort */}
          <div>
            <label htmlFor="defaultSort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default sorting
            </label>
            <div className="relative">
              <select
                id="defaultSort"
                value={settings.defaultSort || 'priceDelta'}
                onChange={(e) => handleChange('defaultSort', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="priceDelta">Most underpriced first (largest price increase)</option>
                <option value="priceDeltaReverse">Most overpriced first (largest price decrease)</option>
                <option value="currentPriceHigh">Highest current price first</option>
                <option value="currentPriceLow">Lowest current price first</option>
                <option value="artist">Artist (A to Z)</option>
                <option value="condition">Best condition first (Mint → VG)</option>
                <option value="status">Status (underpriced → overpriced)</option>
                <option value="">No default sorting</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* View Density */}
          <div>
            <label htmlFor="viewDensity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Table density
            </label>
            <div className="relative">
              <select
                id="viewDensity"
                value={settings.viewDensity || 'comfortable'}
                onChange={(e) => handleChange('viewDensity', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Affects row height and spacing
            </p>
          </div>
        </div>

        {/* Analysis Settings */}
        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Analysis preferences
          </h4>

          {/* Auto-analyse */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="autoAnalyze"
                type="checkbox"
                checked={settings.autoAnalyzeOnLogin || false}
                onChange={(e) => handleChange('autoAnalyzeOnLogin', e.target.checked)}
                className="table-checkbox"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="autoAnalyze" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-analyse on login
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically run pricing analysis when you first log in
              </p>
            </div>
          </div>

          {/* Minimum Price Change */}
          <div>
            <label htmlFor="minPriceChange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum price change to show
            </label>
            <div className="relative">
              <select
                id="minPriceChange"
                value={settings.minPriceChangeThreshold || 1}
                onChange={(e) => handleChange('minPriceChangeThreshold', parseFloat(e.target.value))}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-12 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value={0.5}>$0.50</option>
                <option value={1}>$1.00</option>
                <option value={2}>$2.00</option>
                <option value={5}>$5.00</option>
                <option value={10}>$10.00</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Only show suggestions with at least this much price difference
            </p>
          </div>

          {/* Show only underpriced */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="showUnderpriced"
                type="checkbox"
                checked={settings.showOnlyUnderpriced || false}
                onChange={(e) => handleChange('showOnlyUnderpriced', e.target.checked)}
                className="table-checkbox"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="showUnderpriced" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show only underpriced items by default
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Focus on items where you can increase the price
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
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
          {hasChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>
    </div>
  )
}

