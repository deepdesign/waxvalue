'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { LogsTable } from '@/components/LogsTable'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

export default function LogsPage() {
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
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Run History</h1>
              <p className="mt-2 text-lg text-gray-600">View detailed logs of all pricing simulations and updates</p>
            </div>
            
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Activity Logs</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Complete history of all pricing runs and changes</p>
          </div>
          <div className="p-6">
            <LogsTable />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
