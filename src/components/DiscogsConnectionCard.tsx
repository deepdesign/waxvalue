'use client'

import Link from 'next/link'
import {
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface DiscogsConnectionCardProps {
  user?: any
}

export function DiscogsConnectionCard({ user }: DiscogsConnectionCardProps) {
  const isConnected = !!user?.discogsUserId

  if (isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Discogs Connection</h2>
          <p className="mt-1 text-sm text-gray-600">Manage your Discogs account integration</p>
        </div>
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500" role="img" aria-label="Connected status">
                <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Discogs Account</p>
                  <p className="text-2xl font-bold text-gray-900">Connected</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Connected as</p>
                  <p className="text-sm font-semibold text-green-600">{user.username}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Status: Active</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul role="list" className="list-disc space-y-1 pl-5">
                      <li>Automated pricing suggestions enabled</li>
                      <li>Real-time market data access active</li>
                      <li>Bulk pricing updates available</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/settings'}
                    >
                      Manage connection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Discogs Connection</h2>
        <p className="mt-1 text-sm text-gray-600">Connect your Discogs account to enable automated pricing</p>
      </div>
      <div className="p-6">
        <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500" role="img" aria-label="Disconnected status">
                <ExclamationCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Discogs Account</p>
                <p className="text-2xl font-bold text-gray-900">Not Connected</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-0.5 text-sm font-medium text-orange-800">
                  Action required
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="rounded-md bg-orange-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-orange-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">Connect your Discogs account</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>Link your account to unlock automated pricing and market analysis features.</p>
                  <ul role="list" className="mt-2 list-disc space-y-1 pl-5">
                    <li>Get automated price suggestions</li>
                    <li>Access real-time market analysis</li>
                    <li>Enable bulk pricing updates</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Connect now
                    <ChevronRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
