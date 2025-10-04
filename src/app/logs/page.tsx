'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { LogsTable } from '@/components/LogsTable'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Run History</h1>
            <p className="text-gray-600">View detailed logs of all pricing simulations and updates</p>
          </div>
          
          <button className="btn-outline inline-flex items-center">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        <LogsTable />
      </div>
    </DashboardLayout>
  )
}
