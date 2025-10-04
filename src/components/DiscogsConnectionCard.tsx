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

interface DiscogsConnectionCardProps {
  user?: any
}

export function DiscogsConnectionCard({ user }: DiscogsConnectionCardProps) {
  const isConnected = !!user?.discogsUserId

  if (isConnected) {
    return (
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
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
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        href="/settings"
                        className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                      >
                        Manage connection
                      </Link>
                    </div>
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
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
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
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      href="/settings"
                      className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      <LinkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Connect now
                      <ChevronRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
