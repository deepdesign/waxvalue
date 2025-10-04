'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "How does WaxValue work?",
    answer: "WaxValue connects to your Discogs account and analyzes your listings against wider marketplace data. It suggests price changes based on market trends, condition, and other factors, but you maintain full control over which changes are applied."
  },
  {
    question: "Is my Discogs account secure?",
    answer: "Yes, we use OAuth 1.0a to securely connect to your Discogs account. We never store your password and only access the specific permissions you authorize. You can revoke access at any time."
  },
  {
    question: "What data does WaxValue access?",
    answer: "We only access your inventory listings, their current prices, and basic item information. We don't access personal information, messages, or any other private data from your Discogs account."
  },
  {
    question: "How often are prices updated?",
    answer: "You can configure how often WaxValue runs. By default, it checks for price changes daily, but you can set custom schedules or run manual simulations anytime."
  },
  {
    question: "Can I undo price changes?",
    answer: "Yes, all changes are logged and you can manually revert any price changes. WaxValue also has safeguards to prevent large price swings and always asks for approval on significant changes."
  },
  {
    question: "What if I disagree with a price suggestion?",
    answer: "You have complete control. WaxValue only suggests changes - you can approve, decline, or modify any suggestion. The system learns from your preferences over time."
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
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
          </div>

          {/* Right Column - Support and Links */}
          <div className="lg:col-span-2 space-y-6">
            {/* Get Support */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Get Support</h2>
              
              <div className="space-y-4">
                <a
                  href="mailto:support@waxvalue.com"
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Support</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">support@waxvalue.com</div>
                  </div>
                </a>

                <a
                  href="https://discord.gg/waxvalue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Discord Community</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Join our Discord server</div>
                  </div>
                </a>

                <a
                  href="https://docs.waxvalue.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <LinkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Documentation</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Read the full docs</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Links and System Status in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Links</h2>
                
                <div className="space-y-2">
                  <a
                    href="https://www.discogs.com/settings/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                  >
                    Discogs Developer Settings
                  </a>
                  <a
                    href="https://www.discogs.com/settings/oauth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                  >
                    Discogs OAuth Apps
                  </a>
                  <a
                    href="/settings"
                    className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                  >
                    WaxValue Settings
                  </a>
                  <a
                    href="/logs"
                    className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                  >
                    View Run History
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
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                      Operational
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Guides */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Detailed Guides</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">How Auto-Update Works</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      WaxValue can automatically apply safe price increases while keeping you in control.
                    </p>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 text-xs text-green-800 dark:text-green-200">
                      <p className="font-medium mb-1">Safe Automation Rules:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Only price increases are applied automatically</li>
                        <li>All decreases require manual approval</li>
                        <li>Large increases above your threshold require approval</li>
                        <li>All changes are logged for full transparency</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Why Large Increases Need Approval</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Consumer protection is our priority. Large price changes could indicate market anomalies or errors.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-xs text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">What gets flagged:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Increases above your threshold percentage</li>
                        <li>Any price decreases (always require approval)</li>
                        <li>Changes that seem unusual for the item</li>
                        <li>Items with low confidence scores</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">How to Disconnect</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can disconnect your Discogs account at any time from the Settings page.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-xs text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">What happens when you disconnect:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All automated pricing stops immediately</li>
                        <li>Your access tokens are removed from our system</li>
                        <li>You can reconnect anytime with the same process</li>
                        <li>Your pricing history and logs are preserved</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}