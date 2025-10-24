'use client'

import { useApp } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { DiscogsConnectionCard } from '@/components/DiscogsConnectionCard'
import { SettingsCard } from '@/components/SettingsCard'
import { Button } from '@/components/ui/Button'
import {
  UserIcon,
  MapPinIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UserProfile {
  username?: string
  name?: string
  home_page?: string
  location?: string
  profile?: string
  curr_abbr?: string
  id?: number
  resource_url?: string
}

export default function SettingsPage() {
  const { user, isLoading } = useApp()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchUserProfile = async () => {
    if (!user?.accessToken) return
    
    setProfileLoading(true)
    try {
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        console.error('No session ID found')
        return
      }
      
      const response = await fetch(`/api/backend/user/profile?session_id=${sessionId}`)
      if (response.ok) {
        const profile = await response.json()
        // Profile data received and processed
        setUserProfile({
          username: profile.username,
          name: profile.name,
          location: profile.location,
          curr_abbr: profile.curr_abbr,
          home_page: profile.home_page,
          profile: profile.profile
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch user profile:', response.status, errorData)
        toast.error(`Failed to load profile: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast.error('Failed to load profile information')
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    } else if (user?.accessToken) {
      fetchUserProfile()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router])

  const handleDisconnectAccount = async () => {
    if (!confirm('Are you sure you want to disconnect your Discogs account? This will stop all automated pricing.')) {
      return
    }

    try {
      const sessionId = localStorage.getItem('waxvalue_session_id')
      if (!sessionId) {
        throw new Error('No session found. Please login first.')
      }
      
      const response = await fetch('/api/backend/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (response.ok) {
        toast.success('Account disconnected successfully')
        // Refresh the page to show disconnected state
        window.location.reload()
      } else {
        throw new Error('Failed to disconnect account')
      }
    } catch (error) {
      // Disconnect error - handled by toast
      toast.error('Failed to disconnect account')
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullPage />
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage your account and application preferences</p>
        </div>

        <div className="space-y-6">
          {/* Discogs Account */}
          <DiscogsConnectionCard user={user} />

          {/* Display & Analysis Settings */}
          <SettingsCard />

          {/* User Profile Information */}
          {user?.accessToken && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Discogs profile</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your Discogs account information and preferences</p>
                  </div>
                  {userProfile?.username && (
                    <a
                      href={`https://www.discogs.com/user/${userProfile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      View on Discogs
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading profile...</span>
                  </div>
                ) : userProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        {userProfile.username || 'Not available'}
                      </p>
                    </div>

                    {/* Real Name */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Real Name</label>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        {userProfile.name || 'Not provided'}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        {userProfile.location || 'Not provided'}
                      </p>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        {userProfile.curr_abbr || 'Not set'}
                      </p>
                    </div>

                    {/* Website */}
                    {userProfile.home_page && (
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                        </div>
                        <a 
                          href={userProfile.home_page.startsWith('http') ? userProfile.home_page : `https://${userProfile.home_page}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg block"
                        >
                          {userProfile.home_page}
                        </a>
                      </div>
                    )}

                    {/* Bio */}
                    {userProfile.profile && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                          {userProfile.profile}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load profile information</p>
                    <Button
                      onClick={fetchUserProfile}
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

