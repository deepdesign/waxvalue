// CSV Export utilities for WaxValue logs and data

export interface CSVRow {
  [key: string]: string | number | boolean | null | undefined
}

export function exportToCSV(data: CSVRow[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from the first row
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return ''
        }
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
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

export function formatLogsForCSV(logs: any[]): CSVRow[] {
  return logs.map(log => ({
    'Run Date': log.runDate,
    'Run ID': log.id,
    'Type': log.isDryRun ? 'Dry Run' : 'Live Run',
    'Status': log.status,
    'Items Scanned': log.itemsScanned,
    'Items Updated': log.itemsUpdated,
    'Items Skipped': log.itemsSkipped || 0,
    'Errors': log.errors,
    'Error Message': log.errorMessage || '',
    'Duration (seconds)': log.duration || 0,
  }))
}

export function formatSnapshotsForCSV(snapshots: any[]): CSVRow[] {
  return snapshots.map(snapshot => ({
    'Run ID': snapshot.runLogId,
    'Listing ID': snapshot.listingId,
    'Before Price': snapshot.beforePrice,
    'After Price': snapshot.afterPrice || '',
    'Suggested Price': snapshot.suggestedPrice,
    'Decision': snapshot.decision,
    'Confidence': snapshot.confidence,
    'Reasoning': snapshot.reasoning,
    'Market Median': snapshot.marketData?.median || '',
    'Market Mean': snapshot.marketData?.mean || '',
    'Market Min': snapshot.marketData?.min || '',
    'Market Max': snapshot.marketData?.max || '',
    'Market Count': snapshot.marketData?.count || '',
    'Scarcity': snapshot.marketData?.scarcity || '',
  }))
}

export function formatSuggestionsForCSV(suggestions: any[]): CSVRow[] {
  return suggestions.map(suggestion => ({
    'Listing ID': suggestion.listingId,
    'Release Title': suggestion.release?.title || '',
    'Artist': suggestion.artist?.name || '',
    'Current Price': suggestion.currentPrice,
    'Suggested Price': suggestion.suggestedPrice,
    'Price Change': suggestion.suggestedPrice - suggestion.currentPrice,
    'Price Change %': ((suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice * 100).toFixed(2),
    'Basis': suggestion.basis,
    'Confidence': suggestion.confidence,
    'Condition': suggestion.condition,
    'Sleeve Condition': suggestion.sleeveCondition,
    'Market Median': suggestion.marketData?.median || '',
    'Market Mean': suggestion.marketData?.mean || '',
    'Market Min': suggestion.marketData?.min || '',
    'Market Max': suggestion.marketData?.max || '',
    'Market Count': suggestion.marketData?.count || '',
    'Scarcity': suggestion.marketData?.scarcity || '',
  }))
}

export function formatStrategiesForCSV(strategies: any[]): CSVRow[] {
  return strategies.map(strategy => ({
    'Strategy ID': strategy.id,
    'Name': strategy.name,
    'Anchor': strategy.anchor,
    'Offset Type': strategy.offsetType,
    'Offset Value': strategy.offsetValue,
    'Media Weight': strategy.conditionWeights?.media || '',
    'Sleeve Weight': strategy.conditionWeights?.sleeve || '',
    'Scarcity Threshold': strategy.scarcityBoost?.threshold || '',
    'Scarcity Boost %': strategy.scarcityBoost?.boostPercent || '',
    'Floor': strategy.floor || '',
    'Ceiling': strategy.ceiling || '',
    'Rounding': strategy.rounding,
    'Max Change %': strategy.maxChangePercent,
    'Active': strategy.isActive,
    'Created': strategy.createdAt,
    'Updated': strategy.updatedAt,
  }))
}

export function formatMetricsForCSV(metrics: any): CSVRow[] {
  return [
    {
      'Metric': 'Total Listings',
      'Value': metrics.totalListings || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Below P25',
      'Value': metrics.belowP25 || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Between P25-P75',
      'Value': metrics.betweenP25P75 || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Above P75',
      'Value': metrics.aboveP75 || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Average Delta',
      'Value': metrics.averageDelta || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Underpriced',
      'Value': metrics.underpriced || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
    {
      'Metric': 'Overpriced',
      'Value': metrics.overpriced || 0,
      'Date': new Date().toISOString().split('T')[0],
    },
  ]
}