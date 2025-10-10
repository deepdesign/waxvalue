'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    setUser(null)
    setUserSettings(null)
    localStorage.removeItem('waxvalue_user')
    localStorage.removeItem('waxvalue_session_id')
    localStorage.removeItem('discogs_request_token')
    localStorage.removeItem('discogs_request_token_secret')
  }

  useEffect(() => {
    // Check for existing user session
    const checkAuth = async () => {
      try {
        // First check localStorage for user data
        const storedUser = localStorage.getItem('waxvalue_user')
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setIsLoading(false)
            return
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError)
            localStorage.removeItem('waxvalue_user')
            localStorage.removeItem('waxvalue_token')
          }
        }

        // If no stored user, check with backend (for Discogs-only auth)
        const storedToken = localStorage.getItem('waxvalue_token')
        if (storedToken) {
          const response = await fetch('/api/backend/auth/me')
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            localStorage.setItem('waxvalue_user', JSON.stringify(userData))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid tokens
        localStorage.removeItem('waxvalue_user')
        localStorage.removeItem('waxvalue_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

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
}
