'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  QuestionMarkCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "How does WaxValue work?",
    answer: "WaxValue connects to your Discogs account via OAuth and analyzes your 'For Sale' listings using Discogs' marketplace data and price suggestion API. It provides condition-specific price recommendations based on real market data, and you maintain full control over which changes to apply."
  },
  {
    question: "Is my Discogs account secure?",
    answer: "Yes, we use OAuth 1.0a to securely connect to your Discogs account. We never store your password and only access the permissions you authorize. You can disconnect your account anytime from the Settings page."
  },
  {
    question: "What data does WaxValue access?",
    answer: "We only access your inventory listings (items marked 'For Sale'), their current prices, and basic item information. We don't access personal information, messages, orders, or any other private data from your Discogs account."
  },
  {
    question: "How are prices calculated?",
    answer: "Currently, you manually run a pricing analysis from the Dashboard. WaxValue fetches your 'For Sale' inventory, then uses Discogs' price suggestion API to get condition-specific recommendations for each release. The suggestions are based on current marketplace data."
  },
  {
    question: "Can I undo price changes?",
    answer: "Currently, price changes are applied directly to Discogs. You can manually change any price back through the Discogs interface or by running another analysis. All changes are applied one at a time with your explicit approval."
  },
  {
    question: "What if I disagree with a price suggestion?",
    answer: "You have complete control. You can adjust the suggested price up or down before applying it, or skip items entirely. WaxValue only suggests - you decide what gets applied."
  },
  {
    question: "How does WaxValue determine suggested prices?",
    answer: "WaxValue uses Discogs' price suggestion API which analyzes current market conditions for each release and matches your item's condition (media and sleeve) to market data. Items are classified as underpriced (suggested price 10%+ higher), overpriced (10%+ lower), or fairly priced (within 10%)."
  }
]

export default function HelpPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Help & Support</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Get help with WaxValue and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - FAQ and Detailed Guides (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-6">
                <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Guides */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">How to Use WaxValue</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Running a Pricing Analysis</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click "Refresh Analysis" on the Dashboard to analyze your inventory. WaxValue will:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-2">
                      <li>Fetch all your "For Sale" items from Discogs</li>
                      <li>Get market-based price suggestions for each item</li>
                      <li>Display suggestions sorted by largest potential price increase</li>
                      <li>Let you review, adjust, and apply changes individually or in bulk</li>
                    </ol>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Due to Discogs API rate limits (60 requests/minute), analysis may take several minutes for large inventories.
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">How Pricing Suggestions Work</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      WaxValue uses Discogs' official price suggestion API to provide accurate, market-based recommendations.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">How Suggestions Are Calculated:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Release ID:</strong> Identifies the exact release in the Discogs database</li>
                        <li><strong>Condition Matching:</strong> Considers both media and sleeve condition</li>
                        <li><strong>Market Data:</strong> Analyzes recent sales and current listings</li>
                        <li><strong>Conservative Approach:</strong> Suggests prices based on "Good" condition baseline</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Status Classifications:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Underpriced:</strong> Suggested price is 10%+ higher than current price</li>
                        <li><strong>Overpriced:</strong> Suggested price is 10%+ lower than current price</li>
                        <li><strong>Fairly Priced:</strong> Current price is within 10% of suggested price</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Applying Price Changes</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can apply price changes individually or in bulk:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-2">
                      <li><strong>Individual:</strong> Click the blue "Apply" button on any row</li>
                      <li><strong>Adjust Before Applying:</strong> Use ⬆️⬇️ buttons to fine-tune the suggested price</li>
                      <li><strong>Bulk Apply:</strong> Check multiple items and click "Apply to Selected"</li>
                      <li><strong>Visual Feedback:</strong> Applied items show green checkmark and fade out after 2 seconds</li>
                    </ul>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Disconnecting Your Account</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can disconnect your Discogs account anytime from Settings → Discogs Connection.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-xs text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">What happens when you disconnect:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your OAuth tokens are removed from WaxValue</li>
                        <li>WaxValue can no longer access your Discogs account</li>
                        <li>You can reconnect anytime using "Continue with Discogs"</li>
                        <li>Your session data is cleared</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Links, System Status (1/3 width) */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Links</h2>
              
              <div className="space-y-2">
                <a
                  href="https://www.discogs.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Discogs Developer Settings
                </a>
                <a
                  href="https://www.discogs.com/settings/oauth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Discogs OAuth Apps
                </a>
                <a
                  href="/settings"
                  className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  WaxValue Settings
                </a>
                <a
                  href="/dashboard"
                  className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Dashboard
                </a>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">System Status</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">WaxValue API</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Discogs API</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}