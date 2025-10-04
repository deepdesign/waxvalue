'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  PlusIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const strategySchema = z.object({
  name: z.string().min(1, 'Strategy name is required'),
  anchor: z.enum(['mean', 'median', 'mode', 'cheapest', 'most_expensive', 'percentile']),
  offsetType: z.enum(['percentage', 'fixed']),
  offsetValue: z.number().min(0, 'Offset value must be positive'),
  conditionWeights: z.object({
    media: z.number().min(0).max(1),
    sleeve: z.number().min(0).max(1),
  }),
  scarcityBoost: z.object({
    threshold: z.number().min(0),
    boostPercent: z.number().min(0),
  }).optional(),
  floor: z.number().min(0).optional(),
  ceiling: z.number().min(0).optional(),
  rounding: z.number().min(0.01),
  maxChangePercent: z.number().min(1).max(100),
  isActive: z.boolean().default(true),
})

type StrategyFormData = z.infer<typeof strategySchema>

interface StrategyFormProps {
  onSave: (data: StrategyFormData) => void
  onPreview: (data: StrategyFormData) => void
  initialData?: Partial<StrategyFormData>
  isLoading?: boolean
  previewData?: any[]
}

export function StrategyForm({ onSave, onPreview, initialData, isLoading = false, previewData = [] }: StrategyFormProps) {
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: '',
      anchor: 'median',
      offsetType: 'percentage',
      offsetValue: 10,
      conditionWeights: {
        media: 0.7,
        sleeve: 0.3,
      },
      rounding: 0.50,
      maxChangePercent: 25,
      isActive: true,
      ...initialData,
    },
  })

  const onSubmit = async (data: StrategyFormData) => {
    try {
      await onSave(data)
      toast.success('Strategy saved successfully!')
    } catch (error) {
      toast.error('Failed to save strategy')
      console.error('Strategy save error:', error)
    }
  }

  const handlePreview = async (data: StrategyFormData) => {
    try {
      await onPreview(data)
      setShowPreview(true)
      toast.success('Preview generated!')
    } catch (error) {
      toast.error('Failed to generate preview')
      console.error('Preview error:', error)
    }
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Pricing Strategy</h3>
        <p className="text-sm text-gray-500">
          Configure how prices are calculated based on market data
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Strategy Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="input-field"
              placeholder="e.g., Conservative Pricing"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="anchor" className="block text-sm font-medium text-gray-700 mb-1">
              Market Anchor
            </label>
            <select {...register('anchor')} className="input-field">
              <option value="median">Median Price</option>
              <option value="mean">Average Price</option>
              <option value="cheapest">Cheapest Available</option>
              <option value="most_expensive">Most Expensive</option>
              <option value="percentile">Custom Percentile</option>
            </select>
            {errors.anchor && (
              <p className="mt-1 text-sm text-red-600">{errors.anchor.message}</p>
            )}
          </div>
        </div>

        {/* Offset Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="offsetType" className="block text-sm font-medium text-gray-700 mb-1">
              Offset Type
            </label>
            <select {...register('offsetType')} className="input-field">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            {errors.offsetType && (
              <p className="mt-1 text-sm text-red-600">{errors.offsetType.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="offsetValue" className="block text-sm font-medium text-gray-700 mb-1">
              Offset Value
            </label>
            <div className="relative">
              <input
                {...register('offsetValue', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="input-field"
                placeholder="10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {watch('offsetType') === 'percentage' ? '%' : '$'}
                </span>
              </div>
            </div>
            {errors.offsetValue && (
              <p className="mt-1 text-sm text-red-600">{errors.offsetValue.message}</p>
            )}
          </div>
        </div>

        {/* Condition Weights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition Importance
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mediaWeight" className="block text-xs text-gray-500 mb-1">
                Media Condition Weight
              </label>
              <input
                {...register('conditionWeights.media', { valueAsNumber: true })}
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {watch('conditionWeights.media')}
              </div>
            </div>

            <div>
              <label htmlFor="sleeveWeight" className="block text-xs text-gray-500 mb-1">
                Sleeve Condition Weight
              </label>
              <input
                {...register('conditionWeights.sleeve', { valueAsNumber: true })}
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {watch('conditionWeights.sleeve')}
              </div>
            </div>
          </div>
        </div>

        {/* Scarcity Boost */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Scarcity Boost</h4>
            <input
              type="checkbox"
              {...register('scarcityBoost.threshold')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scarcityThreshold" className="block text-xs text-gray-500 mb-1">
                Minimum Listings for Boost
              </label>
              <input
                {...register('scarcityBoost.threshold', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="5"
              />
            </div>

            <div>
              <label htmlFor="boostPercent" className="block text-xs text-gray-500 mb-1">
                Boost Percentage
              </label>
              <input
                {...register('scarcityBoost.boostPercent', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="input-field"
                placeholder="15"
              />
            </div>
          </div>
        </div>

        {/* Price Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Price
            </label>
            <input
              {...register('floor', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="input-field"
              placeholder="No minimum"
            />
            {errors.floor && (
              <p className="mt-1 text-sm text-red-600">{errors.floor.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="ceiling" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Price
            </label>
            <input
              {...register('ceiling', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="input-field"
              placeholder="No maximum"
            />
            {errors.ceiling && (
              <p className="mt-1 text-sm text-red-600">{errors.ceiling.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="rounding" className="block text-sm font-medium text-gray-700 mb-1">
              Rounding Increment
            </label>
            <input
              {...register('rounding', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="input-field"
              placeholder="0.50"
            />
            {errors.rounding && (
              <p className="mt-1 text-sm text-red-600">{errors.rounding.message}</p>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <label htmlFor="maxChangePercent" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Change Percentage
          </label>
          <input
            {...register('maxChangePercent', { valueAsNumber: true })}
            type="number"
            step="1"
            className="input-field"
            placeholder="25"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum percentage a price can change in a single update
          </p>
          {errors.maxChangePercent && (
            <p className="mt-1 text-sm text-red-600">{errors.maxChangePercent.message}</p>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Set as active strategy
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit(handlePreview)}
            className="btn-outline inline-flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary inline-flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Strategy
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preview Panel */}
      {showPreview && previewData.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Strategy Preview</h4>
          <p className="text-sm text-gray-600 mb-4">
            Here's how this strategy would price sample items from your inventory:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {previewData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.artist}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="line-through">${item.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${item.suggestedPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.basis}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowPreview(false)}
              className="btn-outline"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}