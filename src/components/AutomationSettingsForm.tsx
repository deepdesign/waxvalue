'use client'

import { useState } from 'react'
import {
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

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
    <div className="card">
      <div className="flex items-center mb-4">
        <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">Automation Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Auto-Update Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Automatic Updates</h4>
              <p className="text-xs text-gray-500">Configure when prices are updated automatically</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.autoUpdateIncreases}
                onChange={(e) => handleChange('autoUpdateIncreases', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable auto-updates</span>
            </label>
          </div>

          {localSettings.autoUpdateIncreases && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  value={localSettings.alertThreshold}
                  onChange={(e) => handleChange('alertThreshold', Number(e.target.value))}
                  className="input-field"
                  placeholder="25"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Increases above this percentage will require manual approval
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">Daily Schedule</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Run Time
              </label>
              <input
                type="time"
                value={localSettings.dailySchedule}
                onChange={(e) => handleChange('dailySchedule', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Time of day to run pricing simulations and apply safe updates
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="defaultDryRun"
                checked={localSettings.defaultDryRun}
                onChange={(e) => handleChange('defaultDryRun', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="defaultDryRun" className="ml-2 text-sm text-gray-700">
                Default to Dry Run Mode
              </label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, all runs will be simulations only until you manually approve changes
            </p>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
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
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Automation Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}




