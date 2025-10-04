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

  const faqs = [
    {
      question: "How do I connect my Discogs account?",
      answer: "Click the 'Connect Discogs' button on the welcome page and follow the step-by-step wizard. You'll be redirected to Discogs to authorize WaxValue to access your account."
    },
    {
      question: "How is pricing calculated?",
      answer: "WaxValue analyzes market data from all active Discogs listings for each release, considering media and sleeve condition. Our algorithms use statistical analysis (median, mean, percentiles) combined with your custom strategies to suggest optimal prices."
    },
    {
      question: "What happens if I decline a price change?",
      answer: "Declined suggestions are logged but not applied. You can always revisit declined suggestions later, and they won't be suggested again unless market conditions change significantly."
    },
    {
      question: "How do I disconnect my account?",
      answer: "Go to Settings > Discogs Account and click 'Disconnect Account'. This will stop all automated pricing and remove your access tokens from our system."
    },
    {
      question: "What is Dry Run Mode?",
      answer: "Dry Run Mode simulates price changes without actually updating your Discogs listings. This lets you see what would happen before applying changes live. You can toggle this in the dashboard or set it as default in Settings."
    },
    {
      question: "How often should I run simulations?",
      answer: "We recommend running simulations weekly or when you add new inventory. You can set up daily automated runs in Settings, but manual review is always recommended before applying changes."
    },
    {
      question: "What does confidence level mean?",
      answer: "Confidence levels indicate how reliable our pricing suggestions are: High (strong market data, clear pricing pattern), Medium (some market data, reasonable suggestion), Low (limited data, use caution)."
    },
    {
      question: "Can I customize pricing strategies?",
      answer: "Yes! You can create custom strategies using different anchors (median, mean, etc.), offsets (percentage or fixed amount), condition weights, scarcity boosts, and safety limits. Preset strategies are also available for quick setup."
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Help & Support</h1>
          <p className="mt-2 text-lg text-gray-600">Get help with WaxValue and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center mb-6">
                <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Guides */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Guides</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">How Auto-Update Works</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      WaxValue can automatically apply safe price increases while keeping you in control.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800">
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

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Why Large Increases Need Approval</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Consumer protection is our priority. Large price changes could indicate market anomalies or errors.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
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

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">How to Disconnect</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      You can disconnect your Discogs account at any time from the Settings page.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
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

          {/* Support Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Get Support</h2>
              
              <div className="space-y-4">
                <a
                  href="mailto:support@waxvalue.com"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email Support</div>
                    <div className="text-xs text-gray-500">support@waxvalue.com</div>
                  </div>
                </a>

                <a
                  href="https://discord.gg/waxvalue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Discord Community</div>
                    <div className="text-xs text-gray-500">Join our Discord server</div>
                  </div>
                </a>

                <a
                  href="https://docs.waxvalue.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LinkIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Documentation</div>
                    <div className="text-xs text-gray-500">Read the full docs</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
              
              <div className="space-y-2">
                <a
                  href="https://www.discogs.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Discogs Developer Settings
                </a>
                <a
                  href="https://www.discogs.com/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Discogs API Documentation
                </a>
                <a
                  href="https://streamline-api.readme.io/reference/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Streamline API Documentation
                </a>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WaxValue API</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discogs API</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
