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
import { Button } from '@/components/ui/Button'
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
  onCancel: () => void
  initialData?: Partial<StrategyFormData>
  isLoading?: boolean
  previewData?: any[]
}

export function StrategyForm({ onSave, onPreview, onCancel, initialData, isLoading = false, previewData = [] }: StrategyFormProps) {
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: '',
      anchor: 'median',
      offsetType: 'percentage',
      offsetValue: 0,
      conditionWeights: {
        media: 0.7,
        sleeve: 0.3,
      },
      scarcityBoost: {
        threshold: 5,
        boostPercent: 20,
      },
      floor: 1,
      ceiling: 1000,
      rounding: 0.25,
      maxChangePercent: 50,
      isActive: true,
      ...initialData,
    },
  })

  const onSubmit = async (data: StrategyFormData) => {
    try {
      await onSave(data)
      toast.success('Strategy saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save strategy')
    }
  }

  const handlePreview = async (data: StrategyFormData) => {
    try {
      await onPreview(data)
      setShowPreview(true)
      toast.success('Preview generated!')
    } catch (error) {
      console.error('Preview error:', error)
    }
  }

  const inputClasses = "block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
  const errorClasses = "mt-1 text-sm text-red-600 dark:text-red-400"

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pricing Strategy</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure how prices are calculated based on market data
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Basic Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClasses}>
                Strategy Name
              </label>
              <input
                {...register('name')}
                type="text"
                className={inputClasses}
                placeholder="e.g., Conservative Pricing"
              />
              {errors.name && (
                <p className={errorClasses}>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="anchor" className={labelClasses}>
                Market Anchor
              </label>
              <select {...register('anchor')} className={inputClasses}>
                <option value="median">Median Price</option>
                <option value="mean">Average Price</option>
                <option value="cheapest">Cheapest Available</option>
                <option value="most_expensive">Most Expensive</option>
                <option value="percentile">Percentile</option>
              </select>
              {errors.anchor && (
                <p className={errorClasses}>{errors.anchor.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Offset Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Offset Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="offsetType" className={labelClasses}>
                Offset Type
              </label>
              <select {...register('offsetType')} className={inputClasses}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              {errors.offsetType && (
                <p className={errorClasses}>{errors.offsetType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="offsetValue" className={labelClasses}>
                Offset Value
              </label>
              <input
                {...register('offsetValue', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className={inputClasses}
                placeholder="0.00"
              />
              {errors.offsetValue && (
                <p className={errorClasses}>{errors.offsetValue.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Condition Weights */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Condition Weights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mediaWeight" className={labelClasses}>
                Media Condition Weight
              </label>
              <input
                {...register('conditionWeights.media', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0"
                max="1"
                className={inputClasses}
                placeholder="0.7"
              />
              {errors.conditionWeights?.media && (
                <p className={errorClasses}>{errors.conditionWeights.media.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="sleeveWeight" className={labelClasses}>
                Sleeve Condition Weight
              </label>
              <input
                {...register('conditionWeights.sleeve', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0"
                max="1"
                className={inputClasses}
                placeholder="0.3"
              />
              {errors.conditionWeights?.sleeve && (
                <p className={errorClasses}>{errors.conditionWeights.sleeve.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Scarcity Boost */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Scarcity Boost</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scarcityThreshold" className={labelClasses}>
                Threshold (items)
              </label>
              <input
                {...register('scarcityBoost.threshold', { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputClasses}
                placeholder="5"
              />
              {errors.scarcityBoost?.threshold && (
                <p className={errorClasses}>{errors.scarcityBoost.threshold.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="scarcityBoost" className={labelClasses}>
                Boost Percentage
              </label>
              <input
                {...register('scarcityBoost.boostPercent', { valueAsNumber: true })}
                type="number"
                min="0"
                className={inputClasses}
                placeholder="20"
              />
              {errors.scarcityBoost?.boostPercent && (
                <p className={errorClasses}>{errors.scarcityBoost.boostPercent.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Price Limits */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Price Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="floor" className={labelClasses}>
                Minimum Price
              </label>
              <input
                {...register('floor', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className={inputClasses}
                placeholder="1.00"
              />
              {errors.floor && (
                <p className={errorClasses}>{errors.floor.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="ceiling" className={labelClasses}>
                Maximum Price
              </label>
              <input
                {...register('ceiling', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className={inputClasses}
                placeholder="1000.00"
              />
              {errors.ceiling && (
                <p className={errorClasses}>{errors.ceiling.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="rounding" className={labelClasses}>
                Rounding Increment
              </label>
              <input
                {...register('rounding', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                className={inputClasses}
                placeholder="0.25"
              />
              {errors.rounding && (
                <p className={errorClasses}>{errors.rounding.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Safety Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Safety Settings</h4>
          <div>
            <label htmlFor="maxChangePercent" className={labelClasses}>
              Maximum Price Change Percentage
            </label>
            <input
              {...register('maxChangePercent', { valueAsNumber: true })}
              type="number"
              min="1"
              max="100"
              className={inputClasses}
              placeholder="50"
            />
            {errors.maxChangePercent && (
              <p className={errorClasses}>{errors.maxChangePercent.message}</p>
            )}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Set as active strategy
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            loadingText="Saving..."
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Save Strategy
          </Button>
        </div>
      </form>

      {/* Preview Panel */}
      {showPreview && previewData.length > 0 && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Strategy Preview</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Here&apos;s how this strategy would price sample items from your inventory:
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-3">
              {previewData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.artist}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${item.suggestedPrice}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.currentPrice !== item.suggestedPrice ? (
                        <span className={item.suggestedPrice > item.currentPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {item.suggestedPrice > item.currentPrice ? '+' : ''}
                          {(((item.suggestedPrice - item.currentPrice) / item.currentPrice) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        'No change'
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}