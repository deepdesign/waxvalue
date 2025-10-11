'use client'

import { useRouter } from 'next/navigation'
import { 
  ExclamationTriangleIcon, 
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface OnboardingBannerProps {
  onDismiss?: () => void
}

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const router = useRouter()

  const handleConnect = () => {
    router.push('/settings')
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
            Waxvalue requires a Discogs connection to analyse your inventory and provide pricing suggestions. 
            This is the only way to access the app&apos;s core functionality.
          </p>
          <div className="mt-3">
            <Button
              onClick={handleConnect}
              size="sm"
              className="inline-flex items-center"
              aria-label="Connect your Discogs account to get started"
            >
              Connect Discogs
              <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
