'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SettingsDiscogs } from '@/components/SettingsDiscogs'
import { AutomationSettingsForm } from '@/components/AutomationSettingsForm'
import {
  UserIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const [settings, setSettings] = useState({
    currency: 'USD',
    defaultDryRun: true,
    dailySchedule: '09:00',
    globalFloor: 5.00,
    globalCeiling: 1000.00,
    maxChangePercent: 25,
    apiRateLimitSeconds: 1.2,
    logRetentionDays: 90,
    autoUpdateIncreases: false,
    alertThreshold: 25,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/backend/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleDisconnectAccount = async () => {
    if (!confirm('Are you sure you want to disconnect your Discogs account? This will stop all automated pricing.')) {
      return
    }

    try {
      const response = await fetch('/api/backend/auth/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Account disconnected successfully')
        // Redirect to setup page
        router.push('/setup')
      } else {
        throw new Error('Failed to disconnect account')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect account')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        <div className="space-y-6">
          {/* Discogs Account */}
          <SettingsDiscogs 
            user={user} 
            onConnectionChange={(connected) => {
              // Handle connection change if needed
            }}
          />

          {/* Automation Settings */}
          <AutomationSettingsForm
            settings={{
              autoUpdateIncreases: settings.autoUpdateIncreases,
              alertThreshold: settings.alertThreshold,
              dailySchedule: settings.dailySchedule,
              defaultDryRun: settings.defaultDryRun,
            }}
            onSettingsChange={(newSettings) => {
              setSettings(prev => ({ ...prev, ...newSettings }))
            }}
            onSave={handleSaveSettings}
            isLoading={false}
          />

          {/* General Settings */}
          <div className="card">
            <div className="flex items-center mb-4">
              <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">General</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="input-field"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Reprice Schedule
                </label>
                <input
                  type="time"
                  value={settings.dailySchedule}
                  onChange={(e) => setSettings(prev => ({ ...prev, dailySchedule: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="defaultDryRun"
                  checked={settings.defaultDryRun}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultDryRun: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="defaultDryRun" className="ml-2 text-sm text-gray-700">
                  Default to Dry Run Mode
                </label>
              </div>
            </div>
          </div>

          {/* Safeguards */}
          <div className="card">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Safeguards</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Global Price Floor
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={settings.globalFloor}
                    onChange={(e) => setSettings(prev => ({ ...prev, globalFloor: Number(e.target.value) }))}
                    className="input-field pl-10"
                    placeholder="5.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum price for any item</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Global Price Ceiling
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={settings.globalCeiling}
                    onChange={(e) => setSettings(prev => ({ ...prev, globalCeiling: Number(e.target.value) }))}
                    className="input-field pl-10"
                    placeholder="1000.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum price for any item</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Change % per Run
                </label>
                <input
                  type="number"
                  value={settings.maxChangePercent}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxChangePercent: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="25"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum price change percentage in a single run</p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="card">
            <div className="flex items-center mb-4">
              <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Advanced</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Rate Limit (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.apiRateLimitSeconds}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiRateLimitSeconds: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="1.2"
                />
                <p className="text-xs text-gray-500 mt-1">Delay between API calls to respect Discogs limits</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Log Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, logRetentionDays: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="90"
                />
                <p className="text-xs text-gray-500 mt-1">How long to keep run logs and history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="btn-primary px-8 py-2"
          >
            Save Settings
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
