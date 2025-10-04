export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from the first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function formatLogsForCSV(logs: any[]) {
  return logs.map(log => ({
    'Run Date': new Date(log.runDate).toLocaleString(),
    'Type': log.isDryRun ? 'Dry Run' : 'Live Run',
    'Status': log.status,
    'Items Scanned': log.itemsScanned,
    'Items Updated': log.itemsUpdated,
    'Items Skipped': log.itemsSkipped,
    'Errors': log.errors,
    'Error Message': log.errorMessage || '',
  }))
}

export function formatSnapshotsForCSV(snapshots: any[]) {
  return snapshots.map(snapshot => ({
    'Listing ID': snapshot.listingId,
    'Before Price': snapshot.beforePrice?.toFixed(2) || '',
    'After Price': snapshot.afterPrice?.toFixed(2) || '',
    'Suggested Price': snapshot.suggestedPrice?.toFixed(2) || '',
    'Confidence': snapshot.confidence,
    'Decision': snapshot.decision,
    'Reasoning': snapshot.reasoning,
  }))
}




