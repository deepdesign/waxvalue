'use client'

import { useState } from 'react'
import { 
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Strategy } from '@/types'

interface PresetStrategy {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  strategy: Partial<Strategy>
}

const presets: PresetStrategy[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Stay slightly below market median for quick sales',
    icon: ShieldCheckIcon,
    strategy: {
      anchor: 'median',
      offsetType: 'percentage',
      offsetValue: -5,
      conditionWeights: {
        media: 0.8,
        sleeve: 0.2,
      },
      maxChangePercent: 15,
      rounding: 0.50,
    },
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Price above market to maximize profit',
    icon: ArrowUpIcon,
    strategy: {
      anchor: 'median',
      offsetType: 'percentage',
      offsetValue: 15,
      conditionWeights: {
        media: 0.7,
        sleeve: 0.3,
      },
      scarcityBoost: {
        threshold: 3,
        boostPercent: 25,
      },
      maxChangePercent: 30,
      rounding: 1.00,
    },
  },
  {
    id: 'competitive',
    name: 'Competitive',
    description: 'Match market median with condition adjustments',
    icon: ChartBarIcon,
    strategy: {
      anchor: 'median',
      offsetType: 'percentage',
      offsetValue: 0,
      conditionWeights: {
        media: 0.6,
        sleeve: 0.4,
      },
      maxChangePercent: 20,
      rounding: 0.25,
    },
  },
  {
    id: 'quick-sell',
    name: 'Quick Sell',
    description: 'Price below cheapest to move inventory fast',
    icon: RocketLaunchIcon,
    strategy: {
      anchor: 'cheapest',
      offsetType: 'percentage',
      offsetValue: -10,
      conditionWeights: {
        media: 0.9,
        sleeve: 0.1,
      },
      maxChangePercent: 25,
      rounding: 0.50,
    },
  },
]

interface StrategyPresetsProps {
  onSelectPreset: (preset: PresetStrategy) => void
  isLoading?: boolean
}

export function StrategyPresets({ onSelectPreset, isLoading = false }: StrategyPresetsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const handleSelectPreset = (preset: PresetStrategy) => {
    setSelectedPreset(preset.id)
    onSelectPreset(preset)
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Strategy Presets</h3>
        <p className="text-sm text-gray-500">
          Choose a pre-configured pricing strategy or create your own
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              selectedPreset === preset.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => handleSelectPreset(preset)}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedPreset === preset.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <preset.icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${
                  selectedPreset === preset.id ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  {preset.name}
                </h4>
                <p className={`text-xs mt-1 ${
                  selectedPreset === preset.id ? 'text-primary-700' : 'text-gray-500'
                }`}>
                  {preset.description}
                </p>
              </div>
            </div>

            {selectedPreset === preset.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Need Help Choosing?</h4>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Conservative</strong> is best for steady, reliable sales. 
                <strong>Aggressive</strong> maximizes profit but may take longer to sell. 
                <strong>Competitive</strong> balances profit and speed. 
                <strong>Quick Sell</strong> prioritizes fast inventory turnover.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}