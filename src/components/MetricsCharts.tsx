'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PortfolioMetrics, TrendData, DistributionData } from '@/types'

interface MetricsChartsProps {
  className?: string
}

export function MetricsCharts({ className = '' }: MetricsChartsProps) {
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [distributionData, setDistributionData] = useState<DistributionData[]>([])
  const [itemDetails, setItemDetails] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      
      // Fetch portfolio metrics
      const portfolioResponse = await fetch('/api/backend/metrics/portfolio')
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json()
        setPortfolioMetrics(portfolioData)
      }

      // Fetch trend data
      const trendResponse = await fetch('/api/backend/metrics/trends')
      if (trendResponse.ok) {
        const trendData = await trendResponse.json()
        setTrendData(trendData.trends || [])
      }

      // Fetch distribution data
      const distributionResponse = await fetch('/api/backend/metrics/distribution')
      if (distributionResponse.ok) {
        const distributionData = await distributionResponse.json()
        setDistributionData(distributionData.distribution || [])
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Portfolio Overview Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Charts Loading */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Overview Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Portfolio Overview</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Key metrics about your inventory pricing</p>
        </div>
        <div className="p-6">
          {portfolioMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Listings</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {portfolioMetrics.totalListings}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <ArrowUpIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Underpriced</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {portfolioMetrics.underpriced}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <ArrowDownIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Overpriced</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {portfolioMetrics.overpriced}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      portfolioMetrics.averageDelta >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {portfolioMetrics.averageDelta >= 0 ? (
                        <ArrowUpIcon className="h-5 w-5 text-white" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Delta</p>
                    <p className={`text-lg font-semibold ${
                      portfolioMetrics.averageDelta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {portfolioMetrics.averageDelta > 0 ? '+' : ''}
                      {portfolioMetrics.averageDelta.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Price Trends</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your average prices vs market median over time</p>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="userAverage" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Your Average"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="marketMedian" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Market Median"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Price Distribution Section */}
      {distributionData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Price Distribution Analysis</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Compare your listings against market distribution</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Price Distribution</h4>
                  <p className="text-sm text-gray-500">Market vs your listings by price range</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priceRange" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" name="Market" />
                      <Bar dataKey="userListings" fill="#10B981" name="Your Listings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Pricing Position</h4>
                  <p className="text-sm text-gray-500">How your listings compare to market</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Below P25', value: portfolioMetrics?.belowP25 || 0, fill: '#EF4444' },
                          { name: 'P25-P75', value: portfolioMetrics?.betweenP25P75 || 0, fill: '#F59E0B' },
                          { name: 'Above P75', value: portfolioMetrics?.aboveP75 || 0, fill: '#10B981' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {[
                          { name: 'Below P25', value: portfolioMetrics?.belowP25 || 0 },
                          { name: 'P25-P75', value: portfolioMetrics?.betweenP25P75 || 0 },
                          { name: 'Above P75', value: portfolioMetrics?.aboveP75 || 0 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Portfolio Summary */}
        {portfolioMetrics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Portfolio Summary</h3>
              <p className="mt-1 text-sm text-gray-600">Key insights about your pricing strategy</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {((portfolioMetrics.underpriced / portfolioMetrics.totalListings) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Underpriced</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {portfolioMetrics.underpriced} of {portfolioMetrics.totalListings} listings
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {((portfolioMetrics.betweenP25P75 / portfolioMetrics.totalListings) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Market Range</div>
                  <div className="text-xs text-gray-400 mt-1">
                    P25-P75 percentile
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {((portfolioMetrics.overpriced / portfolioMetrics.totalListings) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Overpriced</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Above P75 percentile
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Item-Level Drilldown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Item Performance</h3>
            <p className="mt-1 text-sm text-gray-600">Detailed analysis of individual listings</p>
          </div>
          <div className="p-6">
          
          <div className="space-y-4">
            {itemDetails.length > 0 ? (
              itemDetails.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.artist}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Your Price: </span>
                        <span className="font-medium">${item.userPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Market Median: </span>
                        <span className="font-medium">${item.marketMedian.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-600">Rank: </span>
                        <span className="font-medium">#{item.rank} of {item.totalListings}</span>
                      </div>
                      
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Mini sparkline */}
                  <div className="mt-2 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={item.priceHistory}>
                        <Line 
                          type="monotone" 
                          dataKey="userPrice" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="marketMedian" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No item data available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Run a simulation to see detailed item performance metrics.
                </p>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{selectedItem.title}</h4>
                  <p className="text-sm text-gray-500">{selectedItem.artist}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Your Price</p>
                    <p className="text-lg font-medium">${selectedItem.userPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Market Median</p>
                    <p className="text-lg font-medium">${selectedItem.marketMedian.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rank</p>
                    <p className="text-lg font-medium">#{selectedItem.rank} of {selectedItem.totalListings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delta</p>
                    <p className={`text-lg font-medium ${
                      selectedItem.delta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedItem.delta >= 0 ? '+' : ''}{selectedItem.delta.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedItem.priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="userPrice" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Your Price"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="marketMedian" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Market Median"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}