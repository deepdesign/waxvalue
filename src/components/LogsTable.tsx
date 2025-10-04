'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { RunLog } from '@/types'
import { exportToCSV, formatLogsForCSV, formatSnapshotsForCSV } from '@/utils/csvExport'

interface LogsTableProps {
  className?: string
}

export function LogsTable({ className = '' }: LogsTableProps) {
  const [logs, setLogs] = useState<RunLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/backend/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'partial':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'badge badge-green',
      failed: 'badge badge-red',
      partial: 'badge badge-yellow',
    }
    return <span className={styles[status as keyof typeof styles] || 'badge'}>{status}</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleViewDetails = (runId: string) => {
    setSelectedRunId(selectedRunId === runId ? null : runId)
  }

  const handleExportLogs = () => {
    if (logs.length === 0) {
      console.warn('No logs to export')
      return
    }
    
    const csvData = formatLogsForCSV(logs)
    const filename = `waxvalue-logs-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(csvData, filename)
  }

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="card">
        <div className="mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Run History</h3>
            <p className="text-sm text-gray-500">Track all pricing simulation runs and their results</p>
          </div>
          {logs.length > 0 && (
            <button
              onClick={handleExportLogs}
              className="btn-outline inline-flex items-center justify-center w-full sm:w-auto"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No runs yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Run your first simulation to see results here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Scanned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.runDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.isDryRun 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {log.isDryRun ? 'Dry Run' : 'Live Run'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className="ml-2">{getStatusBadge(log.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.itemsScanned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.itemsUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={log.errors > 0 ? 'text-red-600 font-medium' : ''}>
                        {log.errors}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(log.id)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {selectedRunId === log.id ? 'Hide' : 'View'} Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {formatDate(log.runDate)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {log.isDryRun ? 'Dry Run' : 'Live Run'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(log.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Items Scanned</label>
                      <div className="mt-1 text-sm font-medium text-gray-900">{log.itemsScanned}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Items Updated</label>
                      <div className="mt-1 text-sm font-medium text-gray-900">{log.itemsUpdated}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</label>
                      <div className={`mt-1 text-sm font-medium ${log.errors > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {log.errors}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetails(log.id)}
                      className="btn-outline text-sm py-2 px-4"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {selectedRunId === log.id ? 'Hide' : 'View'} Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Run Details */}
      {selectedRunId && (
        <RunDetails runId={selectedRunId} />
      )}
    </div>
  )
}

interface RunDetailsProps {
  runId: string
}

function RunDetails({ runId }: RunDetailsProps) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSnapshots()
  }, [runId])

  const fetchSnapshots = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/backend/logs/${runId}/snapshots`)
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data.snapshots || [])
      }
    } catch (error) {
      console.error('Failed to fetch snapshots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Run Details</h3>
        <p className="text-sm text-gray-500">Individual item changes from this run</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No detailed data available for this run.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Before Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Decision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reasoning
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {snapshot.listingId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${snapshot.beforePrice?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${snapshot.suggestedPrice?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      snapshot.decision === 'applied' 
                        ? 'bg-green-100 text-green-800'
                        : snapshot.decision === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {snapshot.decision}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      snapshot.confidence === 'high'
                        ? 'bg-green-100 text-green-800'
                        : snapshot.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {snapshot.confidence}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {snapshot.reasoning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}