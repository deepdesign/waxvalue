'use client'

import { useRouter } from 'next/navigation'
import { 
  ExclamationTriangleIcon, 
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface OnboardingBannerProps {
  onDismiss?: () => void
}

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const router = useRouter()

  const handleConnect = () => {
    router.push('/setup')
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Connect your Discogs account to get started
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            WaxValue requires a Discogs connection to analyze your inventory and provide pricing suggestions. 
            This is the only way to access the app&apos;s core functionality.
          </p>
          <div className="mt-3">
            <button
              onClick={handleConnect}
              className="btn-primary inline-flex items-center text-sm"
            >
              Connect Discogs
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
