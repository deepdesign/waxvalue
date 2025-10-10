import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a currency code is supported by Discogs API
 * @param currency - The currency code to validate
 * @returns True if the currency is supported by Discogs API
 */
export function isValidDiscogsCurrency(currency: string): boolean {
  const supportedCurrencies = [
    'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'CHF', 'MXN', 'BRL', 'NZD', 'SEK', 'ZAR'
  ]
  return supportedCurrencies.includes(currency.toUpperCase())
}

/**
 * Format a price with the correct currency symbol
 * Only supports currencies that Discogs API supports:
 * USD, GBP, EUR, CAD, AUD, JPY, CHF, MXN, BRL, NZD, SEK, ZAR
 * @param amount - The price amount
 * @param currency - The currency code (must be one of the Discogs supported currencies)
 * @returns Formatted price string with currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const upperCurrency = currency.toUpperCase()
  
  // Validate currency is supported by Discogs API
  if (!isValidDiscogsCurrency(upperCurrency)) {
    console.warn(`Unsupported currency: ${currency}. Falling back to USD.`)
    return formatCurrency(amount, 'USD')
  }
  
  // Only support currencies that Discogs API supports
  const currencySymbols: Record<string, string> = {
    'USD': '$',    // United States Dollar
    'GBP': '£',    // British Pound Sterling
    'EUR': '€',    // Euro
    'CAD': 'C$',   // Canadian Dollar
    'AUD': 'A$',   // Australian Dollar
    'JPY': '¥',    // Japanese Yen
    'CHF': 'CHF',  // Swiss Franc
    'MXN': '$',    // Mexican Peso
    'BRL': 'R$',   // Brazilian Real
    'NZD': 'NZ$',  // New Zealand Dollar
    'SEK': 'kr',   // Swedish Krona
    'ZAR': 'R'     // South African Rand
  }

  const symbol = currencySymbols[upperCurrency] || upperCurrency
  
  // JPY is the only currency in Discogs API that doesn't use decimal places
  if (upperCurrency === 'JPY') {
    return `${symbol}${Math.round(amount).toLocaleString()}`
  }
  
  return `${symbol}${amount.toFixed(2)}`
}