'use client'

import { useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { ApiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface ReleaseDetails {
  id: number
  title: string
  year?: number
  artists: string[]
  labels: string[]
  formats: string[]
  images: string[]
  resource_url: string
  genres: string[]
  styles: string[]
  country?: string
}

interface AlertCriteria {
  max_price: string
  max_price_currency: string
  min_condition: string
  location_filter: string
  min_seller_rating: string
  underpriced_percentage: string
}

interface AddReleaseModalProps {
  onClose: () => void
  onAdd: (releaseData: any) => void
  user?: any
}

export function AddReleaseModal({ onClose, onAdd, user }: AddReleaseModalProps) {
  const [step, setStep] = useState(1) // 1: Input, 2: Configure, 3: Confirm
  const [releaseUrl, setReleaseUrl] = useState('')
  const [releaseDetails, setReleaseDetails] = useState<ReleaseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertCriteria, setAlertCriteria] = useState<AlertCriteria>({
    max_price: '',
    max_price_currency: 'USD',
    min_condition: '',
    location_filter: '',
    min_seller_rating: '',
    underpriced_percentage: ''
  })

  const apiClient = new ApiClient({ baseUrl: 'http://localhost:8000' })

  const handleStep1 = async () => {
    if (!releaseUrl.trim()) {
      setError('Please enter a Discogs release URL or ID')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Extract release ID from URL or validate direct ID
      const releaseId = extractReleaseId(releaseUrl)
      if (!releaseId) {
        if (releaseUrl.includes('/sell/item/')) {
          setError('This is a listing URL, not a release URL. Please use the release page URL instead. Look for the "Release" link on the listing page.')
        } else {
          setError('Invalid Discogs release URL or ID. Please check the format.')
        }
        return
      }

      if (!user?.accessToken) {
        setError('Authentication required. Please refresh the page and try again.')
        return
      }

      // Fetch release details using API client
      const response = await apiClient.get(`/wanted-list/release-details/${releaseId}`)
      const details = response.data
      setReleaseDetails(details)
      setStep(2)
    } catch (error: any) {
      console.error('Failed to fetch release details:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to fetch release details. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = () => {
    // Validate that at least one criteria is set
    const hasCriteria = alertCriteria.max_price || 
                       alertCriteria.min_condition || 
                       alertCriteria.underpriced_percentage ||
                       alertCriteria.location_filter ||
                       alertCriteria.min_seller_rating

    if (!hasCriteria) {
      setError('Please set at least one alert criteria.')
      return
    }

    setError(null)
    setStep(3)
  }

  const handleConfirm = () => {
    if (!releaseDetails) {
      setError('Release details not found. Please start over.')
      return
    }

    const releaseData = {
      discogs_release_id: releaseDetails.id,
      max_price: alertCriteria.max_price ? parseFloat(alertCriteria.max_price) : null,
      max_price_currency: alertCriteria.max_price_currency,
      min_condition: alertCriteria.min_condition || null,
      location_filter: alertCriteria.location_filter || null,
      min_seller_rating: alertCriteria.min_seller_rating ? parseFloat(alertCriteria.min_seller_rating) : null,
      underpriced_percentage: alertCriteria.underpriced_percentage ? parseInt(alertCriteria.underpriced_percentage) : null
    }
    
    onAdd(releaseData)
  }

  const extractReleaseId = (url: string): number | null => {
    // Check for listing URLs first and provide helpful error
    if (url.includes('/sell/item/')) {
      return null // Will trigger error message below
    }
    
    // Extract release ID from various Discogs URL formats
    const patterns = [
      /discogs\.com\/release\/(\d+)(?:-[^\/]*)?/,  // Handle URLs with slugs
      /discogs\.com\/.*\/release\/(\d+)(?:-[^\/]*)?/,  // Handle URLs with slugs
      /^(\d+)$/ // Direct ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        try {
          return parseInt(match[1])
        } catch {
          continue
        }
      }
    }
    
    return null
  }

  const resetModal = () => {
    setStep(1)
    setReleaseUrl('')
    setReleaseDetails(null)
    setError(null)
    setAlertCriteria({
      max_price: '',
      max_price_currency: 'USD',
      min_condition: '',
      location_filter: '',
      min_seller_rating: '',
      underpriced_percentage: ''
    })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Release to Wanted List
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                {step > 1 ? <CheckIcon className="h-4 w-4" /> : '1'}
              </div>
              <div className={`h-1 w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                {step > 2 ? <CheckIcon className="h-4 w-4" /> : '2'}
              </div>
              <div className={`h-1 w-8 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1: URL/ID Input */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discogs Release URL or ID
                </label>
                <input
                  type="text"
                  value={releaseUrl}
                  onChange={(e) => setReleaseUrl(e.target.value)}
                  placeholder="https://www.discogs.com/release/1234567 or just 1234567 (NOT /sell/item/ URLs)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the release page URL (not the listing/sell page). Look for the "Release" link on listing pages.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleStep1} 
                  disabled={!releaseUrl.trim() || isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Finding Release...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      Find Release
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Release Details & Criteria Configuration */}
          {step === 2 && releaseDetails && (
            <div className="space-y-6">
              {/* Release Details Display */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {releaseDetails.images.length > 0 && (
                    <img
                      src={releaseDetails.images[0]}
                      alt={releaseDetails.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {releaseDetails.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {releaseDetails.artists.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {releaseDetails.year && `${releaseDetails.year} • `}
                      {releaseDetails.formats.join(', ')}
                    </p>
                    {releaseDetails.labels.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {releaseDetails.labels.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Alert Criteria Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Set Alert Criteria</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure when you want to be notified about this release
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Price
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={alertCriteria.max_price}
                        onChange={(e) => setAlertCriteria(prev => ({...prev, max_price: e.target.value}))}
                        placeholder="50.00"
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <select
                        value={alertCriteria.max_price_currency}
                        onChange={(e) => setAlertCriteria(prev => ({...prev, max_price_currency: e.target.value}))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Condition
                    </label>
                    <select
                      value={alertCriteria.min_condition}
                      onChange={(e) => setAlertCriteria(prev => ({...prev, min_condition: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Any condition</option>
                      <option value="M">Mint (M)</option>
                      <option value="NM">Near Mint (NM)</option>
                      <option value="VG+">Very Good Plus (VG+)</option>
                      <option value="VG">Very Good (VG)</option>
                      <option value="G+">Good Plus (G+)</option>
                      <option value="G">Good (G)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location Filter
                    </label>
                    <input
                      type="text"
                      value={alertCriteria.location_filter}
                      onChange={(e) => setAlertCriteria(prev => ({...prev, location_filter: e.target.value}))}
                      placeholder="e.g., EU, UK, US"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Seller Rating (%)
                    </label>
                    <input
                      type="number"
                      value={alertCriteria.min_seller_rating}
                      onChange={(e) => setAlertCriteria(prev => ({...prev, min_seller_rating: e.target.value}))}
                      placeholder="95"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Underpriced Alert (% below median)
                  </label>
                  <input
                    type="number"
                    value={alertCriteria.underpriced_percentage}
                    onChange={(e) => setAlertCriteria(prev => ({...prev, underpriced_percentage: e.target.value}))}
                    placeholder="15"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Optional: Alert when listings are X% below typical market price
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleStep2}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && releaseDetails && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Confirm Release Addition
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to add this release to your wanted list?
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Release:</strong> {releaseDetails.title}</div>
                  <div><strong>Artist:</strong> {releaseDetails.artists.join(', ')}</div>
                  {alertCriteria.max_price && (
                    <div><strong>Max Price:</strong> {alertCriteria.max_price} {alertCriteria.max_price_currency}</div>
                  )}
                  {alertCriteria.min_condition && (
                    <div><strong>Min Condition:</strong> {alertCriteria.min_condition}</div>
                  )}
                  {alertCriteria.underpriced_percentage && (
                    <div><strong>Underpriced Alert:</strong> {alertCriteria.underpriced_percentage}% below median</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleConfirm}>
                  Add to Wanted List
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
