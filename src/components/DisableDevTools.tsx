'use client'

import { useEffect } from 'react'

// Extend Window interface for React DevTools hook
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      [key: string]: any
    }
  }
}

export function DisableDevTools() {
  useEffect(() => {
    // Disable React DevTools in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      const noop = () => {}
      
      // Disable React DevTools hook
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        try {
          // Override all methods to no-ops
          Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).forEach(key => {
            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__![key]
            if (typeof hook === 'function') {
              window.__REACT_DEVTOOLS_GLOBAL_HOOK__![key] = noop
            } else if (hook && typeof hook === 'object') {
              Object.keys(hook).forEach(subKey => {
                if (typeof hook[subKey] === 'function') {
                  hook[subKey] = noop
                }
              })
            }
          })
        } catch (e) {
          // Silently fail if DevTools hook is not accessible
        }
      }
      
      // Prevent DevTools from initializing
      try {
        Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
          get: () => undefined,
          set: () => {},
          configurable: false,
        })
      } catch (e) {
        // Property may already be defined, ignore
      }
    }
  }, [])

  return null
}

