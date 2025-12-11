'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, memo } from 'react'
import { ThemeProvider } from 'next-themes'
import { User, UserSettings } from '@/types'
import { InventoryProvider } from '@/contexts/InventoryContext'

interface AppContextType {
  user: User | null
  userSettings: UserSettings | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setUserSettings: (settings: UserSettings | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within a Providers')
  }
  return context
}

export const Providers = memo(function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setUserSettings(null)
    localStorage.removeItem('waxvalue_user')
    localStorage.removeItem('waxvalue_session_id')
    localStorage.removeItem('discogs_request_token')
    localStorage.removeItem('discogs_request_token_secret')
  }, [])

  useEffect(() => {
    // Check for existing user session
    const checkAuth = async () => {
      try {
        // First check localStorage for user data
        const storedUser = localStorage.getItem('waxvalue_user')
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            // Validate it's a proper user object
            if (userData && typeof userData === 'object' && userData.id) {
              setUser(userData)
              setIsLoading(false)
              
              // If user has Discogs connection but no avatar, fetch it in background
              // Don't wait for this - let UI render immediately for local testing
              if (userData.discogsUserId && !userData.avatar) {
                // Fetch avatar asynchronously without blocking
                fetchAvatarInBackground(userData).catch(() => {
                  // Silently fail - avatar fetch is non-critical for UI testing
                })
              }
              return // Exit early - we have valid user data
            } else {
              // Invalid user data structure
              console.warn('Invalid user data structure, clearing...')
              localStorage.removeItem('waxvalue_user')
              localStorage.removeItem('waxvalue_token')
            }
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError)
            localStorage.removeItem('waxvalue_user')
            localStorage.removeItem('waxvalue_token')
          }
        }

        // If no stored user, check with backend (for Discogs-only auth)
        const storedToken = localStorage.getItem('waxvalue_token')
        if (storedToken) {
          try {
            const response = await fetch('/api/backend/auth/me')
            if (response.ok) {
              const userData = await response.json()
              setUser(userData)
              localStorage.setItem('waxvalue_user', JSON.stringify(userData))
              
              // If user has Discogs connection but no avatar, fetch it
              if (userData.discogsUserId && !userData.avatar) {
                fetchAvatarInBackground(userData).catch(() => {
                  // Silently fail - avatar fetch is non-critical
                })
              }
            }
          } catch (fetchError) {
            // Backend fetch failed - don't clear existing data
            // This allows local testing with production session data
            console.warn('Backend auth check failed (might be expected in local dev):', fetchError)
          }
        }
      } catch (error) {
        // Only log, don't clear - preserve user data for local testing
        console.warn('Auth check error (non-fatal):', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch avatar in background and update user
    const fetchAvatarInBackground = async (currentUser: User) => {
      try {
        const response = await fetch('/api/backend/auth/refresh-avatar', {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.avatar) {
            const updatedUser = { ...currentUser, avatar: data.avatar }
            setUser(updatedUser)
            localStorage.setItem('waxvalue_user', JSON.stringify(updatedUser))
            // Avatar refreshed successfully
          }
        }
      } catch (error) {
        // Failed to refresh avatar - non-critical error
        // Non-critical error, don't show to user
      }
    }

    checkAuth()
  }, []) // Empty dependency array to run only once

  const value = {
    user,
    userSettings,
    isLoading,
    setUser,
    setUserSettings,
    setIsLoading,
    logout,
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContext.Provider value={value}>
        <InventoryProvider>
          {children}
        </InventoryProvider>
      </AppContext.Provider>
    </ThemeProvider>
  )
})
