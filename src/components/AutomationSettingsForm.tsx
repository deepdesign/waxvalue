'use client'

import { useState } from 'react'
import {
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface AutomationSettingsFormProps {
  settings: {
    autoUpdateIncreases: boolean
    alertThreshold: number
    dailySchedule: string
    defaultDryRun: boolean
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
  isLoading?: boolean
}

export function AutomationSettingsForm({ 
  settings, 
  onSettingsChange, 
  onSave, 
  isLoading = false 
}: AutomationSettingsFormProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleSave = () => {
    onSave()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Automation Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Auto-Update Settings */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Automatic Updates</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configure when prices are updated automatically</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.autoUpdateIncreases}
                onChange={(e) => handleChange('autoUpdateIncreases', e.target.checked)}
                className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable auto-updates</span>
            </label>
          </div>

          {localSettings.autoUpdateIncreases && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Safe automation rules:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Only price increases are applied automatically</li>
                      <li>All decreases require manual approval</li>
                      <li>Large increases above threshold require approval</li>
                      <li>All changes are logged for transparency</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  value={localSettings.alertThreshold}
                  onChange={(e) => handleChange('alertThreshold', Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
                  placeholder="25"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Increases above this percentage will require manual approval
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Settings */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Daily Schedule</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Run Time
              </label>
              <input
                type="time"
                value={localSettings.dailySchedule}
                onChange={(e) => handleChange('dailySchedule', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time of day to run pricing simulations and apply safe updates
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="defaultDryRun"
                checked={localSettings.defaultDryRun}
                onChange={(e) => handleChange('defaultDryRun', e.target.checked)}
                className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label htmlFor="defaultDryRun" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Default to Dry Run Mode
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              When enabled, all runs will be simulations only until you manually approve changes
            </p>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important Safety Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All automatic changes are logged and can be reviewed in the Logs section</li>
                <li>You can disable automation at any time</li>
                <li>Large price changes always require manual approval</li>
                <li>You maintain full control over your pricing strategy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={isLoading}
            loadingText="Saving..."
            variant="primary"
          >
            Save Automation Settings
          </Button>
        </div>
      </div>
    </div>
  )
}




